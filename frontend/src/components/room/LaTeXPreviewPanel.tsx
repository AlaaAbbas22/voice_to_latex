import { motion } from "framer-motion";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../ui/card";
import { Copy, Download } from "lucide-react";
import LatexDisplayer from "../Latex";
import { useHighContrastOptional } from "@/contexts/HighContrastContext";

interface LaTeXPreviewPanelProps {
    latex: string;
    onCopyLatex: () => void;
    onDownloadPDF: () => void;
    description?: string;
}

export const LaTeXPreviewPanel = ({
    latex,
    onCopyLatex,
    onDownloadPDF,
    description = "Rendered output of your LaTeX equations",
}: LaTeXPreviewPanelProps) => {
    const highContrast = useHighContrastOptional();
    const isHighContrast = highContrast?.isHighContrast ?? false;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle>LaTeX Preview</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 bg-white p-6 rounded-md border overflow-auto">
                    <LatexDisplayer latex={latex} highContrast={isHighContrast} />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={onCopyLatex}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copy LaTeX
                        </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={onDownloadPDF}
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
    );
};

