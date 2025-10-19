import "regenerator-runtime/runtime";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
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
import { getCookie } from "cookies-next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Mic,
  MicOff,
  Copy,
  BookOpen,
  Download,
  Pencil,
  Type,
} from "lucide-react";
import { toast } from "react-hot-toast";
import RecordingManager, { TranscriptionMethod } from "../utils/recording";
import { TranscriptionToggle } from "./TranscriptionToggle";
import { copyToClipboard, downloadLatexAsPDF, debounce } from "@/lib/utils";
import { throttle } from "lodash";
import {
  DefaultSpinner,
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";

interface Props {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  socket: any;
  router: any;
  latex: string;
  role: string;
}

export default function Content({
  text,
  setText,
  socket,
  router,
  latex,
  role,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [recording, setRecording] = useState(false);
  const [transcriptionMethod, setTranscriptionMethod] = useState<TranscriptionMethod>("server");
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  // Tldraw state
  const [inputMode, setInputMode] = useState<"text" | "drawing">("text");
  const store = useMemo(() => createTLStore(), []);
  const [drawingLoadingState, setDrawingLoadingState] = useState<
    { status: "loading" } | { status: "ready" } | { status: "error"; error: string }
  >({
    status: "loading",
  });

  // Initialize recording manager (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      recordingManagerRef.current = new RecordingManager({
        method: transcriptionMethod,
        onChunkTranscribed: (transcribedText) => {
          if (transcribedText.trim()) {
            setText((prev) => prev + " " + transcribedText);
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

  // Tldraw persistence and socket handling
  useLayoutEffect(() => {
    setDrawingLoadingState({ status: "loading" });

    // Listen for drawing data from socket
    if (socket) {
      socket.on("receive-drawing", (data: string, username: string) => {
        if (username === getCookie("username")) return;
        if (data) {
          console.log(data)
          try {
            const snapshot = JSON.parse(data);
            loadSnapshot(store, snapshot);
          } catch (error: any) {
            console.error("Error loading drawing:", error);
            setDrawingLoadingState({ status: "error", error: error.message });
          }
        } else {
        }
      });
    }

    setDrawingLoadingState({ status: "ready" });

    // Setup store listener to emit changes to server
    const cleanupFn = store.listen(
      throttle(() => {
        const snapshot = getSnapshot(store);
        const snapshotString = JSON.stringify(snapshot);
        if (socket && socket.connected) {
          socket.emit("send-drawing", snapshotString, router.asPath.split("#")[1]);
        }
      }, 500)
    );

    return () => {
      cleanupFn();
      if (socket) {
        socket.off("receive-drawing");
      }
    };
  }, [store, socket, router]);

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

  // Debounced socket emission using utility function
  const debouncedEmitText = useMemo(
    () =>
      debounce((newText: string) => {
        if (socket && socket.connected) {
          socket.emit("send-text", newText, router.asPath.split("#")[1]);
        }
      }, 800),
    [socket, router],
  );

  const handleCopyLatex = () => {
    copyToClipboard(latex, "LaTeX code copied to clipboard");
  };

  const handleDownloadPDF = () => {
    downloadLatexAsPDF(latex);
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
      <div className="flex-1 flex flex-col md:flex-row gap-1">
        <motion.div variants={itemVariants} className="flex-1 min-w-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {inputMode === "text" ? "LaTeX Editor" : "Drawing Board"}
                  </CardTitle>
                  <CardDescription>
                    {inputMode === "text"
                      ? "Type or use voice input to create LaTeX equations"
                      : "Draw diagrams and illustrations"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setInputMode("text")}
                    variant={inputMode === "text" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Type className="h-4 w-4" />
                    Text
                  </Button>
                  <Button
                    onClick={() => setInputMode("drawing")}
                    variant={inputMode === "drawing" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Draw
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {inputMode === "text" ? (
                <>
                  <Textarea
                    ref={textareaRef}
                    className="w-full flex-1 text-lg resize-none font-mono"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                    }}
                    placeholder="Start typing here or use voice input..."
                  />

                  <div className="flex flex-col gap-3 mt-4">
                    <motion.div
                      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-base font-medium transition-all duration-200 ${isPushToTalkActive
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
                        }`}
                      whileHover={{ scale: isPushToTalkActive ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Mic className={`h-5 w-5 ${isPushToTalkActive ? "animate-pulse" : ""}`} />
                      <span>
                        {isPushToTalkActive ? (
                          <>
                            <span className="font-bold">🎙️ Recording...</span> Release{" "}
                            <kbd className="px-2 py-1 bg-white/20 border border-white/30 rounded text-sm font-mono ml-1">
                              Ctrl
                            </kbd>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">Press & Hold</span>{" "}
                            <kbd className="px-2 py-1 bg-white/20 border border-white/30 rounded text-sm font-mono mx-1">
                              Ctrl
                            </kbd>{" "}
                            <span className="font-semibold">to Speak</span>
                          </>
                        )}
                      </span>
                    </motion.div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">or</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={recording ? stopRecording : startRecording}
                        variant={recording ? "destructive" : "outline"}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        {recording ? (
                          <>
                            <MicOff className="h-4 w-4" />
                            Stop Continuous Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            Start Continuous Voice Input
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="flex-1 w-full h-full min-h-[500px]">
                  {drawingLoadingState.status === "loading" && (
                    <div className="flex items-center justify-center h-full">
                      <DefaultSpinner />
                    </div>
                  )}
                  {drawingLoadingState.status === "error" && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <h2 className="text-xl font-bold text-red-600">Error!</h2>
                      <p className="text-gray-600">{drawingLoadingState.error}</p>
                    </div>
                  )}
                  {drawingLoadingState.status === "ready" && (
                    <div className="w-full h-full">
                      <Tldraw store={store} />
                    </div>
                  )}
                </div>
              )}
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
