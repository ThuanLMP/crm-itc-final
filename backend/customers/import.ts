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
      
      if (!sheetName) {
        throw new Error("File Excel không có sheet nào");
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      if (data.length < 2) {
        throw new Error("File Excel phải có ít nhất 2 dòng (header + data)");
      }

      // Skip header row
      const rows = data.slice(1) as any[][];

      // Get master data for mapping using proper async iteration
      const employeeRows: any[] = [];
      const customerTypeRows: any[] = [];
      const productRows: any[] = [];
      const provinceRows: any[] = [];
      const leadSourceRows: any[] = [];
      const stageRows: any[] = [];

      // Collect all data using for await loops
      for await (const row of db.query`SELECT id, name FROM employees WHERE active = true`) {
        employeeRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM customer_types WHERE active = true`) {
        customerTypeRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM products WHERE active = true`) {
        productRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM provinces`) {
        provinceRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM lead_sources WHERE active = true`) {
        leadSourceRows.push(row);
      }
      for await (const row of db.query`SELECT id, name FROM stages WHERE active = true`) {
        stageRows.push(row);
      }

      // Create lookup maps (case-insensitive)
      const employeeMap = new Map(
        employeeRows.map((e: any) => [e.name.toLowerCase().trim(), e.id])
      );
      const customerTypeMap = new Map(
        customerTypeRows.map((ct: any) => [ct.name.toLowerCase().trim(), ct.id])
      );
      const productMap = new Map(
        productRows.map((p: any) => [p.name.toLowerCase().trim(), p.id])
      );
      const provinceMap = new Map(
        provinceRows.map((pr: any) => [pr.name.toLowerCase().trim(), pr.id])
      );
      const leadSourceMap = new Map(
        leadSourceRows.map((ls: any) => [ls.name.toLowerCase().trim(), ls.id])
      );
      const stageMap = new Map(
        stageRows.map((s: any) => [s.name.toLowerCase().trim(), s.id])
      );

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

        try {
          // Skip empty rows
          if (!row || row.length === 0 || !row.some(cell => cell && cell.toString().trim())) {
            continue;
          }

          // Map Excel columns with safe string conversion
          const safeString = (value: any) => value ? value.toString().trim() : "";
          
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
            notes,          // J: Ghi chú
            province        // K: Tỉnh/Thành phố (optional)
          ] = row.map(safeString);

          if (!customerName) {
            errors.push({ row: rowNumber, error: "Tên khách hàng không được để trống" });
            failed++;
            continue;
          }

          // Check for duplicate customer name
          const existingCustomerResult = db.query`
            SELECT id FROM customers WHERE LOWER(name) = ${customerName.toLowerCase()}
          `;
          let hasExisting = false;
          for await (const row of existingCustomerResult) {
            hasExisting = true;
            break;
          }
          
          if (hasExisting) {
            errors.push({ row: rowNumber, error: `Khách hàng "${customerName}" đã tồn tại` });
            failed++;
            continue;
          }

          // Map master data with case-insensitive lookup
          const assignedSalespersonId = employeeName ? 
            employeeMap.get(employeeName.toLowerCase()) || null : null;
          const customerTypeId = customerType ? 
            customerTypeMap.get(customerType.toLowerCase()) || null : null;
          const leadSourceId = leadSource ? 
            leadSourceMap.get(leadSource.toLowerCase()) || null : null;
          const stageId = stage ? 
            stageMap.get(stage.toLowerCase()) || null : null;
          const provinceId = province ? 
            provinceMap.get(province.toLowerCase()) || null : null;
          
          // Handle multiple products (split by comma)
          const productIds: string[] = [];
          if (productName) {
            const productNames = productName.split(',').map((p: string) => p.trim().toLowerCase());
            for (const pName of productNames) {
              if (pName) {
                const productId = productMap.get(pName);
                if (productId && !productIds.includes(productId)) {
                  productIds.push(productId);
                }
              }
            }
          }

          // Validate email format if provided
          if (email && email.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push({ row: rowNumber, error: `Email "${email}" không hợp lệ` });
              failed++;
              continue;
            }
          }

          // Insert customer
          const customerId = randomUUID();
          await db.query`
            INSERT INTO customers (
              id, name, phone, email, company_name, customer_type_id, 
              assigned_salesperson_id, lead_source_id, stage_id, province_id,
              notes, created_at, updated_at
            ) VALUES (
              ${customerId}, ${customerName}, ${phone || null}, ${email || null}, 
              ${companyName || null}, ${customerTypeId}, ${assignedSalespersonId}, 
              ${leadSourceId}, ${stageId}, ${provinceId}, ${notes || null}, 
              NOW(), NOW()
            )
          `;

          // Insert customer products
          for (const productId of productIds) {
            if (productId) {
              await db.query`
                INSERT INTO customer_products (customer_id, product_id) 
                VALUES (${customerId}, ${productId})
              `;
            }
          }

          imported++;
        } catch (error) {
          console.error(`Error importing row ${rowNumber}:`, error);
          const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
          errors.push({ 
            row: rowNumber, 
            error: errorMessage.includes('duplicate key') ? 
              `Dữ liệu trùng lặp` : errorMessage
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
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      throw new Error(`Lỗi khi xử lý file Excel: ${errorMessage}`);
    }
  }
);