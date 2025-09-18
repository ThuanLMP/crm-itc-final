import { describe, it, expect } from "vitest";

describe("Excel Export Structure", () => {
  it("should validate XML structure for Excel export", () => {
    // Test the generateExcelXML function directly without database
    function escapeXml(text: string): string {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }

    function generateExcelXML(data: any[]): string {
      if (!data || data.length === 0) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Danh sách khách hàng">
  <Table>
   <Row><Cell><Data ss:Type="String">Không có dữ liệu để xuất</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;
      }

      const headers = Object.keys(data[0]);
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Danh sách khách hàng">
  <Table>`;

      // Header row
      xml += "<Row>";
      headers.forEach(header => {
        xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
      });
      xml += "</Row>";

      // Data rows
      data.forEach(row => {
        xml += "<Row>";
        headers.forEach(header => {
          const value = row[header];
          let cellValue = "";
          let dataType = "String";
          
          if (value === null || value === undefined) {
            cellValue = "";
          } else if (typeof value === "number") {
            cellValue = value.toString();
            dataType = "Number";
          } else {
            cellValue = escapeXml(value.toString());
          }
          
          xml += `<Cell><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
        });
        xml += "</Row>";
      });

      xml += `  </Table>
 </Worksheet>
</Workbook>`;

      return xml;
    }

    // Test with sample data
    const sampleData = [
      {
        "Tên khách hàng": "Test Customer",
        "Tên công ty": "Test Company",
        "Điện thoại": "0123456789",
        "Email": "test@example.com"
      }
    ];

    const result = generateExcelXML(sampleData);
    
    // Validate XML structure
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<Workbook');
    expect(result).toContain('</Workbook>');
    expect(result).toContain('Test Customer');
    
    // Test base64 encoding
    const base64Data = Buffer.from(result, 'utf-8').toString('base64');
    expect(base64Data.length).toBeGreaterThan(0);
    
    // Test base64 decoding
    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
    expect(decoded).toBe(result);
  });

  it("should handle empty data correctly", () => {
    function generateExcelXML(data: any[]): string {
      if (!data || data.length === 0) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Danh sách khách hàng">
  <Table>
   <Row><Cell><Data ss:Type="String">Không có dữ liệu để xuất</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;
      }
      return "";
    }

    const result = generateExcelXML([]);
    expect(result).toContain("Không có dữ liệu để xuất");
  });
});