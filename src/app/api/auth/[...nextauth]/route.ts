import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import NotionProvider from 'next-auth/providers/notion';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        NotionProvider({
            clientId: process.env.NOTION_CLIENT_ID!,
            clientSecret: process.env.NOTION_CLIENT_SECRET!,
            redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/notion`,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error('User not found');
                }

                const isValid = await compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error('Invalid password');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
                session.accessToken = token.accessToken;
                session.provider = token.provider;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
});

export { handler as GET, handler as POST }; 