import dynamic from "next/dynamic";

export type TranscriptionMethod = "browser" | "server";

export interface TranscriptionOptions {
  method: TranscriptionMethod;
  onChunkTranscribed?: (text: string) => void;
  onError?: (error: string) => void;
  isRecording?: boolean;
}

class RecordingManager {
  private mrStream: any = null;
  private stream: MediaStream | null = null;
  private options: TranscriptionOptions;
  private chunkCount: number = 0;
  private dataHandler: ((chunk: any) => void) | null = null;
  private errorHandler: ((error: any) => void) | null = null;

  constructor(options: TranscriptionOptions) {
    this.options = options;
  }

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Dynamic import to avoid SSR issues
      // @ts-ignore
      const mediaRecorderStream = (await import("media-recorder-stream"))
        .default;
      console.log("mediaRecorderStream", mediaRecorderStream);

      this.mrStream = mediaRecorderStream(this.stream, {
        mimeType: "audio/webm",
        interval: 5000,
      });

      // Create event handlers once
      this.dataHandler = (chunk: any) => {
        this.chunkCount++;
        console.log(`🎵 Chunk #${this.chunkCount} received:`, chunk);

        // Convert chunk to blob if needed
        let blob: Blob;
        if (chunk instanceof Blob) {
          blob = chunk;
        } else if (Buffer.isBuffer(chunk)) {
          blob = new Blob([new Uint8Array(chunk)], { type: "audio/webm" });
        } else {
          blob = new Blob([chunk], { type: "audio/webm" });
        }

        // Create temporary URL for debugging
        const tempUrl = URL.createObjectURL(blob);
        console.log("🔗 Temporary audio URL:", tempUrl);

        // Process the chunk
        this.processChunk(blob);

        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(tempUrl);
        }, 30000); // Clean up after 30 seconds

        // Reset recorder for next chunk
        this.stopRecording();
        if (this.options.isRecording) {
          this.startRecording();
        }
      };

      this.errorHandler = (error: any) => {
        console.error("❌ MediaRecorderStream error:", error);
        this.options.onError?.(`Recording stream error: ${error}`);
      };

      // Attach event listeners
      this.mrStream.on("data", this.dataHandler);
      this.mrStream.on("error", this.errorHandler);
    } catch (error) {
      this.options.onError?.(`Failed to start recording: ${error}`);
    }
  }

  stopRecording(): void {
    if (this.mrStream) {
      // Remove event listeners before destroying
      if (this.dataHandler) {
        this.mrStream.off("data", this.dataHandler);
      }
      if (this.errorHandler) {
        this.mrStream.off("error", this.errorHandler);
      }

      this.mrStream.destroy();
      this.mrStream = null;
    }
    this.cleanup();
  }

  private async processChunk(blob: Blob): Promise<void> {
    try {
      if (this.options.method === "server") {
        await this.transcribeWithServer(blob);
      } else {
        await this.transcribeWithBrowser(blob);
      }
    } catch (error) {
      this.options.onError?.(`Transcription failed: ${error}`);
    }
  }

  private async transcribeWithServer(blob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append("audioFile", blob, "recording.webm");
    formData.append("language", "en");
    formData.append("prompt", "This is math content for a lecture");

    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "/transcribe",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      console.error("❌ Server error:", response.status, response.statusText);
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.text) {
      this.options.onChunkTranscribed?.(result.text);
    } else {
    }
  }

  private async transcribeWithBrowser(blob: Blob): Promise<void> {
    // For browser method, we'll use the existing react-speech-recognition
    // This is a placeholder - the actual browser transcription happens in the component
    console.log("Browser transcription for chunk:", blob);
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mrStream = null;
    this.chunkCount = 0;
    this.dataHandler = null;
    this.errorHandler = null;
    console.log("🧹 Recording cleanup completed");
  }

  isRecording(): boolean {
    return this.mrStream !== null;
  }
}

export default RecordingManager;
