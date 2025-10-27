import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BookOpen } from "lucide-react";
import { LaTeXPreviewPanel } from "./LaTeXPreviewPanel";

interface ViewerViewProps {
  latex: string;
  onCopyLatex: () => void;
  onDownloadPDF: () => void;
  itemVariants: any;
}

export const ViewerView = ({
  latex,
  onCopyLatex,
  onDownloadPDF,
  itemVariants,
}: ViewerViewProps) => {
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

      <TabsContent value="preview" className="flex-1 flex flex-col space-y-4">
        <motion.div variants={itemVariants} className="flex-1">
          <LaTeXPreviewPanel
            latex={latex}
            onCopyLatex={onCopyLatex}
            onDownloadPDF={onDownloadPDF}
            description="Rendered output of LaTeX equations"
          />
        </motion.div>
      </TabsContent>
    </Tabs>
  );
};

