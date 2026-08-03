import React from 'react';
import { Printer, Check, Store } from 'lucide-react';
import { Sale, SaleItem } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Modal } from '../shared/Modal';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  items: SaleItem[];
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  items
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Completed Successfully"
      subtitle={`Invoice #${sale.invoiceNumber}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Print Printable Section */}
        <div id="printable-receipt" className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-sans">
          {/* Receipt Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-600">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">SmartPOS Retail Store</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">123 Commerce Way, Suite 100</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Phone: +1 (800) 555-0199</p>
          </div>

          {/* Invoice Meta */}
          <div className="py-3 text-xs space-y-1 border-b border-dashed border-slate-300 dark:border-slate-600">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{formatDate(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{sale.cashierName || 'Staff'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span>{sale.customerName || 'Walk-in'}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-600">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 pb-1">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-1.5 font-medium pr-2 max-w-[120px] truncate">{it.productName}</td>
                    <td className="py-1.5 text-center font-mono">{it.quantity}</td>
                    <td className="py-1.5 text-right font-mono">{formatCurrency(it.sellingPrice)}</td>
                    <td className="py-1.5 text-right font-mono font-semibold">{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300 dark:border-slate-600 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span>{formatCurrency(sale.subTotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>+{formatCurrency(sale.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>TOTAL PAID:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-0.5">
              <span>Payment ({sale.paymentMethod}):</span>
              <span>{formatCurrency(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Change Due:</span>
              <span>{formatCurrency(sale.change)}</span>
            </div>
          </div>

          {/* Footer Barcode Simulation */}
          <div className="pt-4 text-center">
            <div className="h-10 bg-slate-900 dark:bg-slate-100 rounded-sm w-3/4 mx-auto opacity-80 flex items-center justify-center text-white dark:text-slate-900 font-mono text-[10px] tracking-[0.3em] font-bold">
              ||| | |||| | ||||| ||| ||| |
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Thank you for shopping with SmartPOS!</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center space-x-1 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
