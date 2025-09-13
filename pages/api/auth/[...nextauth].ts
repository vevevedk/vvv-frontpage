import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyToken } from '../../../lib/auth';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Custom Auth',
      credentials: {
        auth_token: { label: "Auth Token", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.auth_token) {
            return null;
          }

          const user = await verifyToken(credentials.auth_token);
          
          if (user) {
            return {
              id: user.email,
              email: user.email,
              role: user.role,
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
});