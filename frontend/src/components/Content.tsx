import "regenerator-runtime/runtime";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import LatexDisplayer from "./Latex";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Mic,
  MicOff,
  Save,
  Copy,
  RefreshCw,
  BookOpen,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import RecordingManager, { TranscriptionMethod } from "../utils/recording";
import { TranscriptionToggle } from "./TranscriptionToggle";

interface Props {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  socket: any;
  router: any;
  latex: string;
  role: string;
  roomName: string;
}

export default function Content({
  text,
  setText,
  socket,
  router,
  latex,
  role,
  roomName,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [recording, setRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcriptionMethod, setTranscriptionMethod] = useState<TranscriptionMethod>("server");
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
            setText((prev) => prev + " " + transcribedText);
            toast.success(`Transcription: "${transcribedText.substring(0, 50)}${transcribedText.length > 50 ? '...' : ''}"`);
          }
        },
        onError: (error) => {
          toast.error(error);
        },
        isRecording: recording,
      });
    }
  }, [transcriptionMethod, setText]);

  useEffect(() => {
    debouncedEmitText(text);
  }, [text]);

  // Handle browser speech recognition for browser method
  useEffect(() => {
    if (transcript && transcriptionMethod === "browser") {
      setText((prev) => prev + " " + transcript);
      resetTranscript();
    }
  }, [transcript, setText, resetTranscript, transcriptionMethod]);

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

  // Push-to-talk: hold Ctrl (Windows/Linux) or Meta/Command (Mac)
  useEffect(() => {
    if (!recordingManagerRef.current) return;
    const handleKeyDown = async (e: KeyboardEvent) => {

      // Only respond to Ctrl key (Windows/Linux) or Command key (Mac)
      // Ignore other modifier keys like Windows key, Alt, etc.
      const isCtrlKey = e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight';

      if ((!isCtrlKey) || isPushToTalkActive) return;

      // Start PTT only if not already recording (avoid conflicts)
      try {
        await recordingManagerRef.current?.startPushToTalk();
        setIsPushToTalkActive(true);
      } catch { }
    };
    const handleKeyUp = async (e: KeyboardEvent) => {

      // Only respond to Ctrl key (Windows/Linux) or Command key (Mac)
      const isCtrlKey = e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight';

      if ((!isCtrlKey) || !isPushToTalkActive) return;

      // Key released -> stop PTT
      try {
        await recordingManagerRef.current?.stopPushToTalk();
        setIsPushToTalkActive(false);
      } catch { }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPushToTalkActive]);

  // Debounced socket emission
  const debouncedEmitText = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (newText: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (socket && socket.connected) {
            socket.emit("send-text", newText, router.asPath.split("#")[1]);
          }
        }, 800);
      };
    })(),
    [socket, router],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate saving - replace with actual API call if needed
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Document saved successfully");
    } catch (error) {
      toast.error("Failed to save document");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex);
    toast.success("LaTeX code copied to clipboard");
  };

  const handleDownloadPDF = () => {
    // This would be replaced with actual PDF generation and download
    toast.success("PDF download started");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Render different layouts based on user role
  const renderContent = () => {
    // For viewers, keep the tabbed interface
    if (role !== "editor") {
      return (
        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <motion.div variants={itemVariants}>
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent
            value="preview"
            className="flex-1 flex flex-col space-y-4"
          >
            <motion.div variants={itemVariants} className="flex-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle>LaTeX Preview</CardTitle>
                  <CardDescription>
                    Rendered output of LaTeX equations
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 bg-white p-6 rounded-md border overflow-auto">
                    <LatexDisplayer latex={latex} />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleCopyLatex}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy LaTeX
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleDownloadPDF}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      );
    }

    // For editors, show split view with editor and preview side by side
    return (
      <div className="flex-1 flex flex-col md:flex-row gap-4">
        <motion.div variants={itemVariants} className="flex-1 min-w-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>LaTeX Editor</CardTitle>
              <CardDescription>
                Type or use voice input to create LaTeX equations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                ref={textareaRef}
                className="w-full flex-1 text-lg resize-none font-mono"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                placeholder="Start typing here or use voice input..."
              />

              <div className="flex flex-wrap gap-2 mt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={recording ? stopRecording : startRecording}
                    variant={recording ? "destructive" : "default"}
                    className="flex items-center gap-2"
                  >
                    {recording ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Start Voice Input
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Push-to-talk hint */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${isPushToTalkActive
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-600"
                  }`}>
                  <Mic className={`h-4 w-4 ${isPushToTalkActive ? "animate-pulse" : ""}`} />
                  <span>
                    {isPushToTalkActive ? (
                      <>
                        <span className="font-medium">Recording...</span> Release <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl</kbd>
                      </>
                    ) : (
                      <>
                        Hold <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl</kbd> to speak
                      </>
                    )}
                  </span>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="flex-1 min-w-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>LaTeX Preview</CardTitle>
              <CardDescription>
                Rendered output of your LaTeX equations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 bg-white p-6 rounded-md border overflow-auto">
                <LatexDisplayer latex={latex} />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleCopyLatex}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy LaTeX
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div
      className="h-full w-full flex flex-col"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {roomName || "Untitled Document"}
        </h1>
        <p className="text-gray-500">
          You are in {role === "editor" ? "editing" : "viewing"} mode
        </p>
      </motion.div>

      {renderContent()}

      {/* Transcription method toggle - only show for editors */}
      {role === "editor" && (
        <TranscriptionToggle
          method={transcriptionMethod}
          onMethodChange={setTranscriptionMethod}
        />
      )}
    </motion.div>
  );
}
