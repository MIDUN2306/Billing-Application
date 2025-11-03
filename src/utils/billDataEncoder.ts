// Utility to encode/decode bill data for QR codes

export interface CompactBillData {
  inv: string;      // Invoice number
  st: string;       // Store name
  dt: string;       // Date
  tot: number;      // Total
  itm: Array<{     // Items
    n: string;      // Name
    q: number;      // Quantity
    p: number;      // Price
  }>;
  cst?: string;     // Customer (optional)
  pm: string;       // Payment method
}

export function encodeBillData(billData: any): string {
  const compact: CompactBillData = {
    inv: billData.invoiceNumber,
    st: billData.storeName,
    dt: billData.date,
    tot: billData.total,
    itm: billData.items.map((item: any) => ({
      n: item.name,
      q: item.quantity,
      p: item.unitPrice
    })),
    cst: billData.customerName,
    pm: billData.paymentMethod
  };

  // Convert to JSON and compress
  const json = JSON.stringify(compact);
  
  // Base64 encode for QR code
  const encoded = btoa(json);
  
  // Add prefix to identify this as bill data
  return `BILL:${encoded}`;
}

export function decodeBillData(qrData: string): CompactBillData | null {
  try {
    if (!qrData.startsWith('BILL:')) return null;
    
    const encoded = qrData.substring(5);
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode bill data:', error);
    return null;
  }
}

export function estimateQRSize(billData: any): number {
  const encoded = encodeBillData(billData);
  return encoded.length;
}
