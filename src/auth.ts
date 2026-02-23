import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    memberId?: string;
    companyId?: string | null;
    user: {
      email: string;
      name: string;
      image?: string;
    };
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const AUTH_SYNC_SECRET = process.env.AUTH_SYNC_SECRET!;

async function syncMember(email: string, name: string, image?: string | null) {
  const url = `${API_URL}/auth/sync`;
  console.log(`[auth] syncing member to ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_SYNC_SECRET}`,
    },
    body: JSON.stringify({
      email,
      name,
      avatar_url: image ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[auth] sync failed: ${res.status} ${body}`);
    return null;
  }

  return res.json();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;

      try {
        const data = await syncMember(user.email!, user.name!, user.image);
        if (data) {
          (user as Record<string, unknown>).memberId = data.member.id;
          (user as Record<string, unknown>).companyId =
            data.member.company_id;
        }
      } catch (err) {
        console.error("[auth] sync error:", err);
      }

      // Always allow Google sign-in; sync data may be missing if backend is down
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.memberId = (user as Record<string, unknown>).memberId as string;
        token.companyId = (user as Record<string, unknown>).companyId as
          | string
          | null;
      }

      // Handle session update from client (e.g. after onboarding creates a company)
      if (trigger === "update" && session?.companyId) {
        token.companyId = session.companyId as string;
      }

      // Retry sync if memberId is missing (backend was down during sign-in)
      if (!token.memberId && token.email && trigger !== "signIn") {
        try {
          const data = await syncMember(
            token.email!,
            token.name!,
            token.picture,
          );
          if (data) {
            token.memberId = data.member.id;
            token.companyId = data.member.company_id;
          }
        } catch {
          // Will retry on next request
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.memberId = token.memberId as string;
      session.companyId = token.companyId as string | null;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
  },
});
