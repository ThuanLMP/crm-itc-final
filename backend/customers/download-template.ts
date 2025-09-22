import { api } from "encore.dev/api";
import * as XLSX from "xlsx";
import db from "../db";

export const downloadTemplate = api(
  { method: "GET", path: "/download-template", expose: true },
  async (): Promise<{ fileContent: string; fileName: string }> => {
    try {
      console.log('Starting template generation...');
      
      // Start with static data first to avoid database issues
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
          'Admin User',
          'Nguyễn Văn A',
          '0901234567',
          'nguyenvana@email.com',
          'Doanh nghiệp',
          'Công ty ABC',
          'Phần mềm',
          'Website',
          'Prospect',
          'Khách hàng tiềm năng cao',
          'Hà Nội'
        ],
        // Sample row 2
        [
          'Admin User',
          'Trần Thị B',
          '0987654321',
          'tranthib@company.com',
          'Cá nhân',
          'Công ty XYZ',
          'Phần mềm, Dịch vụ',
          'Giới thiệu',
          'Lead',
          'Cần theo dõi thường xuyên',
          'Hồ Chí Minh'
        ],
        // Sample row 3 - minimal data
        [
          '',
          'Lê Văn C',
          '0912345678',
          '',
          '',
          '',
          'Dịch vụ',
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

      console.log('Setting column widths...');
      
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

      console.log('Adding worksheet to workbook...');
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách hàng');

      console.log('Creating instruction sheet...');
      
      // Add simplified instruction sheet
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
        ['3. VÍ DỤ DỮ LIỆU HỢP LỆ:'],
        ['   - Nhân viên: Admin User'],
        ['   - Loại khách hàng: Doanh nghiệp, Cá nhân'],
        ['   - Sản phẩm: Phần mềm, Dịch vụ'],
        ['   - Nguồn: Website, Giới thiệu, Facebook'],
        ['   - Giai đoạn: Prospect, Lead, Customer'],
        ['   - Tỉnh/TP: Hà Nội, Hồ Chí Minh, Đà Nẵng'],
      ];

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
      
      // Return detailed error information
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