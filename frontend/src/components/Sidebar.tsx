import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Props {
  connected: boolean;
  role: string;
}

export default function Sidebar({ connected, role }: Props) {
  const router = useRouter();
  const [isEditor, setIsEditor] = useState(false);
  const [username, setUsername] = useState('');
  const [accessRole, setAccessRole] = useState('viewer');
  const [editors, setEditors] = useState<string[]>([]);
  const [viewers, setViewers] = useState<string[]>([]);

  useEffect(() => {
    if (role === 'editor') {
      setIsEditor(true);
    } else {
      setIsEditor(false);
    }
  }, [role]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      const sessionId = router.asPath.split('#')[1];
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}`, { withCredentials: true });
        const room = response.data;
        setEditors(room.editors);
        setViewers(room.viewers);
      } catch (error) {
        console.error('Error fetching room details:', error);
      }
    };

    fetchRoomDetails();
  }, [router.asPath]);

  const handleAddUser = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    const sessionId = router.asPath.split('#')[1];
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}/addUser`,
        { userId: username, role: accessRole },
        { withCredentials: true }
      );
      if (response.data.error) {
        alert(response.data.error);
      } else {
        alert('User added successfully');
        // Refresh the room details to update the lists
        const roomResponse = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}`, { withCredentials: true });
        const room = roomResponse.data;
        setEditors(room.editors);
        setViewers(room.viewers);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string, role: string) => {
    const sessionId = router.asPath.split('#')[1];
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}/removeUser`,
        { userId, role },
        { withCredentials: true }
      );
      if (response.data.error) {
        alert(response.data.error);
      } else {
        alert('User removed successfully');
        // Refresh the room details to update the lists
        const roomResponse = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/rooms/${sessionId}`, { withCredentials: true });
        const room = roomResponse.data;
        setEditors(room.editors);
        setViewers(room.viewers);
      }
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole == 'editor' ? 'viewer' : 'editor';
    await handleRemoveUser(userId, currentRole);
    setUsername(userId);
    setAccessRole(newRole);
    await handleAddUser({ preventDefault: () => {} });
  };

  return (
    <div className=" min-w-[100%] p-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white flex flex-col rounded-lg shadow-lg">
      <div className="flex flex-row space-x-3">
        <div
          className={
            'h-[10px] w-[10px] my-auto rounded-full ' +
            (connected ? 'bg-[#00FF00]' : 'bg-[#FF0000]')
          }
        />
        {!connected ? (
          <p className="text-sm my-auto font-medium">
            Connecting...
          </p>
        ) : (
          <p className="text-sm my-auto italic font-medium">
            You are connected!
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-col w-full space-y-2">
        <p className="text-base font-semibold">Share Link</p>
        <div className="border w-full rounded flex flex-row bg-white space-x-3 py-1.5 px-2">
          <input
            value={`http://localhost:3000${router.asPath}`}
            className="w-full text-sm font-regular text-gray-600 focus:ring-0 focus:outline-none focus:border-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `http://localhost:3000${router.asPath}`
              );
              toast.success('Copied to clipboard!', {
                className: 'text-sm text-[#363636] font-medium',
              });
            }}
            className="my-auto h-full px-2 hover:bg-gray-300 rounded bg-gray-200 text-[#363636] text-sm font-medium"
          >
            Copy
          </button>
        </div>
      </div>
      {isEditor && (
        <form onSubmit={handleAddUser} className="p-4 mt-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
            />
            <select value={accessRole} onChange={(e) => setAccessRole(e.target.value)} className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black">
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Add User
            </button>
          </div>
        </form>
      )}
      <div className="mt-4">
        <p className="text-base font-semibold">Editors</p>
        <ul className="list-disc list-inside">
          {editors.map((editor) => (
            <li key={editor}>
              {editor}
              <button onClick={() => handleRemoveUser(editor, 'editor')} className="ml-2 p-1 bg-red-500 text-white rounded hover:bg-red-600">
                Remove
              </button>
              <button onClick={() => handleToggleRole(editor, 'editor')} className="ml-2 p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                Toggle to Viewer
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <p className="text-base font-semibold">Viewers</p>
        <ul className="list-disc list-inside">
          {viewers.map((viewer) => (
            <li key={viewer}>
              {viewer}
              <button onClick={() => handleRemoveUser(viewer, 'viewer')} className="ml-2 p-1 bg-red-500 text-white rounded hover:bg-red-600">
                Remove
              </button>
              {/*<button onClick={() => handleToggleRole(viewer, 'viewer')} className="ml-2 p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                Toggle to Editor
              </button>*/}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
