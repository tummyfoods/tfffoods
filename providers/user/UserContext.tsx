"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { CustomUser } from "@/types";

interface UserContextType {
  userData: CustomUser | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await axios.get("/api/userData");
      if (response.data.authenticated) {
        setUserData(response.data.user);
      } else {
        setUserData(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to fetch user data");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    setLoading(true);
    await fetchUserData();
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData();
    } else if (status === "unauthenticated") {
      setUserData(null);
      setLoading(false);
    }
  }, [status]);

  return (
    <UserContext.Provider value={{ userData, loading, error, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
}
