import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";

export default function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    setUsername(getCookie("username")?.toString() || null);
  }, []);

  return (
    <div className="bg-gray-200 py-2 flex flex-col justify-center items-center">
      <p className="text-sm font-semibold text-[#363636]">
      Latex Whiteboarder
      </p>
      <p className="text-xs text-[#363636]">Welcome, {username}</p>
      <div className="fixed top-2 left-2 flex items-center">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center"
          onClick={() => router.push('/')}
        >
          <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
          >
        <path d="M10 20V12H6v8H2V10H0L10 0l10 10h-2v10h-4v-8h-4v8z" />
          </svg>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
