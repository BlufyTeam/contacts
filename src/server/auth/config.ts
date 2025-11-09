import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types.
 * Extends session with user id, role name, and permissions.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string; // now dynamic
      permissions?: string[]; // array of module permissions
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions?: string[];
  }
}

const adapter = PrismaAdapter(db) as Adapter;

/**
 * NextAuth configuration using Prisma + Credentials provider.
 */
export const authConfig: NextAuthOptions = {
  adapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findFirst({
          where: { email: credentials.email },
          include: { role: { include: { permissions: true } } }, // include role & permissions
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: user.role?.name ?? "USER", // dynamic role
          permissions: user.role?.permissions?.map((p) => p.name) ?? [],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role as string;
      session.user.permissions = token.permissions as string[] | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const getServerAuthSession = () => getServerSession(authConfig);
