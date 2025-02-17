import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';

const Home = () => {
  const [roomName, setRoomName] = useState('');
  const [joinRoomName, setJoinRoomName] = useState('');
  const [createdRooms, setCreatedRooms] = useState([]);
  const [viewableRooms, setViewableRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('editingRooms');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getCookie("username")?.toString() || "");
    const fetchCreatedRooms = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/myrooms`, { withCredentials: true });
        setCreatedRooms(response.data);

        const viewables = (await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/viewablerooms`, { withCredentials: true })).data;
        setViewableRooms(viewables);
      } catch (error) {
        console.error('Error fetching created rooms:', error);
      }
    };

    fetchCreatedRooms();
  }, []);

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/rooms`, { roomName }, { withCredentials: true });
      alert(response.data.message);
      router.push(`/room/#${roomName}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.error);
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  const handleJoinRoom = () => {
    window.location.href = `/room/#${joinRoomName}`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/logout`, {}, { withCredentials: true });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout');
    }
  };

  const filteredCreatedRooms = createdRooms.filter((room: any) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredViewableRooms = viewableRooms.filter((room: any) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      <p className="mb-4">Welcome, {username}</p>
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Create Room</h2>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button
          onClick={handleCreateRoom}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Create Room
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Join Room</h2>
        <input
          type="text"
          value={joinRoomName}
          onChange={(e) => setJoinRoomName(e.target.value)}
          placeholder="Enter room name"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button
          onClick={handleJoinRoom}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Join Room
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-around mb-4">
          <button
            onClick={() => setActiveTab('editingRooms')}
            className={`p-2 rounded ${activeTab === 'editingRooms' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            My Editing Rooms
          </button>
          <button
            onClick={() => setActiveTab('viewableRooms')}
            className={`p-2 rounded ${activeTab === 'viewableRooms' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            My Viewable Rooms
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rooms"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        {activeTab === 'editingRooms' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">My Editing Rooms</h2>
            <ul>
              {filteredCreatedRooms.map((room: any) => (
                <li key={room._id} className="mb-2">
                  <a href={`/room/#${room.name}`} className="text-blue-500 hover:underline">
                    {room.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'viewableRooms' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">My Viewable Rooms</h2>
            <ul>
              {filteredViewableRooms.map((room: any) => (
                <li key={room._id} className="mb-2">
                  <a href={`/room/#${room.name}`} className="text-blue-500 hover:underline">
                    {room.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;