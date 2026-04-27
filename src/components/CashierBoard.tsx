import React, { useState } from 'react';
import { CreditCard, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './ui/Badge';
import { Order, OrderStatus } from '../types';

interface CashierBoardProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  showToast: (message: string) => void;
}

export const CashierBoard: React.FC<CashierBoardProps> = ({ orders, updateOrderStatus, showToast }) => {
  const [selectedCheckoutOrder, setSelectedCheckoutOrder] = useState<Order | null>(null);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full relative">
      <h2 className="text-3xl font-black mb-10 flex items-center gap-4 tracking-tight">
        <CreditCard className="w-10 h-10 text-brand-orange" /> Cashier Desk
      </h2>
      <div className="bg-white rounded-[40px] shadow-sm border-2 border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-bg/50 border-b-2 border-brand-border">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Table</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Order Summary</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">Live Total</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-brand-muted tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-brand-border/30">
              {orders.map(order => {
                const isPaid = order.status === OrderStatus.PAID;
                return (
                <tr key={order.id} className={`transition-colors cursor-pointer group ${isPaid ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-brand-bg/20'}`} onClick={() => setSelectedCheckoutOrder(order)}>
                  <td className="px-8 py-6">
                     <span className={`text-2xl font-black group-hover:underline ${isPaid ? 'text-green-600' : 'text-brand-teal'}`}>0{order.tableNumber}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-[10px] font-bold max-w-xs leading-relaxed truncate ${isPaid ? 'text-green-700' : 'text-brand-muted'}`}>
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge color={isPaid ? 'green' : (order.status === OrderStatus.SERVED ? 'green' : 'orange')}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className={`px-8 py-6 font-black text-xl ${isPaid ? 'text-green-800' : 'text-brand-text'}`}>${order.total.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right">
                    {isPaid ? (
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-[0_4px_0_0_#16a34a] inline-flex items-center gap-2 cursor-default"
                      >
                        <Check className="w-5 h-5" /> PAID
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, OrderStatus.PAID);
                          showToast(`Table ${order.tableNumber} Paid!`);
                        }}
                        className="bg-brand-orange text-white px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 shadow-[0_4px_0_0_#D85A2B] active:translate-y-[2px] active:shadow-none transition-all inline-flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" /> CHK OUT
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Checkout Modal */}
      <AnimatePresence>
        {selectedCheckoutOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border-4 border-brand-orange"
            >
              <div className="p-8 border-b-2 border-brand-bg flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Detail View</span>
                  <h3 className="text-4xl font-black text-brand-text">Table {selectedCheckoutOrder.tableNumber}</h3>
                </div>
                <button onClick={() => setSelectedCheckoutOrder(null)} className="p-3 bg-brand-bg rounded-2xl hover:text-brand-orange transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                <div className="space-y-4">
                  {selectedCheckoutOrder.items.map(item => (
                    <div key={item.id} className="flex flex-col border-b border-brand-bg pb-4 group">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center font-black text-sm text-brand-orange">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-brand-text">{item.name}</span>
                        </div>
                        <span className="font-black text-brand-muted">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.notes && (
                        <div className="pl-12">
                          <span className="text-[10px] bg-brand-orange/10 text-brand-orange font-bold px-2 py-0.5 rounded">
                            Note: {item.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-brand-bg/50 border-t-2 border-brand-border">
                <div className="flex justify-between items-end mb-8">
                  <span className="font-black text-brand-muted uppercase tracking-widest">Total Amount</span>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-brand-muted mb-1 italic">incl. tax & service</span>
                    <span className="text-4xl font-black text-brand-orange">${selectedCheckoutOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                {selectedCheckoutOrder.status === OrderStatus.PAID ? (
                  <button className="w-full bg-green-500 text-white px-8 py-5 rounded-3xl font-black text-lg cursor-default shadow-[0_6px_0_0_#16a34a] flex justify-center items-center gap-2">
                    <Check className="w-6 h-6" /> ALREADY PAID
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      updateOrderStatus(selectedCheckoutOrder.id, OrderStatus.PAID);
                      showToast(`Table ${selectedCheckoutOrder.tableNumber} Paid!`);
                      setSelectedCheckoutOrder(null);
                    }}
                    className="w-full vibrant-button-primary"
                  >
                    CONFIRM PAYMENT
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
