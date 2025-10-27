import { Dispatch, SetStateAction, RefObject } from "react";
import { motion } from "framer-motion";
import { EditorViewPanel } from "./EditorViewPanel";
import { LaTeXPreviewPanel } from "./LaTeXPreviewPanel";

interface EditorViewProps {
  inputMode: "text" | "drawing";
  onInputModeChange: (mode: "text" | "drawing") => void;
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  textareaRef: RefObject<HTMLTextAreaElement>;
  debouncedEmitText: (text: string) => void;
  isPushToTalkActive: boolean;
  recording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  drawingLoadingState:
    | { status: "loading" }
    | { status: "ready" }
    | { status: "error"; error: string };
  store: any;
  onDrawingMount: (editor: any) => void;
  latex: string;
  onCopyLatex: () => void;
  onDownloadPDF: () => void;
  itemVariants: any;
}

export const EditorView = ({
  inputMode,
  onInputModeChange,
  text,
  setText,
  textareaRef,
  debouncedEmitText,
  isPushToTalkActive,
  recording,
  onStartRecording,
  onStopRecording,
  drawingLoadingState,
  store,
  onDrawingMount,
  latex,
  onCopyLatex,
  onDownloadPDF,
  itemVariants,
}: EditorViewProps) => {
  return (
    <div className="flex-1 flex flex-col md:flex-row gap-1">
      <EditorViewPanel
        inputMode={inputMode}
        onInputModeChange={onInputModeChange}
        text={text}
        setText={setText}
        textareaRef={textareaRef}
        debouncedEmitText={debouncedEmitText}
        isPushToTalkActive={isPushToTalkActive}
        recording={recording}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        drawingLoadingState={drawingLoadingState}
        store={store}
        onDrawingMount={onDrawingMount}
        itemVariants={itemVariants}
      />

      <motion.div variants={itemVariants} className="flex-1 min-w-0">
        <LaTeXPreviewPanel
          latex={latex}
          onCopyLatex={onCopyLatex}
          onDownloadPDF={onDownloadPDF}
          description="Rendered output of your LaTeX equations"
        />
      </motion.div>
    </div>
  );
};

