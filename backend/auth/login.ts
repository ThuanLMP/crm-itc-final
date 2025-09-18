import { api, APIError } from "encore.dev/api";
import db from "../db";
import { PasswordHelper } from "./password-helper";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
  };
}

// Simple login for demo - in production use proper authentication with hashed passwords
export const login = api(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req: LoginRequest): Promise<LoginResponse> => {
    if (!req.email || !req.password) {
      throw APIError.invalidArgument("Địa chỉ email và mật khẩu là bắt buộc");
    }

    const user = await db.queryRow`
      SELECT id, email, name, phone, password, role 
      FROM users 
      WHERE email = ${req.email} AND active = true
    `;

    if (!user) {
      throw APIError.unauthenticated("Email hoặc mật khẩu không chính xác");
    }

    // Verify password using bcrypt
    const isValidPassword = await PasswordHelper.verifyPassword(req.password, user.password);
    if (!isValidPassword) {
      throw APIError.unauthenticated("Email hoặc mật khẩu không chính xác");
    }

    return {
      token: user.id, // In production, generate proper JWT
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }
);
