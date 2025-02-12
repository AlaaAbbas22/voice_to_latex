import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import Content from '@/components/Content';

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [latex, setLatex] = useState('');
  const router = useRouter();
  const socket = io('http://localhost:5000');

  useEffect(() => {
    if (router.isReady) {
      socket.on('connect', () => setConnected(true));
      socket.on('receive-text', (latex) => setLatex(latex));
      socket.on('receive-original', (text) => setText(text));

      const sessionId = router.asPath.split('#')[1] || Math.floor(Math.random() * 10000000);
      router.push('/#' + sessionId);
      socket.emit('join-room', String(sessionId));
    }
  }, [router.isReady]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      <Header />
      <div className="flex flex-1 h-full w-full">
        <Sidebar connected={connected} />
        <Content text={text} setText={setText} socket={socket} router={router} latex={latex} />
      </div>
      <Footer />
    </div>
  );
}