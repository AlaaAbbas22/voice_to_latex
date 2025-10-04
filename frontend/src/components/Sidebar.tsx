import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Copy,
  UserPlus,
  UserMinus,
  UserCog,
  CheckCircle2,
  Share2,
  Users,
  Settings,
  Shield,
  User,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface Props {
  connected: boolean;
  role: string;
  onClose?: () => void;
}

export default function Sidebar({ connected, role, onClose }: Props) {
  const router = useRouter();
  const [isEditor, setIsEditor] = useState(false);
  const [username, setUsername] = useState("");
  const [accessRole, setAccessRole] = useState("viewer");
  const [editors, setEditors] = useState<string[]>([]);
  const [viewers, setViewers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("share");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (role === "editor") {
      setIsEditor(true);
    } else {
      setIsEditor(false);
    }
  }, [role]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      setIsLoading(true);
      const sessionId = router.asPath.split("#")[1];
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}`,
          { withCredentials: true },
        );
        const room = response.data;
        setEditors(room.editors || []);
        setViewers(room.viewers || []);
      } catch (error) {
        console.error("Error fetching room details:", error);
        toast.error("Failed to load room details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomDetails();
  }, [router.asPath]);

  const handleAddUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setIsLoading(true);
    const sessionId = router.asPath.split("#")[1];
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}/addUser`,
        { userId: username, role: accessRole },
        { withCredentials: true },
      );
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success("User added successfully");
        // Refresh the room details to update the lists
        const roomResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}`,
          { withCredentials: true },
        );
        const room = roomResponse.data;
        setEditors(room.editors || []);
        setViewers(room.viewers || []);
        setUsername("");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, userRole: string) => {
    setIsLoading(true);
    const sessionId = router.asPath.split("#")[1];
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}/removeUser`,
        { userId, role: userRole },
        { withCredentials: true },
      );
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success("User removed successfully");
        // Refresh the room details to update the lists
        const roomResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}`,
          { withCredentials: true },
        );
        const room = roomResponse.data;
        setEditors(room.editors || []);
        setViewers(room.viewers || []);
      }
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "editor" ? "viewer" : "editor";
    setIsLoading(true);
    try {
      await handleRemoveUser(userId, currentRole);
      setUsername(userId);
      setAccessRole(newRole);
      await handleAddUser({ preventDefault: () => { } });
      toast.success(`User role changed to ${newRole}`);
    } catch (error) {
      console.error("Error toggling role:", error);
      toast.error("Failed to change user role");
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${router.asPath}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <motion.div
      className="h-full w-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex flex-col rounded-r-lg shadow-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`}
          />
          <span className="text-sm font-medium">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="bg-white/10 p-1 mx-4 rounded-lg">
          <TabsTrigger
            value="share"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          {isEditor && (
            <TabsTrigger
              value="manage"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 p-4 overflow-y-auto">
          <TabsContent value="share" className="mt-0 h-full">
            <Card className="bg-white/10 border-none text-white shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Share Document</CardTitle>
                <CardDescription className="text-white/70">
                  Invite others to collaborate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      value={`${window.location.origin}${router.asPath}`}
                      className="pr-20 bg-white/20 border-white/20 text-white placeholder:text-white/50"
                      readOnly
                    />
                    <Button
                      className="absolute right-0 top-0 h-full rounded-l-none"
                      onClick={copyShareLink}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Your Role</h3>
                    <Badge
                      variant={role === "editor" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {role === "editor" ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" /> Editor
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" /> Viewer
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <Card className="bg-white/10 border-none text-white shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Room Participants</CardTitle>
                <CardDescription className="text-white/70">
                  People with access to this document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Editors ({editors.length})
                  </h3>
                  <div className="space-y-2">
                    {editors.length === 0 ? (
                      <p className="text-sm text-white/70">No editors found</p>
                    ) : (
                      editors.map((editor) => (
                        <div
                          key={editor}
                          className="flex items-center justify-between p-2 bg-white/10 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-purple-700 text-white">
                                {editor.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{editor}</span>
                          </div>
                          {isEditor && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white/20"
                                onClick={() =>
                                  handleToggleRole(editor, "editor")
                                }
                                disabled={isLoading}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-500/50"
                                onClick={() =>
                                  handleRemoveUser(editor, "editor")
                                }
                                disabled={isLoading}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator className="bg-white/20" />

                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Viewers ({viewers.length})
                  </h3>
                  <div className="space-y-2">
                    {viewers.length === 0 ? (
                      <p className="text-sm text-white/70">No viewers found</p>
                    ) : (
                      viewers.map((viewer) => (
                        <div
                          key={viewer}
                          className="flex items-center justify-between p-2 bg-white/10 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-pink-700 text-white">
                                {viewer.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{viewer}</span>
                          </div>
                          {isEditor && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white/20"
                                onClick={() =>
                                  handleToggleRole(viewer, "viewer")
                                }
                                disabled={isLoading}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-500/50"
                                onClick={() =>
                                  handleRemoveUser(viewer, "viewer")
                                }
                                disabled={isLoading}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isEditor && (
            <TabsContent value="manage" className="mt-0">
              <Card className="bg-white/10 border-none text-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg">Add User</CardTitle>
                  <CardDescription className="text-white/70">
                    Grant access to other users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role</label>
                      <Select value={accessRole} onValueChange={setAccessRole}>
                        <SelectTrigger className="bg-white/20 border-white/20 text-white">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white text-purple-600 hover:bg-white/90 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Add User
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </motion.div>
  );
}
