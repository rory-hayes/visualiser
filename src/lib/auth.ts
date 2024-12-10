import { NextAuthOptions } from 'next-auth';
import NotionProvider from '@auth/notion-provider';

export const authOptions: NextAuthOptions = {
    providers: [
        NotionProvider({
            clientId: process.env.NOTION_CLIENT_ID!,
            clientSecret: process.env.NOTION_CLIENT_SECRET!,
            redirectUri: process.env.NOTION_REDIRECT_URI!,
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            return {
                ...session,
                accessToken: token.accessToken,
            };
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
}; 