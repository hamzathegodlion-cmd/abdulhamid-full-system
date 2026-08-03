import React, { useState } from 'react';
import {
  Trash2, Plus, Minus, CreditCard, Banknote, Smartphone,
  DollarSign, User, CheckCircle2, Percent, Tag, ArrowRight
} from 'lucide-react';
import { CartItem, Customer, PaymentMethod } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { Modal } from '../shared/Modal';

interface POSCartProps {
  items: CartItem[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  onAddCustomer: (data: { name: string; phone?: string; email?: string }) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (paymentDetails: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    orderDiscount: number;
    taxRate: number;
    notes?: string;
  }) => Promise<void>;
}

export const POSCart: React.FC<POSCartProps> = ({
  items,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddCustomer,
  onUpdateQty,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  onCheckout
}) => {
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // e.g. 0, 5, 8
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subTotal = items.reduce((sum, item) => {
    const lineTotal = (item.product.sellingPrice * item.quantity) - item.discount;
    return sum + Math.max(0, lineTotal);
  }, 0);

  const taxAmount = (subTotal - orderDiscount) > 0 ? ((subTotal - orderDiscount) * (taxRate / 100)) : 0;
  const totalAmount = Math.max(0, subTotal - orderDiscount + taxAmount);

  const amountPaidNumber = Number(amountPaidInput) || totalAmount;
  const changeAmount = Math.max(0, amountPaidNumber - totalAmount);

  const handleOpenPayment = () => {
    if (items.length === 0) return;
    setAmountPaidInput(totalAmount.toFixed(2));
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    try {
      setIsSubmitting(true);
      await onCheckout({
        paymentMethod,
        amountPaid: amountPaidNumber,
        orderDiscount,
        taxRate,
        notes
      });
      setIsPaymentModalOpen(false);
      setOrderDiscount(0);
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    onAddCustomer({ name: newCustName.trim(), phone: newCustPhone.trim() });
    setNewCustName('');
    setNewCustPhone('');
    setIsAddCustomerModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header & Customer Picker */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <span>Order Register</span>
            <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono font-bold px-2 py-0.5 rounded-full">
              {items.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </h3>

          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs font-semibold text-rose-400 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Customer Select / Add */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const found = customers.find(c => c.id === e.target.value) || null;
                onSelectCustomer(found);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-zinc-200"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors"
            title="Add New Customer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-zinc-800/60">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-600">
              <Tag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Cart is empty</p>
            <p className="text-xs text-zinc-500 mt-1">Scan or tap products from the catalog to build an order</p>
          </div>
        ) : (
          items.map(({ product, quantity, discount }) => {
            const lineTotal = Math.max(0, (product.sellingPrice * quantity) - discount);

            return (
              <div key={product.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 group">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-100 truncate">
                    {product.name}
                  </h4>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {formatCurrency(product.sellingPrice)} × {quantity}
                  </div>

                  {/* Line Discount Input */}
                  <div className="mt-1.5 flex items-center space-x-1">
                    <span className="text-[10px] text-zinc-500 font-medium">Discount $</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={discount || ''}
                      onChange={(e) => onUpdateDiscount(product.id, Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-14 px-1.5 py-0.5 text-[11px] bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className="text-sm font-bold text-orange-400 font-mono">
                    {formatCurrency(lineTotal)}
                  </span>

                  {/* Quantity controls */}
                  <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateQty(product.id, -1)}
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold font-mono px-1.5 text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQty(product.id, 1)}
                      disabled={quantity >= product.currentStock}
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 transition-colors ml-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Subtotal</span>
          <span className="font-mono font-semibold text-zinc-200">{formatCurrency(subTotal)}</span>
        </div>

        {/* Global Order Discount */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center space-x-1">
            <Percent className="w-3 h-3 text-orange-400" />
            <span>Order Discount ($)</span>
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={orderDiscount || ''}
            onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
            placeholder="0.00"
            className="w-20 px-2 py-1 text-xs text-right bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Tax Rate Selector */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Tax Rate</span>
          <select
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none"
          >
            <option value={0}>0% Tax</option>
            <option value={5}>5% Tax</option>
            <option value={8}>8% Sales Tax</option>
            <option value={10}>10% VAT</option>
          </select>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">Total Payable</span>
            <p className="text-2xl font-black text-white font-mono tracking-tight">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <button
            disabled={items.length === 0}
            onClick={handleOpenPayment}
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center space-x-2 transition-all active:scale-[0.98]"
          >
            <span>Pay Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal 1: Payment Checkout Dialog */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Checkout"
        subtitle={`Total Amount Due: ${formatCurrency(totalAmount)}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
                { id: PaymentMethod.CARD, label: 'Card', icon: CreditCard },
                { id: PaymentMethod.MOBILE_MONEY, label: 'Mobile', icon: Smartphone },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      'p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 font-semibold text-xs transition-all',
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-xs'
                        : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Paid Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Amount Paid ($)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountPaidInput}
                onChange={(e) => setAmountPaidInput(e.target.value)}
                className="w-full pl-9 pr-4 py-3 text-lg font-mono font-bold bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 text-white"
              />
            </div>
          </div>

          {/* Quick Cash Suggestions */}
          {paymentMethod === PaymentMethod.CASH && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 font-medium">Quick Cash:</span>
              {[totalAmount, 20, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountPaidInput(val.toFixed(2))}
                  className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  ${val.toFixed(0)}
                </button>
              ))}
            </div>
          )}

          {/* Live Change Indicator */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Change Due
            </span>
            <span className={cn(
              'text-xl font-bold font-mono',
              changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {formatCurrency(changeAmount)}
            </span>
          </div>

          {/* Notes Optional */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Order Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP Customer discount or promo tag"
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none text-zinc-200"
            />
          </div>

          {/* Confirm Button */}
          <button
            disabled={isSubmitting || amountPaidNumber < totalAmount}
            onClick={handleConfirmPayment}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Processing Sale...' : 'Confirm & Generate Receipt'}</span>
          </button>
        </div>
      </Modal>

      {/* Modal 2: Create Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Add New Customer"
        subtitle="Quickly register customer profile for transaction tracking"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Robert Vance"
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="+1 555-0199"
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm shadow-lg shadow-orange-500/20 transition-colors"
          >
            Save Customer
          </button>
        </form>
      </Modal>
    </div>
  );
};
