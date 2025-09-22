import { api } from "encore.dev/api";
import * as XLSX from "xlsx";
import db from "../db";

export const downloadTemplate = api(
  { method: "GET", path: "/download-template", expose: true },
  async (): Promise<{ fileContent: string; fileName: string }> => {
    try {
      // Get master data for sample values
      const employeeRows: any[] = [];
      const customerTypeRows: any[] = [];
      const productRows: any[] = [];
      const provinceRows: any[] = [];
      const leadSourceRows: any[] = [];
      const stageRows: any[] = [];

      for await (const row of db.query`SELECT name FROM employees WHERE active = true LIMIT 3`) {
        employeeRows.push(row.name);
      }
      for await (const row of db.query`SELECT name FROM customer_types WHERE active = true LIMIT 3`) {
        customerTypeRows.push(row.name);
      }
      for await (const row of db.query`SELECT name FROM products WHERE active = true LIMIT 3`) {
        productRows.push(row.name);
      }
      for await (const row of db.query`SELECT name FROM provinces LIMIT 5`) {
        provinceRows.push(row.name);
      }
      for await (const row of db.query`SELECT name FROM lead_sources WHERE active = true LIMIT 3`) {
        leadSourceRows.push(row.name);
      }
      for await (const row of db.query`SELECT name FROM stages WHERE active = true LIMIT 3`) {
        stageRows.push(row.name);
      }

      // Create Excel template data
      const templateData = [
        // Header row
        [
          'Nhân viên phụ trách',
          'Tên khách hàng*',
          'Điện thoại',
          'Email',
          'Loại khách hàng',
          'Tên công ty',
          'Sản phẩm',
          'Nguồn khách hàng',
          'Giai đoạn',
          'Ghi chú',
          'Tỉnh/Thành phố'
        ],
        // Sample row 1
        [
          employeeRows[0] || 'Admin User',
          'Nguyễn Văn A',
          '0901234567',
          'nguyenvana@email.com',
          customerTypeRows[0] || 'Doanh nghiệp',
          'Công ty ABC',
          productRows[0] || 'Phần mềm',
          leadSourceRows[0] || 'Website',
          stageRows[0] || 'Prospect',
          'Khách hàng tiềm năng cao',
          provinceRows[0] || 'Hà Nội'
        ],
        // Sample row 2
        [
          employeeRows[1] || employeeRows[0] || 'Admin User',
          'Trần Thị B',
          '0987654321',
          'tranthib@company.com',
          customerTypeRows[1] || customerTypeRows[0] || 'Cá nhân',
          'Công ty XYZ',
          `${productRows[0] || 'Phần mềm'}, ${productRows[1] || 'Dịch vụ'}`,
          leadSourceRows[1] || leadSourceRows[0] || 'Giới thiệu',
          stageRows[1] || stageRows[0] || 'Lead',
          'Cần theo dõi thường xuyên',
          provinceRows[1] || provinceRows[0] || 'Hồ Chí Minh'
        ],
        // Sample row 3 - minimal data to show optional fields
        [
          '',
          'Lê Văn C',
          '0912345678',
          '',
          '',
          '',
          productRows[2] || productRows[0] || 'Dịch vụ',
          '',
          '',
          'Khách hàng chỉ có thông tin cơ bản',
          ''
        ]
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Nhân viên phụ trách
        { wch: 20 }, // Tên khách hàng
        { wch: 15 }, // Điện thoại
        { wch: 25 }, // Email
        { wch: 18 }, // Loại khách hàng
        { wch: 20 }, // Tên công ty
        { wch: 20 }, // Sản phẩm
        { wch: 18 }, // Nguồn khách hàng
        { wch: 15 }, // Giai đoạn
        { wch: 30 }, // Ghi chú
        { wch: 18 }  // Tỉnh/Thành phố
      ];
      worksheet['!cols'] = colWidths;

      // Add some styling (header row)
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:K1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E3F2FD" } }
          };
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách hàng');

      // Add instruction sheet
      const instructionData = [
        ['HƯỚNG DẪN SỬ DỤNG FILE MẪU IMPORT KHÁCH HÀNG'],
        [''],
        ['1. CÁC CỘT THÔNG TIN:'],
        ['   A: Nhân viên phụ trách - Tên nhân viên trong hệ thống (không bắt buộc)'],
        ['   B: Tên khách hàng - BẮT BUỘC, không được để trống'],
        ['   C: Điện thoại - Số điện thoại liên hệ'],
        ['   D: Email - Địa chỉ email, phải đúng định dạng nếu nhập'],
        ['   E: Loại khách hàng - Phải khớp với dữ liệu có sẵn trong hệ thống'],
        ['   F: Tên công ty - Tên công ty của khách hàng'],
        ['   G: Sản phẩm - Có thể nhập nhiều sản phẩm, cách nhau bằng dấu phẩy'],
        ['   H: Nguồn khách hàng - Nguồn mà khách hàng biết đến dịch vụ'],
        ['   I: Giai đoạn - Giai đoạn hiện tại của khách hàng'],
        ['   J: Ghi chú - Thông tin bổ sung về khách hàng'],
        ['   K: Tỉnh/Thành phố - Địa danh khách hàng'],
        [''],
        ['2. LƯU Ý QUAN TRỌNG:'],
        ['   - Chỉ có cột B (Tên khách hàng) là bắt buộc'],
        ['   - Tên nhân viên, loại khách hàng, sản phẩm phải khớp với dữ liệu có sẵn'],
        ['   - Email phải đúng định dạng (example@domain.com)'],
        ['   - Không được trùng tên khách hàng đã có trong hệ thống'],
        ['   - Sản phẩm có thể ghi nhiều cái, cách nhau bằng dấu phẩy'],
        [''],
        ['3. CÁC GIÁ TRỊ HỢP LỆ HIỆN TẠI:'],
        [''],
        ['Nhân viên:']
      ];

      // Add current valid values to instruction
      let currentRow = instructionData.length;
      employeeRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });
      
      instructionData.push(['']);
      instructionData.push(['Loại khách hàng:']);
      customerTypeRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Sản phẩm:']);
      productRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Nguồn khách hàng:']);
      leadSourceRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Giai đoạn:']);
      stageRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      const instructionWorksheet = XLSX.utils.aoa_to_sheet(instructionData);
      instructionWorksheet['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, instructionWorksheet, 'Hướng dẫn');

      // Convert to buffer and base64
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const base64Content = buffer.toString('base64');
      
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `mau_import_khach_hang_${currentDate}.xlsx`;

      return {
        fileContent: base64Content,
        fileName: fileName
      };
    } catch (error) {
      console.error("Template generation error:", error);
      throw new Error("Không thể tạo file mẫu");
    }
  }
);