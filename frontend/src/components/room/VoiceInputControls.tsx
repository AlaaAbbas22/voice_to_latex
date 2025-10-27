import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputControlsProps {
    isPushToTalkActive: boolean;
    recording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
}

export const VoiceInputControls = ({
    isPushToTalkActive,
    recording,
    onStartRecording,
    onStopRecording,
}: VoiceInputControlsProps) => {
    return (
        <div className="flex flex-col gap-3 mt-4">
            {/* Push-to-Talk Display */}
            <motion.div
                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-base font-medium transition-all duration-200 ${isPushToTalkActive
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
                    }`}
                whileHover={{ scale: isPushToTalkActive ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Mic
                    className={`h-5 w-5 ${isPushToTalkActive ? "animate-pulse" : ""}`}
                />
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

            {/* Divider */}
            <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                    or
                </span>
                <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Continuous Recording Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                    onClick={recording ? onStopRecording : onStartRecording}
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
    );
};

