import { DefaultSpinner, Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface DrawingBoardProps {
    store: any;
    drawingLoadingState:
    | { status: "loading" }
    | { status: "ready" }
    | { status: "error"; error: string };
    onMount: (editor: any) => void;
}

export const DrawingBoard = ({
    store,
    drawingLoadingState,
    onMount,
}: DrawingBoardProps) => {
    return (
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
                    <Tldraw store={store} onMount={onMount} />
                </div>
            )}
        </div>
    );
};

