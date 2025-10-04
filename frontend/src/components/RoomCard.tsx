import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Edit2, Trash2, Check, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

interface RoomCardProps {
    room: {
        _id: string;
        name: string;
    };
    accessType: "editor" | "viewer";
    onUpdate?: (roomId: string, newName: string) => void;
    onDelete?: (roomId: string) => void;
}

export const RoomCard = ({ room, accessType, onUpdate, onDelete }: RoomCardProps) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState(room.name);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (!editingName.trim()) {
            toast.error("Room name cannot be empty");
            return;
        }

        setIsLoading(true);
        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${room._id}`,
                { roomName: editingName },
                { withCredentials: true }
            );

            toast.success("Room name updated successfully!");
            onUpdate?.(room._id, editingName);
            setIsEditing(false);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.error || "Failed to update room");
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${room._id}`,
                { withCredentials: true }
            );

            toast.success("Room deleted successfully!");
            onDelete?.(room._id);
            setShowDeleteConfirm(false);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.error || "Failed to delete room");
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = () => {
        setEditingName(room.name);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setEditingName(room.name);
        setIsEditing(false);
    };

    const borderColor = accessType === "editor" ? "border-l-purple-500" : "border-l-blue-500";
    const accessLabel = accessType === "editor" ? "Editor Access" : "Viewer Access";

    return (
        <motion.li
            whileHover={{ scale: 1.02 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 10,
            }}
        >
            <Card className={`hover:shadow-md transition-all duration-200 border-l-4 ${borderColor}`}>
                <CardContent className="p-4">
                    {isEditing ? (
                        <div className="space-y-3">
                            <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isLoading) {
                                        handleUpdate();
                                    } else if (e.key === "Escape") {
                                        cancelEdit();
                                    }
                                }}
                                className="w-full"
                                autoFocus
                                disabled={isLoading}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleUpdate}
                                    className="flex-1 bg-green-500 hover:bg-green-600"
                                    disabled={isLoading}
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : showDeleteConfirm ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-red-600">
                                Delete "{room.name}"?
                            </p>
                            <p className="text-xs text-gray-600">
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg">{room.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {accessLabel}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/room/#${room._id}`)}
                                    className="flex-1"
                                >
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    Open
                                </Button>
                                {accessType === "editor" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={startEdit}
                                            className="hover:bg-blue-50"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.li>
    );
};

