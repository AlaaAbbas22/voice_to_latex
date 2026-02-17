import React, { useEffect, useRef } from "react";
import { formatLatex } from "@/lib/utils";

interface LatexDisplayerProps {
  latex: string;
  highContrast?: boolean;
}

const LatexDisplayer: React.FC<LatexDisplayerProps> = ({ latex, highContrast = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const formattedLatex = formatLatex(latex, "display");

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const highContrastStyles = highContrast
      ? `
      body { background: #0a0a0a !important; color: #ffffff !important; }
      body *, .math-content, .math-content * { color: #ffffff !important; }
      .mjx-chtml, .mjx-chtml *, .MathJax * { color: #ffffff !important; fill: #ffffff !important; }
      svg *, [fill] { fill: #ffffff !important; }
      [stroke] { stroke: #ffffff !important; }
      `
      : "";

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
            ${highContrastStyles}
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
  }, [latex, highContrast]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="LaTeX Preview"
    />
  );
};

export default LatexDisplayer;
