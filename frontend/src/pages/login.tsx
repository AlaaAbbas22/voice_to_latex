import React, { useState } from "react";
import axios from "axios";
import { setCookie } from "cookies-next";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Particles from "@/components/ui/Particle";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Get callback URL from query parameters
      const { callback } = router.query;
      const callbackUrl = callback && typeof callback === 'string' ? callback : null;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
        {
          username,
          password,
          callback: callbackUrl,
        },
        { withCredentials: true },
      );
      console.log("Login successful:", response.data);

      setCookie("username", username, { maxAge: 6000 * 60 * 24 * 7 });

      // Use the redirect URL from the response or fallback to callback/default
      const redirectUrl = callbackUrl || '/dashboard';

      // Handle full URL with hash fragment
      if (redirectUrl.includes('#')) {
        // For URLs with hash fragments, use window.location for proper navigation
        window.location.href = redirectUrl;
      } else {
        // For regular URLs, use router.push
        router.push(redirectUrl);
      }
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Vatex</title>
      </Head>

      <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        {/* Particle Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={["#ffffff", "#a855f7", "#ec4899"]}
            particleCount={150}
            particleSpread={15}
            speed={0.1}
            particleBaseSize={80}
            moveParticlesOnHover={true}
            alphaParticles={true}
            disableRotation={false}
          />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
            <CardHeader className="text-center space-y-2 pb-6">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <p className="text-gray-600">Sign in to your Vatex account</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full transition-all focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full transition-all focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    New to Vatex?
                  </span>
                </div>
              </div>

              <Link href="/signup" passHref>
                <Button
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 font-medium py-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Create an Account
                </Button>
              </Link>
            </CardContent>
          </Card>

          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/"
              className="text-white text-sm hover:underline flex items-center justify-center gap-2"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
