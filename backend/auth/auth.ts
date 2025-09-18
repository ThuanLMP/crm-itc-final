import { authHandler } from "encore.dev/auth";
import { Header, APIError } from "encore.dev/api";
import db from "../db";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const token = params.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing authorization header");
    }

    // Simple token validation - in production, use proper JWT validation
    const user = await db.queryRow`
      SELECT id, email, name, phone, role, active 
      FROM users 
      WHERE id = ${token} AND active = true
    `;

    if (!user) {
      throw APIError.unauthenticated("invalid token");
    }

    return {
      userID: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }
);
