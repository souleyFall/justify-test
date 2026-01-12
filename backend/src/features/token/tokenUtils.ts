import crypto from 'crypto';

class TokenUtils {
    public generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    public getTodayDate(): string {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }
}

export const tokenUtils = new TokenUtils();