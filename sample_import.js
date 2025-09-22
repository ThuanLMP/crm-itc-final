// Tạo file Excel mẫu để test import
const XLSX = require('xlsx');

// Tạo dữ liệu mẫu
const sampleData = [
  ['Nhân viên phụ trách', 'Tên khách hàng', 'Điện thoại', 'Email', 'Loại khách hàng', 'Tên công ty', 'Sản phẩm', 'Nguồn khách hàng', 'Giai đoạn', 'Ghi chú', 'Tỉnh/Thành phố'],
  ['Admin User', 'Nguyễn Văn A', '0901234567', 'nguyenvana@email.com', 'Doanh nghiệp', 'Công ty ABC', 'Phần mềm', 'Website', 'Prospect', 'Khách hàng tiềm năng', 'Hà Nội'],
  ['Admin User', 'Trần Thị B', '0987654321', 'tranthib@email.com', 'Cá nhân', 'Công ty XYZ', 'Phần mềm, Dịch vụ', 'Giới thiệu', 'Lead', 'Cần theo dõi', 'Hồ Chí Minh'],
  ['', 'Lê Văn C', '0912345678', '', 'Doanh nghiệp', '', 'Dịch vụ', '', '', 'Test import', ''],
  // Dòng lỗi để test validation
  ['', '', '', '', '', '', '', '', '', '', ''], // Tên khách hàng trống
  ['Admin User', 'Nguyễn Văn D', '0901111111', 'invalid-email', '', 'Test Company', '', '', '', '', ''], // Email không hợp lệ
];

// Tạo workbook và worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

// Thêm worksheet vào workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

// Xuất file
XLSX.writeFile(workbook, 'sample_customers.xlsx');

console.log('✅ Đã tạo file sample_customers.xlsx để test import');
console.log('📋 File chứa:');
console.log('  - 3 khách hàng hợp lệ');
console.log('  - 2 dòng lỗi để test validation');
console.log('  - Các trường hợp: có/không có nhân viên phụ trách, nhiều sản phẩm, email không hợp lệ');