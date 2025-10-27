import { Button } from "../ui/button";
import { Type, Pencil } from "lucide-react";

interface InputModeSwitcherProps {
    inputMode: "text" | "drawing";
    onModeChange: (mode: "text" | "drawing") => void;
}

export const InputModeSwitcher = ({
    inputMode,
    onModeChange,
}: InputModeSwitcherProps) => {
    return (
        <div className="flex gap-2">
            <Button
                onClick={() => onModeChange("text")}
                variant={inputMode === "text" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
            >
                <Type className="h-4 w-4" />
                Text
            </Button>
            <Button
                onClick={() => onModeChange("drawing")}
                variant={inputMode === "drawing" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
            >
                <Pencil className="h-4 w-4" />
                Draw
            </Button>
        </div>
    );
};

