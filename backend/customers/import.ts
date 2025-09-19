import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";
import { ImportCustomersRequest, ImportCustomersResponse } from "./types";
import db from "../db";

export const importCustomers = api(
  { method: "POST", path: "/import", expose: true },
  async (req: ImportCustomersRequest): Promise<ImportCustomersResponse> => {
    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;
    let failed = 0;

    try {
      // Parse base64 file content
      const buffer = Buffer.from(req.fileContent, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row
      const rows = data.slice(1) as any[][];

      // Get master data for mapping
      const employeeRows: any[] = [];
      const customerTypeRows: any[] = [];
      const productRows: any[] = [];
      const provinceRows: any[] = [];

      for await (const row of db.query`SELECT id, name FROM employees`) {
        employeeRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM customer_types`) {
        customerTypeRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM products`) {
        productRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM provinces`) {
        provinceRows.push(row);
      }

      const employeeMap = new Map(employeeRows.map((e: any) => [e.name, e.id]));
      const customerTypeMap = new Map(customerTypeRows.map((ct: any) => [ct.name, ct.id]));
      const productMap = new Map(productRows.map((p: any) => [p.name, p.id]));
      const provinceMap = new Map(provinceRows.map((pr: any) => [pr.name, pr.id]));

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

        try {
          // Map Excel columns based on the provided image
          const [
            employeeName,    // A: Nhân viên phụ trách
            customerName,    // B: Tên khách hàng
            phone,          // C: Điện thoại
            email,          // D: Email
            customerType,   // E: Loại khách hàng
            companyName,    // F: Tên công ty
            productName,    // G: Sản phẩm
            leadSource,     // H: Nguồn khách hàng
            stage,          // I: Giai đoạn
            notes           // J: Ghi chú
          ] = row;

          if (!customerName) {
            errors.push({ row: rowNumber, error: "Tên khách hàng không được để trống" });
            failed++;
            continue;
          }

          // Map master data
          const assignedSalespersonId = employeeName ? employeeMap.get(employeeName) : null;
          const customerTypeId = customerType ? customerTypeMap.get(customerType) : null;
          const productIds = productName ? [productMap.get(productName)].filter(Boolean) : [];

          // Insert customer
          const customerId = randomUUID();
          await db.query`
            INSERT INTO customers (
              id, name, phone, email, company_name, customer_type_id, 
              assigned_salesperson_id, notes, created_at, updated_at
            ) VALUES (
              ${customerId}, ${customerName}, ${phone || null}, ${email || null}, 
              ${companyName || null}, ${customerTypeId}, ${assignedSalespersonId}, 
              ${notes || null}, NOW(), NOW()
            )
          `;

          // Insert customer products
          for (const productId of productIds) {
            if (productId) {
              await db.query`
                INSERT INTO customer_products (customer_id, product_id) 
                VALUES (${customerId}, ${productId as string})
              `;
            }
          }

          imported++;
        } catch (error) {
          console.error(`Error importing row ${rowNumber}:`, error);
          errors.push({ 
            row: rowNumber, 
            error: error instanceof Error ? error.message : "Lỗi không xác định" 
          });
          failed++;
        }
      }

      return {
        imported,
        failed,
        errors
      };
    } catch (error) {
      console.error("Import error:", error);
      throw new Error("Lỗi khi xử lý file Excel");
    }
  }
);