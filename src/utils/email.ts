import { createTransport } from 'nodemailer';

const transporter = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: true,
});

export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Welcome to Notion Graph!</h1>
                <p>Please verify your email address by clicking the button below:</p>
                <a 
                    href="${verificationUrl}" 
                    style="
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #000;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 16px 0;
                    "
                >
                    Verify Email
                </a>
                <p style="color: #666;">
                    If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Reset your password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Reset Your Password</h1>
                <p>Click the button below to reset your password:</p>
                <a 
                    href="${resetUrl}" 
                    style="
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #000;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 16px 0;
                    "
                >
                    Reset Password
                </a>
                <p style="color: #666;">
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        `,
    });
} 