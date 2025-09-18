import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ListUsersResponse {
  users: Array<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    active: boolean;
  }>;
}

// Lists all users (admin only)
export const list = api(
  { expose: true, method: "GET", path: "/users", auth: true },
  async (): Promise<ListUsersResponse> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Truy cập bị từ chối");
    }

    const users = await db.queryAll`
      SELECT id, email, name, phone, role, active
      FROM users
      ORDER BY name
    `;

    return { 
      users: users as Array<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: string;
        active: boolean;
      }>
    };
  }
);
