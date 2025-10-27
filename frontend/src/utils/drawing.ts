import {
  Editor,
  TLStore,
  exportToBlob,
  getSnapshot,
  loadSnapshot,
} from "tldraw";
import { debounce } from "@/lib/utils";
import { getCookie } from "cookies-next";

/**
 * Exports the current drawing as a base64-encoded PNG image
 */
export const exportDrawingAsImage = async (
  editor: Editor | null
): Promise<string | null> => {
  try {
    if (!editor) {
      return null;
    }

    const shapeIds = editor.getCurrentPageShapeIds();

    if (shapeIds.size === 0) {
      // No shapes to export, skip
      return null;
    }

    const blob = await exportToBlob({
      editor,
      ids: Array.from(shapeIds),
      format: "png",
      opts: { background: true, padding: 16, scale: 2 },
    });

    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
    });
  } catch (error) {
    console.error("Error exporting drawing:", error);
    return null;
  }
};

/**
 * Handles receiving drawing data from socket and loading it into the store
 */
export const handleReceiveDrawing = (
  data: string,
  username: string,
  store: TLStore,
  isLoadingFromSocket: React.MutableRefObject<boolean>,
  lastEmittedSnapshotRef: React.MutableRefObject<string>,
  setDrawingLoadingState: (
    state:
      | { status: "loading" }
      | { status: "ready" }
      | { status: "error"; error: string }
  ) => void
) => {
  const currentUser = getCookie("username");
  if (username === currentUser) return;

  if (data) {
    try {
      // Set flag to prevent emitting back to server
      isLoadingFromSocket.current = true;
      const snapshot = JSON.parse(data);
      loadSnapshot(store, snapshot);
      // Update last emitted snapshot so we don't re-emit what we just received
      lastEmittedSnapshotRef.current = data;
      // Reset flag after a short delay to ensure store listener doesn't fire
      setTimeout(() => {
        isLoadingFromSocket.current = false;
      }, 200);
    } catch (error: any) {
      console.error("Error loading drawing:", error);
      setDrawingLoadingState({ status: "error", error: error.message });
      isLoadingFromSocket.current = false;
    }
  }
};

/**
 * Creates a debounced function to emit drawing changes to the server
 */
export const createDrawingEmitter = (
  store: TLStore,
  socket: any,
  roomId: string,
  isLoadingFromSocket: React.MutableRefObject<boolean>,
  lastEmittedSnapshotRef: React.MutableRefObject<string>,
  editorRef: React.MutableRefObject<Editor | null>
) => {
  return debounce(async () => {
    // Don't emit if we're currently loading from socket
    if (isLoadingFromSocket.current) {
      console.log("Skipping emit - loading from socket");
      return;
    }

    const snapshot = getSnapshot(store);
    const snapshotString = JSON.stringify(snapshot);

    // Only emit if snapshot actually changed
    if (snapshotString === lastEmittedSnapshotRef.current) {
      console.log("Skipping emit - no changes");
      return;
    }

    if (socket && socket.connected) {
      console.log("Sending drawing");
      // Export drawing as image for LaTeX conversion
      const imageData = await exportDrawingAsImage(editorRef.current);

      // Send both drawing data and image data in one event
      socket.emit("send-drawing", snapshotString, roomId, null, imageData);

      // Update last emitted snapshot
      lastEmittedSnapshotRef.current = snapshotString;
    }
  }, 1000);
};
