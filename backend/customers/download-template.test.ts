import { describe, it, expect } from "@jest/globals";
import * as XLSX from "xlsx";

describe("Excel Template Generation", () => {
  it("should create a basic Excel file", () => {
    const testData = [
      ['Nhân viên phụ trách', 'Tên khách hàng*', 'Điện thoại'],
      ['Admin User', 'Test Customer', '0901234567'],
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const base64 = buffer.toString('base64');
    
    expect(base64).toBeDefined();
    expect(base64.length).toBeGreaterThan(0);
    expect(typeof base64).toBe('string');
    
    // Verify it can be parsed back
    const parsedWorkbook = XLSX.read(Buffer.from(base64, 'base64'), { type: 'buffer' });
    expect(parsedWorkbook.SheetNames).toContain('Test');
    
    const parsedWorksheet = parsedWorkbook.Sheets['Test'];
    const parsedData = XLSX.utils.sheet_to_json(parsedWorksheet, { header: 1 });
    
    expect(parsedData.length).toBe(2);
    expect((parsedData[0] as any)[1]).toBe('Tên khách hàng*');
  });
  
  it("should handle Vietnamese characters", () => {
    const testData = [
      ['Nhân viên phụ trách', 'Tên khách hàng'],
      ['Nguyễn Văn A', 'Công ty TNHH ABC'],
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vietnamese');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const base64 = buffer.toString('base64');
    
    // Parse back and verify Vietnamese characters are preserved
    const parsedWorkbook = XLSX.read(Buffer.from(base64, 'base64'), { type: 'buffer' });
    const parsedWorksheet = parsedWorkbook.Sheets['Vietnamese'];
    const parsedData = XLSX.utils.sheet_to_json(parsedWorksheet, { header: 1 });
    
    expect((parsedData[1] as any)[0]).toBe('Nguyễn Văn A');
    expect((parsedData[1] as any)[1]).toBe('Công ty TNHH ABC');
  });
});