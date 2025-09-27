import React from 'react';
import { Button } from './ui/button';
import { Mic, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { TranscriptionMethod } from '../utils/recording';

interface TranscriptionToggleProps {
    method: TranscriptionMethod;
    onMethodChange: (method: TranscriptionMethod) => void;
}

export const TranscriptionToggle: React.FC<TranscriptionToggleProps> = ({
    method,
    onMethodChange,
}) => {
    const handleMethodChange = (newMethod: TranscriptionMethod) => {
        onMethodChange(newMethod);
        toast.success(`Switched to ${newMethod === 'browser' ? 'Browser' : 'Server'} transcription`);
    };

    return (
        <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white rounded-lg shadow-lg border p-2 flex gap-1">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={() => handleMethodChange('server')}
                        variant={method === 'server' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-2 px-3 py-2"
                    >
                        <Server className="h-4 w-4" />
                        <span className="hidden sm:inline">Server</span>
                    </Button>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={() => handleMethodChange('browser')}
                        variant={method === 'browser' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-2 px-3 py-2"
                    >
                        <Mic className="h-4 w-4" />
                        <span className="hidden sm:inline">Browser</span>
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
};
