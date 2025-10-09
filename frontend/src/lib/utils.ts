import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-hot-toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format LaTeX string with proper environment for line breaks
 * @param latex - Raw LaTeX string
 * @param displayMode - Whether to use display mode delimiters (\\[ \\]) or inline ($$ $$)
 * @returns Formatted LaTeX string
 */
export function formatLatex(
  latex: string,
  displayMode: "display" | "inline" = "inline"
): string {
  const hasLineBreaks = latex.includes("\\\\");

  if (displayMode === "display") {
    // For print/PDF output using \[ \]
    return hasLineBreaks
      ? `\\[\\begin{gathered}${latex}\\end{gathered}\\]`
      : `\\[${latex}\\]`;
  } else {
    // For inline display using $$ $$
    return hasLineBreaks
      ? `$$\\begin{gathered}${latex}\\end{gathered}$$`
      : `$$${latex}$$`;
  }
}

/**
 * Copy text to clipboard and show a success toast
 */
export function copyToClipboard(
  text: string,
  successMessage: string = "Copied to clipboard"
) {
  navigator.clipboard.writeText(text);
  toast.success(successMessage);
}

/**
 * Download LaTeX as PDF by opening a print dialog
 */
export function downloadLatexAsPDF(latex: string) {
  // Create a new window with just the LaTeX content for printing/PDF
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Please allow pop-ups to download PDF");
    return;
  }

  // Write the content to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>LaTeX Document</title>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            font-size: 16px;
            line-height: 1.6;
          }
          .math-content {
            margin: 20px 0;
            text-align: center;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="math-content">
          ${formatLatex(latex, "display")}
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
                MathJax.startup.promise.then(() => {
                  // Wait a bit for rendering to complete, then trigger print
                  setTimeout(() => {
                    window.print();
                  }, 500);
                });
              }
            }
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();

  toast.success("Opening print dialog - save as PDF");
}

/**
 * Create a debounced function that delays execution
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
