import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { toast } from "react-hot-toast";
import RecordingManager, { TranscriptionMethod } from "../utils/recording";

interface UseVoiceRecordingOptions {
  transcriptionMethod: TranscriptionMethod;
  setText: Dispatch<SetStateAction<string>>;
  debouncedEmitText: (text: string) => void;
}

export const useVoiceRecording = ({
  transcriptionMethod,
  setText,
  debouncedEmitText,
}: UseVoiceRecordingOptions) => {
  const [recording, setRecording] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  // Initialize recording manager (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      recordingManagerRef.current = new RecordingManager({
        method: transcriptionMethod,
        onChunkTranscribed: (transcribedText) => {
          if (transcribedText.trim()) {
            setText((prev) => {
              const newText = prev + " " + transcribedText;
              debouncedEmitText(newText);
              return newText;
            });
          }
        },
        onError: (error) => {
          toast.error(error);
        },
        isRecording: recording,
      });
    }
  }, [transcriptionMethod, setText, recording, debouncedEmitText]);

  // Handle browser speech recognition for browser method
  useEffect(() => {
    if (transcript && transcriptionMethod === "browser") {
      setText((prev) => {
        const newText = prev + " " + transcript;
        debouncedEmitText(newText);
        return newText;
      });
      resetTranscript();
    }
  }, [
    transcript,
    setText,
    resetTranscript,
    transcriptionMethod,
    debouncedEmitText,
  ]);

  // Push-to-talk: hold Ctrl (Windows/Linux) or Meta/Command (Mac)
  useEffect(() => {
    if (!recordingManagerRef.current) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only respond to Ctrl key (Windows/Linux) or Command key (Mac)
      // Ignore other modifier keys like Windows key, Alt, etc.
      const isCtrlKey =
        e.key === "Control" ||
        e.code === "ControlLeft" ||
        e.code === "ControlRight";

      if (!isCtrlKey || isPushToTalkActive) return;

      // Start PTT only if not already recording (avoid conflicts)
      try {
        await recordingManagerRef.current?.startPushToTalk();
        setIsPushToTalkActive(true);
      } catch {}
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      // Only respond to Ctrl key (Windows/Linux) or Command key (Mac)
      const isCtrlKey =
        e.key === "Control" ||
        e.code === "ControlLeft" ||
        e.code === "ControlRight";

      if (!isCtrlKey || !isPushToTalkActive) return;

      // Key released -> stop PTT
      try {
        await recordingManagerRef.current?.stopPushToTalk();
        setIsPushToTalkActive(false);
      } catch {}
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPushToTalkActive]);

  const startRecording = async () => {
    if (typeof window === "undefined") {
      toast.error("Recording not available on server side");
      return;
    }

    if (transcriptionMethod === "browser") {
      if (!browserSupportsSpeechRecognition) {
        toast.error("Your browser doesn't support speech recognition");
        return;
      }
      setRecording(true);
      SpeechRecognition.startListening({ continuous: true });
      toast.success("Browser voice recording started");
    } else {
      // Server method using MediaRecorder
      if (!recordingManagerRef.current) {
        toast.error("Recording manager not initialized - please wait");
        return;
      }
      try {
        await recordingManagerRef.current?.startRecording();
        setRecording(true);
        toast.success("Server voice recording started");
      } catch (error) {
        toast.error("Failed to start recording");
      }
    }
  };

  const stopRecording = () => {
    if (transcriptionMethod === "browser") {
      setRecording(false);
      SpeechRecognition.stopListening();
      resetTranscript();
      toast.success("Browser voice recording stopped");
    } else {
      // Server method
      recordingManagerRef.current?.stopRecording();
      setRecording(false);
      toast.success("Server voice recording stopped");
    }
  };

  return {
    recording,
    isPushToTalkActive,
    startRecording,
    stopRecording,
  };
};
