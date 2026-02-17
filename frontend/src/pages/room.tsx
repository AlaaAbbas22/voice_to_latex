import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import Content from "@/components/Content";
import axios from "axios";
import { getCookie } from "cookies-next";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Head from "next/head";
import { HighContrastProvider, useHighContrast } from "@/contexts/HighContrastContext";

export default function Room() {
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState("");
  const [latex, setLatex] = useState("");
  const [role, setRole] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const [socket, setSocket] = useState<Socket<
    DefaultEventsMap,
    DefaultEventsMap
  > | null>(null);

  useEffect(() => {
    if (router.isReady) {
      const sessionId = router.asPath.split("#")[1];
      setRoomName(sessionId);

      // Initialize socket connection
      if (!socket) {
        const socketVariable = io(
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000",
          {
            withCredentials: true,
          },
        );

        if (!socketVariable) return;

        socketVariable.on("connect", () => {
          setConnected(true);
          socketVariable.emit("authenticate");
        });

        socketVariable.on("authenticated", () => {
          socketVariable.emit("join-room", String(sessionId));
          fetchRoomDetails(sessionId);
        });

        socketVariable.on("receive-text", (latex: string) => {
          setLatex(latex);
          console.log(latex);
        });

        socketVariable.on(
          "receive-original",
          (text: string, username: string) => {
            if (username !== getCookie("username")) setText(text);
          },
        );

        socketVariable.on("error", (errorMessage) => {
          if (errorMessage !== "Disconnected from server") {
            toast.error(errorMessage);
          }
          router.push("/dashboard");
        });

        socketVariable.on("disconnect", () => {
          setConnected(false);
          toast.error("Disconnected from server");
        });

        setSocket(socketVariable);
      }
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router.isReady, router]);

  const fetchRoomDetails = async (roomId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${roomId}/role`,
        {
          withCredentials: true,
        },
      );
      setRole(response.data.role);

      const room = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${roomId}`,
        {
          withCredentials: true,
        },
      );
      setRoomName(room.data.name);
    } catch (error) {
      console.error("Error fetching role:", error);
      toast.error("Failed to fetch your role");
    }
  };

  const handleRoomNameUpdate = (newName: string) => {
    setRoomName(newName);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-800 text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <h2 className="text-2xl font-bold">Loading Room...</h2>
        </motion.div>
      </div>
    );
  }

  const roomId = router.asPath.split("#")[1];

  return (
    <>
      <Head>
        <title>{roomName ? `Vatex - ${roomName}` : "Vatex Room"}</title>
      </Head>
      <HighContrastProvider>
        <RoomLayout
          roomName={roomName}
          roomId={roomId}
          role={role}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          toggleSidebar={toggleSidebar}
          onRoomNameUpdate={handleRoomNameUpdate}
          connected={connected}
          text={text}
          setText={setText}
          socket={socket}
          latex={latex}
          router={router}
        />
      </HighContrastProvider>
    </>
  );
}

interface RoomLayoutProps {
  roomName: string;
  roomId: string;
  role: string;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  toggleSidebar: () => void;
  onRoomNameUpdate: (name: string) => void;
  connected: boolean;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
  latex: string;
  router: ReturnType<typeof useRouter>;
}

function RoomLayout({
  roomName,
  roomId,
  role,
  showSidebar,
  setShowSidebar,
  toggleSidebar,
  onRoomNameUpdate,
  connected,
  text,
  setText,
  socket,
  latex,
  router,
}: RoomLayoutProps) {
  const { isHighContrast } = useHighContrast();

  return (
    <div
      className="room-layout flex flex-col h-screen w-screen bg-gray-50 overflow-hidden"
      data-high-contrast={isHighContrast ? "true" : undefined}
      role="main"
      aria-label="Room"
    >
      <Header
        roomName={roomName}
        roomId={roomId}
        role={role}
        showSidebar={showSidebar}
        onToggleSidebar={toggleSidebar}
        onRoomNameUpdate={onRoomNameUpdate}
      />

      <div className="flex flex-1 h-full w-full relative overflow-hidden">
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 z-30"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-80 absolute left-0 top-0 z-40 shadow-2xl"
            >
              <Sidebar
                connected={connected}
                role={role}
                onClose={() => setShowSidebar(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="room-main flex-1 flex flex-col w-full">
          <div className="flex-1 p-4 md:p-8">
            <Content
              text={text}
              setText={setText}
              socket={socket}
              router={router}
              latex={latex}
              role={role}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
