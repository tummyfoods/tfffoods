import { DefaultSession } from "next-auth";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    _id: string;
    id: string;
    name?: string | null;
    email?: string | null;
    admin: boolean;
    role: "admin" | "accounting" | "logistics" | "user";
  }

  interface Session extends DefaultSession {
    user: {
      _id: string;
      id: string;
      name?: string | null;
      email?: string | null;
      admin: boolean;
      role: "admin" | "accounting" | "logistics" | "user";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
    id: string;
    admin: boolean;
    role: "admin" | "accounting" | "logistics" | "user";
  }
}
