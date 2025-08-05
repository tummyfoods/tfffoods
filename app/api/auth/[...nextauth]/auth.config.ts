import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import User from "@/utils/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

interface UserDocument extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
  admin: boolean;
  profileImage: string;
  role: "admin" | "accounting" | "logistics" | "user";
  notificationPreferences: Record<string, boolean>;
  phone?: string;
  address?: {
    room: { en: string; "zh-TW": string };
    floor: { en: string; "zh-TW": string };
    building: { en: string; "zh-TW": string };
    street: { en: string; "zh-TW": string };
    city: { en: string; "zh-TW": string };
    state: { en: string; "zh-TW": string };
    country: { en: string; "zh-TW": string };
    postalCode: { en: string; "zh-TW": string };
    formattedAddress?: { en: string; "zh-TW": string };
  };
  isPeriodPaidUser?: boolean;
  paymentPeriod?: "weekly" | "monthly" | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      admin: boolean;
      profileImage: string;
      role: "admin" | "accounting" | "logistics" | "user";
      notificationPreferences: Record<string, boolean>;
      phone?: string;
      address?: {
        room: { en: string; "zh-TW": string };
        floor: { en: string; "zh-TW": string };
        building: { en: string; "zh-TW": string };
        street: { en: string; "zh-TW": string };
        city: { en: string; "zh-TW": string };
        state: { en: string; "zh-TW": string };
        country: { en: string; "zh-TW": string };
        postalCode: { en: string; "zh-TW": string };
        formattedAddress?: { en: string; "zh-TW": string };
      };
      isPeriodPaidUser?: boolean;
      paymentPeriod?: "weekly" | "monthly" | null;
    };
  }
  interface User {
    _id: string;
    admin: boolean;
    profileImage: string;
    role: "admin" | "accounting" | "logistics" | "user";
    notificationPreferences: Record<string, boolean>;
    phone?: string;
    address?: {
      room: { en: string; "zh-TW": string };
      floor: { en: string; "zh-TW": string };
      building: { en: string; "zh-TW": string };
      street: { en: string; "zh-TW": string };
      city: { en: string; "zh-TW": string };
      state: { en: string; "zh-TW": string };
      country: { en: string; "zh-TW": string };
      postalCode: { en: string; "zh-TW": string };
      formattedAddress?: { en: string; "zh-TW": string };
    };
    isPeriodPaidUser?: boolean;
    paymentPeriod?: "weekly" | "monthly" | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please provide both email and password");
          }

          await connectToDatabase();
          const isConnected = await waitForConnection();
          if (!isConnected) {
            throw new Error("Database connection timeout");
          }

          // Fetch user with all fields
          const userDoc = await User.findOne({
            email: credentials.email,
          }).lean();
          console.log("Found user in database:", userDoc);

          if (!userDoc) {
            throw new Error("Invalid credentials");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            userDoc.password
          );

          if (!isCorrectPassword) {
            throw new Error("Invalid credentials");
          }

          // Return full user object
          return {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            admin: userDoc.admin,
            profileImage: userDoc.profileImage,
            notificationPreferences: userDoc.notificationPreferences,
            phone: userDoc.phone,
            address: userDoc.address,
            isPeriodPaidUser: userDoc.isPeriodPaidUser,
            paymentPeriod: userDoc.paymentPeriod,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: process.env.NODE_ENV === "production" ? 2 * 60 * 60 : 30 * 24 * 60 * 60, // 2 hours in prod, 30 days in dev
    updateAge: 60 * 60, // 1 hour
  },
  events: {
    signOut: async ({ session, token }) => {
      try {
        console.log("NextAuth signOut event triggered", { session, token });
        
        // Force expire the token
        if (token) {
          token.exp = 0;
        }

        // Clear any server-side session data
        if (session) {
          session.expires = new Date(0).toISOString();
        }
      } catch (error) {
        console.error("Error in signOut event:", error);
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: process.env.NODE_ENV === "production" ? ".tfffoods.com" : undefined,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: process.env.NODE_ENV === "production" ? ".tfffoods.com" : undefined,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        // __Host- prefixed cookies MUST NOT have a domain set
        domain: undefined,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.type === "credentials") {
          return true; // Allow credential login
        }

        if (account?.type === "oauth") {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: user.email });

          if (!dbUser) {
            const newUser = await User.create({
              email: user.email,
              name: user.name,
              role: "user",
              admin: false,
            });
            // Pass database user data to the token
            user.id = newUser._id;
            user.role = newUser.role;
            user.admin = newUser.admin;
          } else {
            // Pass database user data to the token
            user.id = dbUser._id;
            user.role = dbUser.role;
            user.admin = dbUser.admin;
          }
          return true;
        }

        return false;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      console.log("JWT Callback - User Data:", user);
      console.log("JWT Callback - Current Token:", token);
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.admin = user.admin;
      }
      console.log("JWT Callback - Updated Token:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback - Token:", token);
      console.log("Session Callback - Current Session:", session);
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.admin = token.admin;
      }
      console.log("Session Callback - Updated Session:", session);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
