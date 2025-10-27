import "regenerator-runtime/runtime";
import {
  Dispatch,
  SetStateAction,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import { motion } from "framer-motion";
import { TranscriptionMethod } from "../utils/recording";
import { TranscriptionToggle } from "./TranscriptionToggle";
import { copyToClipboard, downloadLatexAsPDF, debounce } from "@/lib/utils";
import { createTLStore } from "tldraw";
import "tldraw/tldraw.css";
import { handleReceiveDrawing, createDrawingEmitter } from "@/utils/drawing";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { EditorView } from "./room/EditorView";
import { ViewerView } from "./room/ViewerView";

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
  const [transcriptionMethod, setTranscriptionMethod] = useState<TranscriptionMethod>("server");

  // Tldraw state
  const [inputMode, setInputMode] = useState<"text" | "drawing">("text");
  const store = useMemo(() => createTLStore(), []);
  const [drawingLoadingState, setDrawingLoadingState] = useState<
    { status: "loading" } | { status: "ready" } | { status: "error"; error: string }
  >({
    status: "loading",
  });
  const isLoadingFromSocket = useRef(false);
  const editorRef = useRef<any>(null);
  const lastEmittedSnapshotRef = useRef<string>("");

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

  // Voice recording hook
  const { recording, isPushToTalkActive, startRecording, stopRecording } =
    useVoiceRecording({
      transcriptionMethod,
      setText,
      debouncedEmitText,
    });

  // Tldraw persistence and socket handling
  useLayoutEffect(() => {
    setDrawingLoadingState({ status: "loading" });

    // Listen for drawing data from socket
    if (socket) {
      socket.on("receive-drawing", (data: string, username: string) => {
        handleReceiveDrawing(
          data,
          username,
          store,
          isLoadingFromSocket,
          lastEmittedSnapshotRef,
          setDrawingLoadingState
        );
      });
    }

    setDrawingLoadingState({ status: "ready" });

    // Setup store listener to emit changes to server with debounce
    const roomId = router.asPath.split("#")[1];
    const debouncedEmitDrawing = createDrawingEmitter(
      store,
      socket,
      roomId,
      isLoadingFromSocket,
      lastEmittedSnapshotRef,
      editorRef
    );

    const cleanupFn = store.listen(() => {
      debouncedEmitDrawing();
    });

    return () => {
      cleanupFn();
      if (socket) {
        socket.off("receive-drawing");
      }
    };
  }, [store, socket, router]);

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
        <ViewerView
          latex={latex}
          onCopyLatex={handleCopyLatex}
          onDownloadPDF={handleDownloadPDF}
          itemVariants={itemVariants}
        />
      );
    }

    // For editors, show split view with editor and preview side by side
    return (
      <EditorView
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        text={text}
        setText={setText}
        textareaRef={textareaRef}
        debouncedEmitText={debouncedEmitText}
        isPushToTalkActive={isPushToTalkActive}
        recording={recording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        drawingLoadingState={drawingLoadingState}
        store={store}
        onDrawingMount={(editor) => {
          editorRef.current = editor;
        }}
        latex={latex}
        onCopyLatex={handleCopyLatex}
        onDownloadPDF={handleDownloadPDF}
        itemVariants={itemVariants}
      />
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
