import React from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";

interface LatexDisplayerProps {
    latex: string;
  }
  
  const LatexDisplayer: React.FC<LatexDisplayerProps> = ({ latex }) => {
    return (
      <MathJaxContext>
        <MathJax>{`$$${latex}$$`}</MathJax>
      </MathJaxContext>
    );
  };



export default LatexDisplayer;