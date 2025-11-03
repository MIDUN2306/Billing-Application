import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, X } from 'lucide-react';

interface QRCodeDisplayProps {
  billData: {
    invoiceNumber: string;
    date: string;
    total: number;
    storeName: string;
    items: any[];
    customerName?: string;
  };
  onClose: () => void;
  onDownload: () => void;
}

export function QRCodeDisplay({ billData, onClose, onDownload }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      // Encode bill data compactly
      const compactData = {
        inv: billData.invoiceNumber,
        st: billData.storeName,
        dt: billData.date,
        tot: billData.total,
        itm: billData.items.map((item: any) => ({
          n: item.name,
          q: item.quantity,
          p: item.unitPrice || item.price || 0
        })),
        cst: billData.customerName || '',
        pm: 'CASH' // Default payment method for QR
      };

      // Convert to base64
      const jsonStr = JSON.stringify(compactData);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      
      // Create URL to bill viewer with data in hash
      const qrData = `${window.location.origin}/bill-viewer.html#BILL:${base64}`;

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
        } else {
          setQrGenerated(true);
        }
      });
    }
  }, [billData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bill Ready!</h2>
            <p className="text-sm text-gray-600 mt-1">Scan QR for bill details or download PDF below</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-primary-100">
            <canvas ref={canvasRef} className="block" />
          </div>

          {qrGenerated && (
            <div className="mt-6 text-center space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                Invoice: {billData.invoiceNumber}
              </p>
              <p className="text-2xl font-bold text-primary-600">
                Total: Rs{billData.total.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-4">
                Scan this QR code to view bill details
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Click "Download PDF Bill" below to save the receipt
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl space-y-3">
          <button
            onClick={onDownload}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Download className="w-5 h-5" />
            Download PDF Bill
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Close
          </button>

          <div className="pt-3 border-t">
            <p className="text-xs text-center text-gray-500">
              🌱 Save paper, save trees - Go digital!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
