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
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "react-hot-toast";
import Head from "next/head";

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
          fetchRole(sessionId);
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

  const fetchRole = async (roomId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${roomId}/role`,
        {
          withCredentials: true,
        },
      );
      setRole(response.data.role);
    } catch (error) {
      console.error("Error fetching role:", error);
      toast.error("Failed to fetch your role");
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading Room...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{roomName ? `Vatex - ${roomName}` : "Vatex Room"}</title>
      </Head>

      <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden">
        <Header />

        <div className="flex flex-1 h-full w-full relative">
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="h-full w-80 absolute md:relative z-10"
              >
                <Sidebar
                  connected={connected}
                  role={role}
                  onClose={() => setShowSidebar(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="flex-1 flex flex-col relative"
            animate={{
              marginLeft: showSidebar ? "0px" : "0px",
              width: showSidebar ? "calc(100% - 320px)" : "100%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div
              className="absolute top-4 left-4 z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={toggleSidebar}
                variant="outline"
                size="icon"
                className="rounded-full shadow-md bg-white"
              >
                {showSidebar ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            </motion.div>

            <div className="flex-1 p-4 md:p-8">
              <Content
                text={text}
                setText={setText}
                socket={socket}
                router={router}
                latex={latex}
                role={role}
                roomName={roomName}
              />
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>
  );
}
