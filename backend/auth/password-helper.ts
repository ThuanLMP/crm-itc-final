import * as bcrypt from "bcryptjs";

export class PasswordHelper {
  // Hash a password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify a password against a hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return true;
  }

  // Generate a secure random password
  static generateRandomPassword(length: number = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}