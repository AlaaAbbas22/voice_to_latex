import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Edit2, Check, X, Menu, Users } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface HeaderProps {
  roomName?: string;
  roomId?: string;
  role?: string;
  onRoomNameUpdate?: (newName: string) => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ roomName, roomId, role, onRoomNameUpdate, showSidebar, onToggleSidebar }: HeaderProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(roomName || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUsername(getCookie("username")?.toString() || null);
  }, []);

  useEffect(() => {
    if (roomName) {
      setEditingName(roomName);
    }
  }, [roomName]);

  const handleUpdateRoomName = async () => {
    if (!editingName.trim()) {
      toast.error("Room name cannot be empty");
      return;
    }

    if (!roomId) return;

    setIsLoading(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${roomId}`,
        { roomName: editingName },
        { withCredentials: true }
      );

      toast.success("Room name updated successfully!");
      onRoomNameUpdate?.(editingName);
      setIsEditing(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to update room name");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingName(roomName || "");
    setIsEditing(false);
  };

  const canEdit = role === "editor";

  return (
    <div className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        {/* Menu Toggle Button */}
        {onToggleSidebar && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onToggleSidebar}
              size="sm"
              className={`flex items-center gap-2 ${showSidebar
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                }`}
              variant={showSidebar ? "outline" : "default"}
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
              <Users className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {roomName && (
          <>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handleUpdateRoomName();
                    } else if (e.key === "Escape") {
                      cancelEdit();
                    }
                  }}
                  className="h-8 w-48"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleUpdateRoomName}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-800">{roomName}</h1>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
              </div>
            )}
            <div className="h-6 w-px bg-gray-300" />
          </>
        )}
        <div className="text-right">
          <p className="text-xs text-gray-500">Welcome,</p>
          <p className="text-sm font-medium text-gray-700">{username}</p>
        </div>
      </div>
    </div>
  );
}
