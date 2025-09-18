import { api } from "encore.dev/api";
import db from "../db";
import { PasswordHelper } from "./password-helper";

interface InitializeSystemRequest {
  adminPassword?: string;
  employeePassword?: string;
}

interface InitializeSystemResponse {
  success: boolean;
  message: string;
}

// Initialize system with properly hashed passwords (admin only, one-time setup)
export const initializeSystem = api(
  { expose: true, method: "POST", path: "/auth/initialize" },
  async (req: InitializeSystemRequest): Promise<InitializeSystemResponse> => {
    // Check if system is already initialized
    const existingUsers = await db.queryAll`SELECT id FROM users LIMIT 1`;
    if (existingUsers.length > 0) {
      return { success: false, message: "System already initialized" };
    }

    const adminPassword = req.adminPassword || "admin123";
    const employeePassword = req.employeePassword || "employee123";

    // Hash the passwords
    const hashedAdminPassword = await PasswordHelper.hashPassword(adminPassword);
    const hashedEmployeePassword = await PasswordHelper.hashPassword(employeePassword);

    // Create default users
    await db.exec`
      INSERT INTO users (email, name, phone, password, role) VALUES 
      ('admin@crm.com', 'System Admin', '+84901234567', ${hashedAdminPassword}, 'admin'),
      ('employee@crm.com', 'Sales Employee', '+84987654321', ${hashedEmployeePassword}, 'employee')
    `;

    return { 
      success: true, 
      message: "System initialized successfully with default users" 
    };
  }
);