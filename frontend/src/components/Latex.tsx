import React, { useEffect, useRef } from "react";
import { formatLatex } from "@/lib/utils";

interface LatexDisplayerProps {
  latex: string;
}

const LatexDisplayer: React.FC<LatexDisplayerProps> = ({ latex }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const formattedLatex = formatLatex(latex, "display");

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
          <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 20px;
              font-size: 18px;
              line-height: 1.6;
              overflow-x: auto;
            }
            .math-content {
              text-align: center;
              min-height: 50px;
            }
          </style>
        </head>
        <body>
          <div class="math-content">
            ${formattedLatex}
          </div>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
              },
              startup: {
                ready: () => {
                  MathJax.startup.defaultReady();
                }
              }
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  }, [latex]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="LaTeX Preview"
    />
  );
};

export default LatexDisplayer;
