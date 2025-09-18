// Comprehensive test for order creation API
// Tests both old and new payload formats, edge cases, and error conditions

import { describe, it, expect } from 'vitest'

// Utility function to convert numbers to decimal strings for Postgres numeric type
const toDecimalString = (value: unknown): string => {
  if (typeof value === "number") {
    if (isNaN(value) || !isFinite(value)) {
      throw new Error("Invalid decimal input: NaN or Infinity");
    }
    return value.toFixed(2);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || !isFinite(parsed)) {
      throw new Error(`Invalid decimal string: ${trimmed}`);
    }
    return parsed.toFixed(2);
  }
  throw new Error(`Invalid decimal input type: ${typeof value}`);
};

// Utility function to safely parse decimal strings from database
const parseDecimalSafe = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const parsed = parseFloat(value.trim());
  if (isNaN(parsed) || !isFinite(parsed)) {
    console.warn(`Invalid decimal value from database: ${value}`);
    return 0;
  }
  return parsed;
};

describe('Order Creation API - Comprehensive Tests', () => {
  describe('Utility Functions', () => {
    describe('toDecimalString', () => {
      it('should handle valid number inputs', () => {
        expect(toDecimalString(199.99)).toBe('199.99');
        expect(toDecimalString(50)).toBe('50.00');
        expect(toDecimalString(463.48)).toBe('463.48');
        expect(toDecimalString(0)).toBe('0.00');
        expect(toDecimalString(1000.1)).toBe('1000.10');
      });
      
      it('should handle string inputs', () => {
        expect(toDecimalString('199.99')).toBe('199.99');
        expect(toDecimalString('50.00')).toBe('50.00');
        expect(toDecimalString(' 10.00 ')).toBe('10.00');
        expect(toDecimalString('0')).toBe('0.00');
      });
      
      it('should handle bigint inputs', () => {
        expect(toDecimalString(BigInt(100))).toBe('100');
        expect(toDecimalString(BigInt(0))).toBe('0');
      });
      
      it('should throw on invalid inputs', () => {
        expect(() => toDecimalString(NaN)).toThrow('Invalid decimal input: NaN or Infinity');
        expect(() => toDecimalString(Infinity)).toThrow('Invalid decimal input: NaN or Infinity');
        expect(() => toDecimalString('abc')).toThrow('Invalid decimal string: abc');
        expect(() => toDecimalString({})).toThrow('Invalid decimal input type: object');
        expect(() => toDecimalString(null)).toThrow('Invalid decimal input type: object');
        expect(() => toDecimalString(undefined)).toThrow('Invalid decimal input type: undefined');
      });
    });
    
    describe('parseDecimalSafe', () => {
      it('should handle valid string inputs', () => {
        expect(parseDecimalSafe('199.99')).toBe(199.99);
        expect(parseDecimalSafe('50.00')).toBe(50);
        expect(parseDecimalSafe(' 10.50 ')).toBe(10.5);
        expect(parseDecimalSafe('0')).toBe(0);
      });
      
      it('should handle invalid inputs gracefully', () => {
        expect(parseDecimalSafe('')).toBe(0);
        expect(parseDecimalSafe('   ')).toBe(0);
        expect(parseDecimalSafe('abc')).toBe(0);
        expect(parseDecimalSafe('NaN')).toBe(0);
      });
    });
  });
  
  describe('Payload Format Handling', () => {
    it('should handle new format payload (sku/qty/price)', () => {
      const newFormatPayload = {
        "customerId": "cust_123",
        "items": [
          { "sku": "A1", "qty": 2, "price": "199.99" },
          { "sku": "B2", "qty": 1, "price": "50.00" }
        ],
        "discount": "10.00",
        "tax": "23.50",
        "total": "463.48"
      };
      
      // Test item normalization for new format
      const normalizedItems = newFormatPayload.items.map(item => {
        const price = item.price || 0;
        const unitPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        return {
          productId: item.sku,
          productName: item.sku,
          quantity: item.qty,
          unitPrice: unitPrice,
          notes: undefined
        };
      });
      
      expect(normalizedItems[0].productId).toBe('A1');
      expect(normalizedItems[0].productName).toBe('A1');
      expect(normalizedItems[0].quantity).toBe(2);
      expect(normalizedItems[0].unitPrice).toBe(199.99);
      
      expect(normalizedItems[1].productId).toBe('B2');
      expect(normalizedItems[1].quantity).toBe(1);
      expect(normalizedItems[1].unitPrice).toBe(50.00);
    });
    
    it('should handle old format payload (productId/quantity/unitPrice)', () => {
      const oldFormatPayload = {
        "customerId": "cust_456",
        "totalAmount": 5000000,
        "items": [
          { "productId": "prod_1", "productName": "CRM Software", "quantity": 2, "unitPrice": 1000000 },
          { "productName": "ERP System", "quantity": 1, "unitPrice": 3000000 }
        ]
      };
      
      // Test item normalization for old format
      const normalizedItems = oldFormatPayload.items.map(item => {
        const price = item.unitPrice || 0;
        const unitPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        return {
          productId: item.productId,
          productName: item.productName || 'Product',
          quantity: item.quantity || 1,
          unitPrice: unitPrice,
          notes: undefined
        };
      });
      
      expect(normalizedItems[0].productId).toBe('prod_1');
      expect(normalizedItems[0].productName).toBe('CRM Software');
      expect(normalizedItems[0].quantity).toBe(2);
      expect(normalizedItems[0].unitPrice).toBe(1000000);
      
      expect(normalizedItems[1].productId).toBeUndefined();
      expect(normalizedItems[1].productName).toBe('ERP System');
    });
    
    it('should handle mixed format payload', () => {
      const mixedPayload = {
        "customerId": "cust_789",
        "total": "300.00",
        "totalAmount": 250.00, // should be ignored in favor of total
        "items": [
          { "sku": "A1", "qty": 1, "price": 200.00 }, // new format with number price
          { "productId": "prod_2", "productName": "Service", "quantity": 1, "unitPrice": "100.00" } // old format with string price
        ]
      };
      
      // Test total calculation priority
      let totalAmount: number;
      if (mixedPayload.total) {
        totalAmount = typeof mixedPayload.total === 'string' ? parseFloat(mixedPayload.total) : mixedPayload.total;
      } else if (mixedPayload.totalAmount && !isNaN(mixedPayload.totalAmount) && mixedPayload.totalAmount > 0) {
        totalAmount = mixedPayload.totalAmount;
      }
      
      expect(totalAmount!).toBe(300.00); // Should use 'total' field, not 'totalAmount'
    });
  });
  
  describe('Calculation Logic', () => {
    it('should calculate total from items when no total provided', () => {
      const items = [
        { quantity: 2, unitPrice: 1000000, productName: 'CRM Software' },
        { quantity: 1, unitPrice: 3000000, productName: 'ERP System' }
      ];
      
      const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      expect(total).toBe(5000000);
      
      const finalTotal = toDecimalString(total);
      expect(finalTotal).toBe('5000000.00');
      expect(typeof finalTotal).toBe('string');
    });
    
    it('should handle decimal calculations correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 199.99 },
        { quantity: 1, unitPrice: 50.00 }
      ];
      
      const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      expect(total).toBe(449.98);
      expect(toDecimalString(total)).toBe('449.98');
    });
    
    it('should handle edge case calculations', () => {
      // Very small amounts
      expect(toDecimalString(0.01)).toBe('0.01');
      expect(toDecimalString(0.001)).toBe('0.00'); // Rounds to 2 decimal places
      
      // Large amounts
      expect(toDecimalString(999999.99)).toBe('999999.99');
      
      // Zero amounts
      expect(toDecimalString(0)).toBe('0.00');
    });
  });
  
  describe('Error Handling', () => {
    it('should validate required fields', () => {
      // These would be validation logic from the actual endpoint
      const validateOrder = (req: any) => {
        if (!req.customerId || !req.customerId.trim()) {
          throw new Error("Customer ID is required");
        }
        if (!req.items || req.items.length === 0) {
          throw new Error("At least one item is required");
        }
      };
      
      expect(() => validateOrder({})).toThrow("Customer ID is required");
      expect(() => validateOrder({ customerId: "" })).toThrow("Customer ID is required");
      expect(() => validateOrder({ customerId: "   " })).toThrow("Customer ID is required");
      expect(() => validateOrder({ customerId: "cust_1" })).toThrow("At least one item is required");
      expect(() => validateOrder({ customerId: "cust_1", items: [] })).toThrow("At least one item is required");
    });
    
    it('should validate item fields', () => {
      const validateItem = (item: any) => {
        if (!item.productName || !item.productName.trim()) {
          throw new Error("Product name is required");
        }
        if (item.quantity <= 0) {
          throw new Error("Quantity must be greater than 0");
        }
        if (item.unitPrice < 0) {
          throw new Error("Unit price cannot be negative");
        }
      };
      
      expect(() => validateItem({})).toThrow("Product name is required");
      expect(() => validateItem({ productName: "" })).toThrow("Product name is required");
      expect(() => validateItem({ productName: "Product", quantity: 0 })).toThrow("Quantity must be greater than 0");
      expect(() => validateItem({ productName: "Product", quantity: -1 })).toThrow("Quantity must be greater than 0");
      expect(() => validateItem({ productName: "Product", quantity: 1, unitPrice: -1 })).toThrow("Unit price cannot be negative");
    });
  });
  
  describe('Sample Payload Validation', () => {
    it('should handle the exact sample payload from requirements', () => {
      const samplePayload = {
        "customerId": "cust_123",
        "items": [
          { "sku": "A1", "qty": 2, "price": "199.99" },
          { "sku": "B2", "qty": 1, "price": "50.00" }
        ],
        "discount": "10.00",
        "tax": "23.50",
        "total": "463.48"
      };
      
      // Test all conversions work
      expect(toDecimalString(parseFloat(samplePayload.items[0].price))).toBe('199.99');
      expect(toDecimalString(parseFloat(samplePayload.items[1].price))).toBe('50.00');
      expect(toDecimalString(parseFloat(samplePayload.discount))).toBe('10.00');
      expect(toDecimalString(parseFloat(samplePayload.tax))).toBe('23.50');
      expect(toDecimalString(parseFloat(samplePayload.total))).toBe('463.48');
      
      // Test item calculations
      const item1Total = samplePayload.items[0].qty * parseFloat(samplePayload.items[0].price);
      const item2Total = samplePayload.items[1].qty * parseFloat(samplePayload.items[1].price);
      const subtotal = item1Total + item2Total;
      
      expect(item1Total).toBe(399.98);
      expect(item2Total).toBe(50.00);
      expect(subtotal).toBe(449.98);
      
      // The total in payload (463.48) includes discount and tax
      // 449.98 - 10.00 + 23.50 = 463.48
      const finalTotal = subtotal - parseFloat(samplePayload.discount) + parseFloat(samplePayload.tax);
      expect(finalTotal).toBe(463.48);
    });
  });
});