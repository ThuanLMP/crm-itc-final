import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { PasswordHelper } from "./password-helper";

interface ChangePasswordRequest {
  userId: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
}

// Admin can change any employee's password
export const changePassword = api(
  { expose: true, method: "POST", path: "/auth/change-password", auth: true },
  async (req: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    if (!req.newPassword || req.newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Hash the new password
    const hashedPassword = await PasswordHelper.hashPassword(req.newPassword);

    // Update password
    const result = await db.queryRow`
      UPDATE users 
      SET password = ${hashedPassword}, updated_at = now()
      WHERE id = ${req.userId} AND active = true
      RETURNING id
    `;

    if (!result) {
      throw new Error("User not found");
    }

    return { success: true };
  }
);

interface ResetPasswordRequest {
  userId: string;
}

interface ResetPasswordResponse {
  success: boolean;
  newPassword: string;
}

// Admin can reset employee password to default
export const resetPassword = api(
  { expose: true, method: "POST", path: "/auth/reset-password", auth: true },
  async (req: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    const newPassword = PasswordHelper.generateRandomPassword(8); // Generate secure random password
    const hashedPassword = await PasswordHelper.hashPassword(newPassword);

    const result = await db.queryRow`
      UPDATE users 
      SET password = ${hashedPassword}, updated_at = now()
      WHERE id = ${req.userId} AND active = true
      RETURNING id
    `;

    if (!result) {
      throw new Error("User not found");
    }

    return { success: true, newPassword };
  }
);