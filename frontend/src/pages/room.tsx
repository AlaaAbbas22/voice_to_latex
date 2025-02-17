import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import Content from '@/components/Content';
import axios from 'axios';
import { getCookie } from 'cookies-next';

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [latex, setLatex] = useState('');
  const [role, setRole] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  
  const router = useRouter();
  const socket = io('http://localhost:5000', {
    withCredentials: true,
  });

  useEffect(() => {
    if (router.isReady) {
      const sessionId = router.asPath.split('#')[1];

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('authenticate');
      });

      socket.on('authenticated', () => {
        socket.emit('join-room', String(sessionId));
        fetchRole(sessionId);
      });

      socket.on('receive-text', (latex) => setLatex(latex));
      socket.on('receive-original', (text, username) => {
        if (username !== getCookie('username')) setText(text);  
      });

      socket.on('error', (errorMessage) => {
        alert(errorMessage);
        router.push('/');
      });
    }
  }, [router.isReady]);

  const fetchRole = async (roomId:String) => {
    try {
      const response = await axios.get(`http://localhost:5000/rooms/${roomId}/role`, {
        withCredentials: true,
      });
      setRole(response.data.role);
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      <Header />
      <div className="flex flex-1 h-full w-full">
      <div
          className={`transition-all duration-300 ease-in-out ${
            showSidebar ? 'max-w-xs' : 'max-w-0'
          } overflow-hidden`}
        >
          {showSidebar && <Sidebar connected={connected} role={role} />}
        </div>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2 bg-gradient-to-r from-black via-gray-500 to-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition duration-300"
        >
          {showSidebar ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>

        <Content text={text} setText={setText} socket={socket} router={router} latex={latex} role={role} />
      </div>
      
      <Footer />
    </div>
  );
}