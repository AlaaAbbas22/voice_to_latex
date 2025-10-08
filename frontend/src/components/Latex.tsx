import React from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";

interface LatexDisplayerProps {
  latex: string;
}

const LatexDisplayer: React.FC<LatexDisplayerProps> = ({ latex }) => {
  // Check if the latex contains line breaks (\\)
  const hasLineBreaks = latex.includes("\\\\");

  // If there are line breaks, wrap in a gather* environment for proper rendering
  // gather* centers each line and doesn't number equations
  const formattedLatex = hasLineBreaks
    ? `$$\\begin{gathered}${latex}\\end{gathered}$$`
    : `$$${latex}$$`;

  return (
    <MathJaxContext>
      <MathJax>{formattedLatex}</MathJax>
    </MathJaxContext>
  );
};

export default LatexDisplayer;
