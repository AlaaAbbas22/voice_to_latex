import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Search, BookOpen, Edit, Eye } from "lucide-react";
import Head from "next/head";
import toast from "react-hot-toast";
import { RoomCard } from "@/components/RoomCard";

const Dashboard = () => {
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [createdRooms, setCreatedRooms] = useState<any[]>([]);
  const [viewableRooms, setViewableRooms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUsername(getCookie("username")?.toString() || "");
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/myrooms`,
          { withCredentials: true },
        );
        setCreatedRooms(response.data);

        const viewables = (
          await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/viewablerooms`, {
            withCredentials: true,
          })
        ).data;
        setViewableRooms(viewables);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms`,
        { roomName },
        { withCredentials: true },
      );
      toast.success(response.data.message || "Room created successfully");
      router.push(`/room/#${response.data.room._id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to create room");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error("Please enter a room name to join");
      return;
    }
    router.push(`/room/#${joinRoomId}`);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/logout`,
        {},
        { withCredentials: true },
      );
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  const handleRoomUpdate = (roomId: string, newName: string) => {
    // Update the room in state
    setCreatedRooms((prev) =>
      prev.map((room: any) =>
        room._id === roomId ? { ...room, name: newName } : room
      )
    );
    setViewableRooms((prev) =>
      prev.map((room: any) =>
        room._id === roomId ? { ...room, name: newName } : room
      )
    );
  };

  const handleRoomDelete = (roomId: string) => {
    // Remove the room from state
    setCreatedRooms((prev) => prev.filter((room: any) => room._id !== roomId));
    setViewableRooms((prev) => prev.filter((room: any) => room._id !== roomId));
  };

  const filteredCreatedRooms = createdRooms.filter((room: any) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredViewableRooms = viewableRooms.filter((room: any) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <Head>
        <title>Vatex Dashboard | Manage Your LaTeX Rooms</title>
      </Head>

      <motion.div
        className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-12">
          <motion.div
            className="flex justify-between items-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-lg text-gray-600 mt-2">Welcome, {username}</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Create Room
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name"
                      className="w-full"
                    />
                    <Button
                      onClick={handleCreateRoom}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                      Create Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Join Room
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      placeholder="Enter room ID"
                      className="w-full"
                    />
                    <Button
                      onClick={handleJoinRoom}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Join Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="shadow-md">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search rooms"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Tabs defaultValue="editingRooms">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger
                      value="editingRooms"
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      My Editing Rooms
                    </TabsTrigger>
                    <TabsTrigger
                      value="viewableRooms"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      My Viewable Rooms
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="editingRooms">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                        My Editing Rooms
                      </h2>
                      {filteredCreatedRooms.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          No editing rooms found. Create one to get started!
                        </p>
                      ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredCreatedRooms.map((room: any) => (
                            <RoomCard
                              key={room._id}
                              room={room}
                              accessType="editor"
                              onUpdate={handleRoomUpdate}
                              onDelete={handleRoomDelete}
                            />
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="viewableRooms">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                        My Viewable Rooms
                      </h2>
                      {filteredViewableRooms.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          No viewable rooms found.
                        </p>
                      ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredViewableRooms.map((room: any) => (
                            <RoomCard
                              key={room._id}
                              room={room}
                              accessType="viewer"
                            />
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Dashboard;
