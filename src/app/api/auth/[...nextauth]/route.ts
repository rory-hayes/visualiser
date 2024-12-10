import NextAuth from 'next-auth';
import type { AuthOptions, User, Profile } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { Client } from '@notionhq/client';
import type { UserObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { prisma } from '@/lib/prisma';

type NotionOAuthProfile = {
    id: string;
    name: string | undefined;
    email: string | undefined;
    avatar_url: string | null;
};

const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        {
            id: 'notion',
            name: 'Notion',
            type: 'oauth',
            authorization: {
                url: 'https://api.notion.com/v1/oauth/authorize',
                params: {
                    client_id: process.env.NOTION_CLIENT_ID,
                    response_type: 'code',
                    owner: 'user',
                    redirect_uri: process.env.NOTION_REDIRECT_URI,
                }
            },
            token: 'https://api.notion.com/v1/oauth/token',
            userinfo: {
                url: 'https://api.notion.com/v1/users/me',
                async request({ tokens }): Promise<Profile> {
                    const notion = new Client({ 
                        auth: tokens.access_token as string,
                        notionVersion: '2022-06-28'
                    });
                    const response = await notion.users.retrieve({ 
                        user_id: 'me' 
                    });

                    const email = 'type' in response && response.type === 'person' 
                        ? response.person?.email 
                        : undefined;

                    return {
                        sub: response.id,
                        name: response.name || undefined,
                        email: email,
                        image: response.avatar_url || undefined,
                    };
                },
            },
            clientId: process.env.NOTION_CLIENT_ID,
            clientSecret: process.env.NOTION_CLIENT_SECRET,
            profile(profile): User {
                return {
                    id: profile.sub,
                    name: profile.name || 'Unnamed User',
                    email: profile.email || '',
                    image: profile.image || null,
                };
            }
        }
    ],
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 