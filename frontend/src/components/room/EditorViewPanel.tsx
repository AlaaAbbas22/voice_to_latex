import { Dispatch, SetStateAction, RefObject } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../ui/card";
import { InputModeSwitcher } from "./InputModeSwitcher";
import { TextEditorPanel } from "./TextEditorPanel";
import { DrawingBoard } from "./DrawingBoard";

interface EditorViewPanelProps {
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
    itemVariants: any;
}

export const EditorViewPanel = ({
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
    itemVariants,
}: EditorViewPanelProps) => {
    return (
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
                        <InputModeSwitcher
                            inputMode={inputMode}
                            onModeChange={onInputModeChange}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    {inputMode === "text" ? (
                        <TextEditorPanel
                            text={text}
                            setText={setText}
                            textareaRef={textareaRef}
                            debouncedEmitText={debouncedEmitText}
                            isPushToTalkActive={isPushToTalkActive}
                            recording={recording}
                            onStartRecording={onStartRecording}
                            onStopRecording={onStopRecording}
                        />
                    ) : (
                        <DrawingBoard
                            store={store}
                            drawingLoadingState={drawingLoadingState}
                            onMount={onDrawingMount}
                        />
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

