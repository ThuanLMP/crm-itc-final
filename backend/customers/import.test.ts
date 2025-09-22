import { describe, it, expect } from "@jest/globals";
import * as XLSX from "xlsx";

describe("Import validation", () => {
  it("should create valid Excel structure", () => {
    // Test data tương tự như sẽ import
    const testData = [
      ['Nhân viên phụ trách', 'Tên khách hàng', 'Điện thoại', 'Email', 'Loại khách hàng', 'Tên công ty', 'Sản phẩm', 'Nguồn khách hàng', 'Giai đoạn', 'Ghi chú', 'Tỉnh/Thành phố'],
      ['Admin User', 'Test Customer', '0901234567', 'test@example.com', 'Doanh nghiệp', 'Test Company', 'Phần mềm', 'Website', 'Prospect', 'Test note', 'Hà Nội'],
    ];
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Convert to buffer để test
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const base64 = buffer.toString('base64');
    
    // Verify có thể parse lại
    const parsedWorkbook = XLSX.read(Buffer.from(base64, 'base64'), { type: 'buffer' });
    const parsedWorksheet = parsedWorkbook.Sheets[parsedWorkbook.SheetNames[0]];
    const parsedData = XLSX.utils.sheet_to_json(parsedWorksheet, { header: 1, defval: '' });
    
    expect(parsedData.length).toBe(2);
    expect(parsedData[0]).toEqual(testData[0]);
    expect(parsedData[1]).toEqual(testData[1]);
  });
  
  it("should handle empty cells correctly", () => {
    const testData = [
      ['A', 'B', 'C'],
      ['', 'value', ''],
      ['value', '', 'value'],
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const parsedWorksheet = parsedWorkbook.Sheets[parsedWorkbook.SheetNames[0]];
    const parsedData = XLSX.utils.sheet_to_json(parsedWorksheet, { header: 1, defval: '' });
    
    // Với defval: '', empty cells sẽ thành empty string
    expect(parsedData[1][0]).toBe('');
    expect(parsedData[1][1]).toBe('value');
    expect(parsedData[1][2]).toBe('');
  });
});