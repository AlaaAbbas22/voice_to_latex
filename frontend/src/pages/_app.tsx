import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Simple authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/auth/status`,
          { withCredentials: true }
        );

        const isAuthenticated = response.data.authenticated;
        const currentPath = router.pathname;

        // If user is authenticated and on login/signup page, redirect to dashboard
        if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup')) {
          router.push('/dashboard');
        }
        // If user is not authenticated and on protected page, redirect to login with callback URL
        else if (!isAuthenticated && (currentPath === '/dashboard' || currentPath.startsWith('/room'))) {
          // Include hash fragment in callback URL
          const fullUrl = window.location.pathname + window.location.search + window.location.hash;
          const callbackUrl = encodeURIComponent(fullUrl);
          router.push(`/login?callback=${callbackUrl}`);
        }
      } catch (error) {
        // If auth check fails and user is on protected page, redirect to login with callback URL
        const currentPath = router.pathname;
        if (currentPath === '/dashboard' || currentPath.startsWith('/room')) {
          // Include hash fragment in callback URL
          const fullUrl = window.location.pathname + window.location.search + window.location.hash;
          const callbackUrl = encodeURIComponent(fullUrl);
          router.push(`/login?callback=${callbackUrl}`);
        }
      }
    };

    checkAuth();
  }, [router]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}
