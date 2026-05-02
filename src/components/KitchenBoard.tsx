import React, { useMemo } from 'react';
import { 
  ChefHat, Timer, Clock, CheckCircle2, Play, Package, Megaphone, 
  Coffee, Croissant, Cake, IceCream, Soup, UtensilsCrossed 
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface KitchenBoardProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const KitchenBoard: React.FC<KitchenBoardProps> = ({ orders, updateOrderStatus }) => {
  const activeOrders = useMemo(() => 
    orders.filter(o => [OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.READY].includes(o.status)),
  [orders]);
  
  const loadPercentage = Math.min(Math.round((activeOrders.length / 20) * 100), 100);

  const getOrderIcon = (order: Order) => {
    // Simple heuristic to get an icon based on items
    const names = order.items.map(i => i.name.toLowerCase());
    if (names.some(n => n.includes('coffee') || n.includes('latte') || n.includes('tea'))) return { icon: Coffee, bg: 'bg-kitchen-secondary-container', text: 'text-kitchen-secondary' };
    if (names.some(n => n.includes('cake') || n.includes('toast'))) return { icon: Cake, bg: 'bg-kitchen-primary-fixed', text: 'text-kitchen-primary' };
    if (names.some(n => n.includes('ice'))) return { icon: IceCream, bg: 'bg-kitchen-tertiary-fixed', text: 'text-kitchen-tertiary' };
    if (names.some(n => n.includes('soup') || n.includes('salad'))) return { icon: Soup, bg: 'bg-kitchen-secondary-container', text: 'text-kitchen-secondary' };
    return { icon: Croissant, bg: 'bg-kitchen-primary-fixed', text: 'text-kitchen-primary' };
  };

  return (
    <div className="font-body bg-kitchen-bg text-kitchen-on-surface min-h-full px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Column: Order Kanban Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-2xl font-semibold text-kitchen-on-surface">Active Orders</h3>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-full bg-kitchen-surface-container-highest text-kitchen-on-surface text-xs font-semibold hover:bg-kitchen-surface-dim transition-colors">Sort: Priority</button>
              <button className="px-4 py-1.5 rounded-full bg-kitchen-surface-container-highest text-kitchen-on-surface text-xs font-semibold hover:bg-kitchen-surface-dim transition-colors">Filter: All</button>
            </div>
          </div>

          {/* Kanban Columns Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {activeOrders.length === 0 && (
              <div className="col-span-full py-20 text-center text-kitchen-on-surface-variant font-headline text-xl">
                No active orders. Great job!
              </div>
            )}
            
            {activeOrders.map(order => {
              const isUrgent = order.status === OrderStatus.PENDING; // Mocking urgent for pending
              const CardBorder = isUrgent ? 'border-l-8 border-kitchen-primary' : 'border border-kitchen-primary-fixed';
              const HeaderBg = isUrgent ? 'bg-kitchen-error-container/20' : 'border-b border-kitchen-surface-variant/30';
              
              return (
                <article key={order.id} className={`bg-kitchen-surface-container-lowest rounded-[24px] shadow-[0_8px_30px_rgba(227,139,117,0.06)] overflow-hidden hover:shadow-[0_12px_40px_rgba(227,139,117,0.1)] transition-shadow duration-300 flex flex-col h-full ${CardBorder}`}>
                  <div className={`p-5 flex justify-between items-center ${HeaderBg}`}>
                    <div>
                      <span className="font-headline text-xl font-semibold text-kitchen-on-surface">#{order.id.slice(-4)}</span>
                      <span className="text-sm font-medium text-kitchen-on-surface-variant ml-2">
                         {order.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${order.tableNumber}`}
                      </span>
                      {order.customerName && (
                        <div className="text-xs font-bold text-kitchen-on-surface-variant mt-1">
                          {order.customerName}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isUrgent ? 'text-kitchen-error bg-kitchen-error-container' : 'text-kitchen-on-surface-variant bg-kitchen-surface-container'}`}>
                      {isUrgent ? <Timer className="w-3.5 h-3.5 fill-current" /> : <Clock className="w-3.5 h-3.5" />}
                      <span className="text-xs font-semibold">{order.status}</span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow">
                    <ul className="space-y-4">
                      {order.items.map(item => {
                        const style = getOrderIcon({ ...order, items: [item] } as Order);
                        const Icon = style.icon;
                        
                        return (
                          <li key={item.id} className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                              <Icon className={`w-5 h-5 ${style.text}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-kitchen-on-surface">{item.quantity}x {item.name}</p>
                              {item.notes && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-full bg-kitchen-surface-container-highest text-kitchen-on-surface-variant font-semibold text-[10px]">
                                    {item.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  
                  <div className="p-5 pt-0 mt-auto flex gap-2">
                    {order.status === OrderStatus.PENDING && (
                      <button 
                         onClick={() => updateOrderStatus(order.id, OrderStatus.COOKING)}
                         className="w-full py-3 border-2 border-kitchen-primary-container text-kitchen-on-surface rounded-xl text-sm font-semibold hover:bg-kitchen-primary-fixed/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                         <Play className="w-4 h-4" /> Start Prep
                      </button>
                    )}
                    {order.status === OrderStatus.COOKING && (
                      <button 
                         onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                         className="w-full py-3 bg-kitchen-primary text-kitchen-on-primary rounded-xl text-sm font-semibold hover:bg-kitchen-surface-tint active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current text-white" /> Mark Ready
                      </button>
                    )}
                    {order.status === OrderStatus.READY && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, OrderStatus.SERVED)}
                        className="w-full py-3 bg-kitchen-secondary text-kitchen-on-primary rounded-xl text-sm font-semibold hover:bg-kitchen-secondary-container hover:text-kitchen-on-secondary-container active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right Column: Status Panel */}
        <div className="w-full xl:w-80 flex-shrink-0 space-y-6">
          <div className="bg-kitchen-surface-container-lowest rounded-[32px] p-6 shadow-[0_10px_40px_rgba(227,139,117,0.06)] border border-kitchen-surface-variant/40">
            <h3 className="font-headline text-xl font-semibold text-kitchen-on-surface mb-6 flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-kitchen-primary" />
              Kitchen Status
            </h3>
            
            <div className="space-y-6">
              {/* Load Metric */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-kitchen-on-surface-variant">Current Load</span>
                  <span className="font-headline text-3xl font-bold text-kitchen-primary">{loadPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-kitchen-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-kitchen-primary-container rounded-full transition-all duration-500" style={{ width: `${loadPercentage}%` }}></div>
                </div>
                <p className="text-sm text-kitchen-on-surface-variant mt-2">{activeOrders.length} items in queue.</p>
              </div>

              {/* Staff on Duty */}
              <div className="pt-4 border-t border-kitchen-surface-variant/30">
                <h4 className="text-sm font-semibold text-kitchen-on-surface mb-3">Staff on Duty</h4>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <img 
                      alt="Staff 1" 
                      className="w-10 h-10 rounded-full border-2 border-kitchen-surface-container-lowest object-cover relative z-30" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxxTMxx9C85tjgTd6iC2mE5gdur3lw4h9xDdk7eh38d2eAlEWmvTI_Xn0MHreacq1HGDjw1LndArk8n0eWVsXtM-XES_a0MtqbiXH0c9qPvzJbUe2jOEPEZ3ddXWNs-jx29Gfaw8lkO1g8q72OSlKF6OQQIbhAX_XhWC24-zJuIy8eL4Z9eJI0OFWdXn847w1Lwqv9ZHeNzcL0BoiKZVs_FDFjeKY0PHhLPs3Gd0KGzRQ7L2v1GRWT3Mbl4tC9BZ03ae29pIKlPFw" 
                    />
                    <img 
                      alt="Staff 2" 
                      className="w-10 h-10 rounded-full border-2 border-kitchen-surface-container-lowest object-cover relative z-20" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHT-qun-PWpihivzxOcGeTBU_zphvfeixK_v8vgDfP_KmYMiBvFq7wXH4RfU3n4kCjT5JUnRMDl6lhm_Tqt99NuEHK2yb5YZSJuVoZIF3tGypP8Nnz6_qYQviMqcuzGQav2_efh2fgnvMZmqWgVfr8B9KD5L843-VugMDeA0zgAluy7XcM7lyy-JAab_Zd-1O5UZRrguYblYzeNw2iyyDX2rFv2WyDhIOGx6TmRo4syPMM3XUi_QR4bHEzolzxFYhGIR9FB3WD4c0" 
                    />
                    <div className="w-10 h-10 rounded-full border-2 border-kitchen-surface-container-lowest bg-kitchen-primary-fixed flex items-center justify-center relative z-10 text-kitchen-primary text-xs font-semibold">
                      +1
                    </div>
                  </div>
                  <span className="text-sm text-kitchen-on-surface-variant">3 Active</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-kitchen-surface-variant/30 flex gap-2">
                <button className="flex-1 py-2 bg-kitchen-surface-container text-kitchen-on-surface-variant rounded-lg text-xs font-semibold hover:bg-kitchen-surface-variant transition-colors flex flex-col items-center gap-1">
                  <Package className="w-4 h-4" /> Stock
                </button>
                <button className="flex-1 py-2 bg-kitchen-surface-container text-kitchen-on-surface-variant rounded-lg text-xs font-semibold hover:bg-kitchen-surface-variant transition-colors flex flex-col items-center gap-1">
                  <Megaphone className="w-4 h-4" /> 86 List
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
