import { api } from "encore.dev/api";
import db from "../db";
import { PasswordHelper } from "./password-helper";

interface SetupDefaultUsersRequest {
  force?: boolean;
}

interface SetupDefaultUsersResponse {
  success: boolean;
  message: string;
  credentials?: Array<{
    email: string;
    password: string;
    role: string;
  }>;
}

// Tạo hash mật khẩu cho tài khoản mặc định
export const setupDefaultUsers = api(
  { expose: true, method: "POST", path: "/auth/setup-default" },
  async (req: SetupDefaultUsersRequest): Promise<SetupDefaultUsersResponse> => {
    
    // Kiểm tra nếu đã có user
    const existingUsers = await db.queryAll`SELECT id FROM users LIMIT 1`;
    
    if (existingUsers.length > 0 && !req.force) {
      return { 
        success: false, 
        message: "Users already exist. Use force=true to recreate."
      };
    }

    // Xóa users cũ nếu force = true
    if (req.force) {
      await db.exec`DELETE FROM users`;
    }

    // Tạo hash cho mật khẩu mặc định
    const adminPasswordHash = await PasswordHelper.hashPassword("admin123");
		console.log(adminPasswordHash);
    const employeePasswordHash = await PasswordHelper.hashPassword("employee123");

    // Tạo tài khoản mặc định với mật khẩu đã hash
    await db.exec`
      INSERT INTO users (email, name, phone, password, role) VALUES 
      ('admin@crm.com', 'Quản trị viên hệ thống', '+84901234567', ${adminPasswordHash}, 'admin'),
      ('employee@crm.com', 'Nhân viên bán hàng', '+84987654321', ${employeePasswordHash}, 'employee')
    `;

    return { 
      success: true, 
      message: "Default users created successfully with properly hashed passwords",
      credentials: [
        { email: "admin@crm.com", password: "admin123", role: "admin" },
        { email: "employee@crm.com", password: "employee123", role: "employee" }
      ]
    };
  }
);
