import 'regenerator-runtime/runtime';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import LatexDisplayer from './Latex';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface Props {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  socket: any;
  router: any;
  latex: string;
}

export default function Content({ text, setText, socket, router, latex }: Props) {
  const ref = useRef(null);
  const [recording, setRecording] = useState(false);
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setText((prev) => prev + ' ' + transcript);
      resetTranscript();
    }
  }, [transcript]);

  const startRecording = () => {
    setRecording(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopRecording = () => {
    setRecording(false);
    SpeechRecognition.stopListening();
    resetTranscript();
  };

  return (
    <div ref={ref} className="h-full w-full p-4 bg-white shadow-lg rounded-lg">
      <textarea
        className="w-full h-64 border border-gray-300 rounded-lg p-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={text}
        onChange={(e) => {
          socket.emit('send-text', e.target.value, router.asPath.split('#')[1]);
          setText(e.target.value);
        }}
        placeholder="Start typing here..."
      ></textarea>
      <LatexDisplayer latex={latex} />
      <button 
        onClick={recording ? stopRecording : startRecording} 
        className={`mt-4 px-4 py-2 rounded text-white ${recording ? 'bg-red-500' : 'bg-blue-500'} hover:opacity-90 transition-all`}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
}
