import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
        };
        accessToken?: string;
        provider?: string;
    }

    interface User {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        password?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        sub: string;
        accessToken?: string;
        provider?: string;
    }
} 