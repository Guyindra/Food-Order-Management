import React from 'react';
import { ChefHat } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Order, OrderStatus } from '../types';

interface KitchenBoardProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const KitchenBoard: React.FC<KitchenBoardProps> = ({ orders, updateOrderStatus }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl font-black mb-10 flex items-center gap-4 tracking-tight">
        <ChefHat className="w-10 h-10 text-brand-orange" /> Kitchen Board
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {orders.filter(o => [OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.READY].includes(o.status)).map(order => (
          <div key={order.id} className={`bg-white rounded-[32px] border-2 p-6 shadow-sm transition-all ${order.status === OrderStatus.READY ? 'border-brand-teal' : 'border-brand-border'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Table</span>
                <span className="text-4xl font-black text-brand-text leading-none">{order.tableNumber}</span>
              </div>
              <Badge color={order.status === OrderStatus.PENDING ? 'red' : order.status === OrderStatus.READY ? 'green' : 'orange'}>
                {order.status}
              </Badge>
            </div>
            <div className="space-y-4 mb-8">
              {order.items.map(i => (
                <div key={i.id} className="flex flex-col gap-1">
                  <div className="flex gap-4 items-center">
                    <span className="w-8 h-8 flex items-center justify-center bg-brand-bg rounded-lg font-black text-sm border-2 border-brand-border text-brand-orange shrink-0">{i.quantity}</span>
                    <span className="font-bold text-brand-text tracking-tight leading-tight">{i.name}</span>
                  </div>
                  {i.notes && (
                    <div className="pl-12">
                      <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 font-bold px-2 py-0.5 rounded shadow-sm inline-block">
                        {i.notes}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {order.status === OrderStatus.PENDING && (
                <button 
                  onClick={() => updateOrderStatus(order.id, OrderStatus.COOKING)}
                  className="flex-1 bg-brand-orange text-white py-4 rounded-2xl font-black hover:bg-brand-orange/90 shadow-[0_4px_0_0_#D85A2B] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Cook Now
                </button>
              )}
              {order.status === OrderStatus.COOKING && (
                <button 
                  onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                  className="flex-1 bg-brand-teal text-white py-4 rounded-2xl font-black hover:bg-brand-teal/90 shadow-[0_4px_0_0_#229489] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Set Ready
                </button>
              )}
              {order.status === OrderStatus.READY && (
                <button 
                  onClick={() => updateOrderStatus(order.id, OrderStatus.SERVED)}
                  className="flex-1 bg-brand-yellow text-white py-4 rounded-2xl font-black hover:opacity-90 shadow-[0_4px_0_0_#CC9809] active:translate-y-[2px] active:shadow-none transition-all uppercase text-sm"
                >
                   Mark Served
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
