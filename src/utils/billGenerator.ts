import jsPDF from 'jspdf';

interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface BillData {
  invoiceNumber: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeGST?: string;
  customerName?: string;
  customerPhone?: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

// Thermal receipt width (80mm = ~226 pixels at 72 DPI, converted to jsPDF units)
const RECEIPT_WIDTH = 80; // mm
const MARGIN = 5; // mm

export async function generateBillPDF(billData: BillData): Promise<void> {
  // Calculate approximate height needed
  const estimatedHeight = 80 + (billData.items.length * 10) + 40; // Header + items + footer
  
  // Create a narrow PDF like a thermal receipt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [RECEIPT_WIDTH, Math.max(estimatedHeight, 100)] // Dynamic height
  });

  let yPos = MARGIN;
  const centerX = RECEIPT_WIDTH / 2;

  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, fontSize: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.text(text, centerX, y, { align: 'center' });
  };

  // Helper function to add line
  const addLine = (y: number) => {
    doc.line(MARGIN, y, RECEIPT_WIDTH - MARGIN, y);
  };

  // Header - Store Name
  addCenteredText(billData.storeName, yPos, 14, 'bold');
  yPos += 6;

  // Store Details
  if (billData.storeAddress) {
    addCenteredText(billData.storeAddress, yPos, 8);
    yPos += 4;
  }
  if (billData.storePhone) {
    addCenteredText(`Ph: ${billData.storePhone}`, yPos, 8);
    yPos += 4;
  }
  if (billData.storeGST) {
    addCenteredText(`GST: ${billData.storeGST}`, yPos, 8);
    yPos += 4;
  }

  // Divider
  yPos += 2;
  addLine(yPos);
  yPos += 4;

  // Invoice and Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`INV: ${billData.invoiceNumber}`, MARGIN, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${billData.date}`, MARGIN, yPos);
  yPos += 4;

  // Customer Details
  if (billData.customerName) {
    doc.text(`Customer: ${billData.customerName}`, MARGIN, yPos);
    yPos += 4;
    if (billData.customerPhone) {
      doc.text(`Ph: ${billData.customerPhone}`, MARGIN, yPos);
      yPos += 4;
    }
  }

  // Divider
  yPos += 1;
  addLine(yPos);
  yPos += 4;

  // Items Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM', MARGIN, yPos);
  doc.text('QTY', 45, yPos, { align: 'center' });
  doc.text('PRICE', 58, yPos, { align: 'right' });
  doc.text('TOTAL', RECEIPT_WIDTH - MARGIN, yPos, { align: 'right' });
  yPos += 3;
  addLine(yPos);
  yPos += 4;

  // Items
  doc.setFont('helvetica', 'normal');
  billData.items.forEach((item) => {
    // Item name (wrap if too long)
    const itemName = item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name;
    doc.text(itemName, MARGIN, yPos);
    
    // Quantity, Price, Total on same line
    doc.text(item.quantity.toString(), 45, yPos, { align: 'center' });
    doc.text(`Rs${item.unitPrice.toFixed(2)}`, 58, yPos, { align: 'right' });
    doc.text(`Rs${item.total.toFixed(2)}`, RECEIPT_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 5;

    // Discount if any
    if (item.discount > 0) {
      doc.setFontSize(7);
      doc.text(`  Disc: -Rs${item.discount.toFixed(2)}`, MARGIN, yPos);
      doc.setFontSize(8);
      yPos += 4;
    }
  });

  // Divider
  yPos += 1;
  addLine(yPos);
  yPos += 4;

  // Totals
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', MARGIN, yPos);
  doc.text(`Rs${billData.subtotal.toFixed(2)}`, RECEIPT_WIDTH - MARGIN, yPos, { align: 'right' });
  yPos += 4;

  if (billData.discount > 0) {
    doc.text('Discount:', MARGIN, yPos);
    doc.text(`-Rs${billData.discount.toFixed(2)}`, RECEIPT_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 4;
  }

  if (billData.tax > 0) {
    doc.text('Tax:', MARGIN, yPos);
    doc.text(`Rs${billData.tax.toFixed(2)}`, RECEIPT_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 4;
  }

  // Grand Total
  yPos += 1;
  addLine(yPos);
  yPos += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', MARGIN, yPos);
  doc.text(`Rs${billData.total.toFixed(2)}`, RECEIPT_WIDTH - MARGIN, yPos, { align: 'right' });
  yPos += 5;

  // Payment Method
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  addCenteredText(`Payment: ${billData.paymentMethod.toUpperCase()}`, yPos, 8);
  yPos += 6;

  // Divider
  addLine(yPos);
  yPos += 4;

  // Footer
  addCenteredText('Thank you for your business!', yPos, 9, 'bold');
  yPos += 4;
  addCenteredText('Visit again!', yPos, 8);
  yPos += 6;

  // Eco-friendly message
  doc.setFontSize(7);
  addCenteredText('Digital receipt - Save paper, Save trees', yPos, 7);

  // Save PDF
  doc.save(`Bill_${billData.invoiceNumber}.pdf`);
}
