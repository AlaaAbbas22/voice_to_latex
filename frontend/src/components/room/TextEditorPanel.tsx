import { Dispatch, SetStateAction, RefObject } from "react";
import { Textarea } from "../ui/textarea";
import { VoiceInputControls } from "./VoiceInputControls";

interface TextEditorPanelProps {
    text: string;
    setText: Dispatch<SetStateAction<string>>;
    textareaRef: RefObject<HTMLTextAreaElement>;
    debouncedEmitText: (text: string) => void;
    isPushToTalkActive: boolean;
    recording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
}

export const TextEditorPanel = ({
    text,
    setText,
    textareaRef,
    debouncedEmitText,
    isPushToTalkActive,
    recording,
    onStartRecording,
    onStopRecording,
}: TextEditorPanelProps) => {
    return (
        <>
            <Textarea
                ref={textareaRef}
                className="w-full flex-1 text-lg resize-none font-mono"
                value={text}
                onChange={(e) => {
                    const newText = e.target.value;
                    setText(newText);
                    debouncedEmitText(newText);
                }}
                placeholder="Start typing here or use voice input..."
            />

            <VoiceInputControls
                isPushToTalkActive={isPushToTalkActive}
                recording={recording}
                onStartRecording={onStartRecording}
                onStopRecording={onStopRecording}
            />
        </>
    );
};

