import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ExportCustomersRequest {
  format: "excel";
  search?: string;
  stageId?: string;
  temperatureId?: string;
  assignedSalespersonId?: string;
  provinceId?: string;
  contactStatusId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ExportCustomersResponse {
  data: string; // Base64 encoded file data
  filename: string;
  mimeType: string;
}

// Export customers to Excel
export const exportCustomers = api(
  { expose: true, method: "POST", path: "/customers/export", auth: true },
  async (req: ExportCustomersRequest): Promise<ExportCustomersResponse> => {
    const auth = getAuthData()!;

    // Execute query with conditional logic based on filters and role
    let customers;

    if (auth.role === "employee") {
      // Employee can only see their assigned customers
      if (req.search && req.stageId) {
        customers = await db.queryAll`
          SELECT 
            c.name as "Tên khách hàng",
            c.company_name as "Tên công ty",
            c.phone as "Điện thoại",
            c.email as "Email",
            c.address as "Địa chỉ",

            p.name as "Tỉnh/Thành phố",
            ct.name as "Loại khách hàng",
            bt.name as "Loại doanh nghiệp",
            cs.name as "Quy mô công ty",
            s.name as "Giai đoạn",
            t.name as "Mức độ",
            cst.name as "Trạng thái liên hệ",
            ls.name as "Nguồn khách hàng",
            sp.name as "Nhân viên phụ trách",
            c.customer_feedback as "Phản hồi khách hàng",
            c.notes as "Ghi chú",
            c.created_at as "Ngày tạo",
            c.updated_at as "Ngày cập nhật"
          FROM customers c
          LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
          LEFT JOIN business_types bt ON c.business_type_id = bt.id
          LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
          LEFT JOIN provinces p ON c.province_id = p.id
          LEFT JOIN lead_sources ls ON c.lead_source_id = ls.id
          LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
          LEFT JOIN stages s ON c.stage_id = s.id
          LEFT JOIN temperatures t ON c.temperature_id = t.id
          LEFT JOIN contact_statuses cst ON c.contact_status_id = cst.id
          WHERE c.deleted_at IS NULL 
            AND c.assigned_salesperson_id = ${auth.userID}
            AND (c.name ILIKE ${`%${req.search}%`} OR c.company_name ILIKE ${`%${req.search}%`} OR c.phone ILIKE ${`%${req.search}%`} OR c.email ILIKE ${`%${req.search}%`})
            AND c.stage_id = ${req.stageId}
          ORDER BY c.created_at DESC
        `;
      } else if (req.search) {
        customers = await db.queryAll`
          SELECT 
            c.name as "Tên khách hàng",
            c.company_name as "Tên công ty",
            c.phone as "Điện thoại",
            c.email as "Email",
            c.address as "Địa chỉ",

            p.name as "Tỉnh/Thành phố",
            ct.name as "Loại khách hàng",
            bt.name as "Loại doanh nghiệp",
            cs.name as "Quy mô công ty",
            s.name as "Giai đoạn",
            t.name as "Mức độ",
            cst.name as "Trạng thái liên hệ",
            ls.name as "Nguồn khách hàng",
            sp.name as "Nhân viên phụ trách",
            c.customer_feedback as "Phản hồi khách hàng",
            c.notes as "Ghi chú",
            c.created_at as "Ngày tạo",
            c.updated_at as "Ngày cập nhật"
          FROM customers c
          LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
          LEFT JOIN business_types bt ON c.business_type_id = bt.id
          LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
          LEFT JOIN provinces p ON c.province_id = p.id
          LEFT JOIN lead_sources ls ON c.lead_source_id = ls.id
          LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
          LEFT JOIN stages s ON c.stage_id = s.id
          LEFT JOIN temperatures t ON c.temperature_id = t.id
          LEFT JOIN contact_statuses cst ON c.contact_status_id = cst.id
          WHERE c.deleted_at IS NULL 
            AND c.assigned_salesperson_id = ${auth.userID}
            AND (c.name ILIKE ${`%${req.search}%`} OR c.company_name ILIKE ${`%${req.search}%`} OR c.phone ILIKE ${`%${req.search}%`} OR c.email ILIKE ${`%${req.search}%`})
          ORDER BY c.created_at DESC
        `;
      } else {
        customers = await db.queryAll`
          SELECT 
            c.name as "Tên khách hàng",
            c.company_name as "Tên công ty",
            c.phone as "Điện thoại",
            c.email as "Email",
            c.address as "Địa chỉ",

            p.name as "Tỉnh/Thành phố",
            ct.name as "Loại khách hàng",
            bt.name as "Loại doanh nghiệp",
            cs.name as "Quy mô công ty",
            s.name as "Giai đoạn",
            t.name as "Mức độ",
            cst.name as "Trạng thái liên hệ",
            ls.name as "Nguồn khách hàng",
            sp.name as "Nhân viên phụ trách",
            c.customer_feedback as "Phản hồi khách hàng",
            c.notes as "Ghi chú",
            c.created_at as "Ngày tạo",
            c.updated_at as "Ngày cập nhật"
          FROM customers c
          LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
          LEFT JOIN business_types bt ON c.business_type_id = bt.id
          LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
          LEFT JOIN provinces p ON c.province_id = p.id
          LEFT JOIN lead_sources ls ON c.lead_source_id = ls.id
          LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
          LEFT JOIN stages s ON c.stage_id = s.id
          LEFT JOIN temperatures t ON c.temperature_id = t.id
          LEFT JOIN contact_statuses cst ON c.contact_status_id = cst.id
          WHERE c.deleted_at IS NULL 
            AND c.assigned_salesperson_id = ${auth.userID}
          ORDER BY c.created_at DESC
        `;
      }
    } else {
      // Admin can see all customers - simplified version first
      customers = await db.queryAll`
        SELECT 
          c.name as "Tên khách hàng",
          c.company_name as "Tên công ty",
          c.phone as "Điện thoại",
          c.email as "Email",
          c.address as "Địa chỉ",

          p.name as "Tỉnh/Thành phố",
          ct.name as "Loại khách hàng",
          bt.name as "Loại doanh nghiệp",
          cs.name as "Quy mô công ty",
          s.name as "Giai đoạn",
          t.name as "Mức độ",
          cst.name as "Trạng thái liên hệ",
          ls.name as "Nguồn khách hàng",
          sp.name as "Nhân viên phụ trách",
          c.customer_feedback as "Phản hồi khách hàng",
          c.notes as "Ghi chú",
          c.created_at as "Ngày tạo",
          c.updated_at as "Ngày cập nhật"
        FROM customers c
        LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
        LEFT JOIN business_types bt ON c.business_type_id = bt.id
        LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
        LEFT JOIN provinces p ON c.province_id = p.id
        LEFT JOIN lead_sources ls ON c.lead_source_id = ls.id
        LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
        LEFT JOIN stages s ON c.stage_id = s.id
        LEFT JOIN temperatures t ON c.temperature_id = t.id
        LEFT JOIN contact_statuses cst ON c.contact_status_id = cst.id
        WHERE c.deleted_at IS NULL
        ORDER BY c.created_at DESC
      `;
    }

    // Convert to array
    const customersArray = customers as any[];

    // Generate Excel using SpreadsheetML XML format
    const excelContent = generateExcelXML(customersArray);
    const base64Data = Buffer.from(excelContent, 'utf-8').toString('base64');
    
    return {
      data: base64Data,
      filename: `danh-sach-khach-hang-${new Date().toISOString().split('T')[0]}.xls`,
      mimeType: "application/vnd.ms-excel"
    };
  }
);

function generateExcelXML(data: any[]): string {
  if (!data || data.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E6F3FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DateStyle">
   <NumberFormat ss:Format="dd/mm/yyyy"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Danh sách khách hàng">
  <Table>
   <Row><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Không có dữ liệu để xuất</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;
  }

  const headers = Object.keys(data[0]);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Size="11"/>
   <Interior ss:Color="#E6F3FF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="DateStyle">
   <NumberFormat ss:Format="dd/mm/yyyy hh:mm"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="TextStyle">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Danh sách khách hàng">
  <Table>`;

  // Header row with styling
  xml += "<Row ss:Height=\"25\">";
  headers.forEach(header => {
    xml += `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
  });
  xml += "</Row>";

  // Data rows with proper formatting
  data.forEach(row => {
    xml += "<Row>";
    headers.forEach(header => {
      const value = row[header];
      let cellValue = "";
      let dataType = "String";
      let styleID = "TextStyle";
      
      if (value === null || value === undefined) {
        cellValue = "";
      } else if (typeof value === "number") {
        cellValue = value.toString();
        dataType = "Number";
      } else if (value instanceof Date) {
        // Format date as DD/MM/YYYY HH:MM
        const date = new Date(value);
        cellValue = date.toLocaleDateString('vi-VN') + " " + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        styleID = "DateStyle";
      } else if (typeof value === "string" && (value.includes('T') && value.includes('-') && value.includes(':'))) {
        // Handle ISO date strings from database
        try {
          const date = new Date(value);
          cellValue = date.toLocaleDateString('vi-VN') + " " + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          styleID = "DateStyle";
        } catch {
          cellValue = escapeXml(value.toString());
        }
      } else {
        cellValue = escapeXml(value.toString());
      }
      
      xml += `<Cell ss:StyleID="${styleID}"><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
    });
    xml += "</Row>";
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}