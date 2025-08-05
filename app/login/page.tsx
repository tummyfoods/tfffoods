/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Mail, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";

const AnimatedBackground = () => {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      {[...Array(20)].map((_, i) => (
        <motion.circle
          key={i}
          r={Math.random() * 20 + 10}
          fill="#fff"
          initial={{
            opacity: Math.random() * 0.5 + 0.1,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          animate={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </svg>
  );
};

const Login = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  //handle the input changes aka when a user is typing something
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUser((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user.email || !user.password) {
        setError("Please fill in all the fields");
        return;
      }

      const emailRegex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
      if (!emailRegex.test(user.email)) {
        setError("Please provide a valid email address");
        return;
      }

      console.log("Attempting to sign in with:", { email: user.email });
      const res = await signIn("credentials", {
        email: user.email,
        password: user.password,
        redirect: false,
      });
      console.log("Sign in response:", res);

      if (res?.error) {
        console.error("Sign in error:", res.error);
        setError("Invalid email or password");
      } else if (res?.ok) {
        console.log("Sign in successful, redirecting...");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Attempting Google sign in...");
      await signIn("google", {
        callbackUrl: window.location.origin,
        prompt: "select_account",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google");
    }
  };

  useEffect(() => {
    // Detailed debug logging
    console.log("LOGIN PAGE DEBUG ==================");
    console.log("Current Status:", status);
    console.log("Session Data:", session);
    console.log("JustLoggedOut Flag:", sessionStorage.getItem("justLoggedOut"));
    console.log("All SessionStorage Keys:", Object.keys(sessionStorage));
    console.log("All LocalStorage Keys:", Object.keys(localStorage));
    console.log("Current URL:", window.location.href);
    console.log("================================");

    // Check if we just logged out
    const justLoggedOut = sessionStorage.getItem("justLoggedOut");

    if (status === "authenticated" && session?.user) {
      console.log("LOGIN DEBUG - Session is authenticated with user:", session.user);
      
      if (justLoggedOut) {
        console.log("LOGIN DEBUG - Found justLoggedOut flag, preventing auto-login");
        // Clear the session if we just logged out
        signOut({ 
          redirect: true,
          callbackUrl: "/login" 
        }).then(() => {
          console.log("LOGIN DEBUG - SignOut completed successfully");
          // Don't remove the flag here - let it persist until page reload
          window.location.replace("/login");
        }).catch(error => {
          console.error("LOGIN DEBUG - SignOut failed:", error);
          window.location.replace("/login");
        });
      } else {
        console.log("LOGIN DEBUG - No justLoggedOut flag, redirecting to home");
        router.push("/");
      }
    } else {
      console.log("LOGIN DEBUG - Session is not authenticated or has no user");
    }
  }, [status, session, router]);

  return (
    <div className="flex justify-center items-center min-h-screen overflow-hidden bg-blue-100 relative">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                name="email"
                id="email"
                placeholder="you@example.com"
                value={user.email}
                onChange={handleInputChange}
                className="pl-10 w-full"
                required
              />
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                value={user.password}
                onChange={handleInputChange}
                className="pl-10 w-full"
                required
              />
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm flex items-center"
            >
              <AlertCircle size={16} className="mr-2" />
              {error}
            </motion.div>
          )}

          <Button
            variant="default"
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <FaGoogle className="mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
