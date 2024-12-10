import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    return hash(password, 12);
}

export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return compare(password, hashedPassword);
}

export function generatePassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    let hasLower = false;
    let hasUpper = false;
    let hasNumber = false;
    let hasSpecial = false;

    // Ensure at least one of each type
    password += charset[Math.floor(Math.random() * 26)]; // lowercase
    password += charset[Math.floor(Math.random() * 26) + 26]; // uppercase
    password += charset[Math.floor(Math.random() * 10) + 52]; // number
    password += charset[Math.floor(Math.random() * 14) + 62]; // special

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        const char = charset[Math.floor(Math.random() * charset.length)];
        password += char;
        
        if (char >= 'a' && char <= 'z') hasLower = true;
        if (char >= 'A' && char <= 'Z') hasUpper = true;
        if (char >= '0' && char <= '9') hasNumber = true;
        if ('!@#$%^&*()_+'.includes(char)) hasSpecial = true;
    }

    // If missing any required type, generate a new password
    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        return generatePassword(length);
    }

    return password;
} 