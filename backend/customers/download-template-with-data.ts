import { api } from "encore.dev/api";
import * as XLSX from "xlsx";
import db from "../db";

export const downloadTemplateWithData = api(
  { method: "GET", path: "/download-template-with-data", expose: true },
  async (): Promise<{ fileContent: string; fileName: string }> => {
    try {
      console.log('Starting template generation with database data...');
      
      // Get master data for sample values with error handling
      let employeeRows: string[] = [];
      let customerTypeRows: string[] = [];
      let productRows: string[] = [];
      let provinceRows: string[] = [];
      let leadSourceRows: string[] = [];
      let stageRows: string[] = [];

      try {
        // Employees
        for await (const row of db.query`SELECT name FROM employees WHERE active = true LIMIT 3`) {
          if (row.name) employeeRows.push(row.name);
        }
        console.log('Found employees:', employeeRows.length);
      } catch (error) {
        console.warn('Could not fetch employees:', error);
        employeeRows = ['Admin User'];
      }

      try {
        // Customer types
        for await (const row of db.query`SELECT name FROM customer_types WHERE active = true LIMIT 3`) {
          if (row.name) customerTypeRows.push(row.name);
        }
        console.log('Found customer types:', customerTypeRows.length);
      } catch (error) {
        console.warn('Could not fetch customer types:', error);
        customerTypeRows = ['Doanh nghiệp', 'Cá nhân'];
      }

      try {
        // Products
        for await (const row of db.query`SELECT name FROM products WHERE active = true LIMIT 3`) {
          if (row.name) productRows.push(row.name);
        }
        console.log('Found products:', productRows.length);
      } catch (error) {
        console.warn('Could not fetch products:', error);
        productRows = ['Phần mềm', 'Dịch vụ'];
      }

      try {
        // Provinces
        for await (const row of db.query`SELECT name FROM provinces LIMIT 5`) {
          if (row.name) provinceRows.push(row.name);
        }
        console.log('Found provinces:', provinceRows.length);
      } catch (error) {
        console.warn('Could not fetch provinces:', error);
        provinceRows = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];
      }

      try {
        // Lead sources
        for await (const row of db.query`SELECT name FROM lead_sources WHERE active = true LIMIT 3`) {
          if (row.name) leadSourceRows.push(row.name);
        }
        console.log('Found lead sources:', leadSourceRows.length);
      } catch (error) {
        console.warn('Could not fetch lead sources:', error);
        leadSourceRows = ['Website', 'Giới thiệu', 'Facebook'];
      }

      try {
        // Stages
        for await (const row of db.query`SELECT name FROM stages WHERE active = true LIMIT 3`) {
          if (row.name) stageRows.push(row.name);
        }
        console.log('Found stages:', stageRows.length);
      } catch (error) {
        console.warn('Could not fetch stages:', error);
        stageRows = ['Prospect', 'Lead', 'Customer'];
      }

      // Create Excel template data with real data
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
        // Sample row 3 - minimal data
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

      console.log('Creating workbook...');
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 },
        { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 30 }, { wch: 18 }
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách hàng');

      // Create instruction sheet with actual data
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
        ['Nhân viên có sẵn:']
      ];

      // Add actual data from database
      employeeRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });
      
      instructionData.push(['']);
      instructionData.push(['Loại khách hàng có sẵn:']);
      customerTypeRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Sản phẩm có sẵn:']);
      productRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Nguồn khách hàng có sẵn:']);
      leadSourceRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Giai đoạn có sẵn:']);
      stageRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      instructionData.push(['']);
      instructionData.push(['Tỉnh/Thành phố có sẵn:']);
      provinceRows.forEach(name => {
        instructionData.push([`   - ${name}`]);
      });

      const instructionWorksheet = XLSX.utils.aoa_to_sheet(instructionData);
      instructionWorksheet['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, instructionWorksheet, 'Hướng dẫn');

      console.log('Converting to buffer...');
      
      // Convert to buffer and base64
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const base64Content = buffer.toString('base64');
      
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `mau_import_khach_hang_${currentDate}.xlsx`;

      console.log('Template generation completed successfully');
      
      return {
        fileContent: base64Content,
        fileName: fileName
      };
    } catch (error) {
      console.error("Template generation error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack
      });
      
      throw new Error(`Không thể tạo file mẫu: ${errorMessage}`);
    }
  }
);