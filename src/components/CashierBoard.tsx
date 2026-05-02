import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Check, X, Receipt, Tag, SplitSquareHorizontal, 
  Search, Bell, HelpCircle, UtensilsCrossed, Package, 
  ShoppingBag, CheckCircle, Info, Plus, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, Table as TableModel, MenuItem } from '../types';

interface CashierBoardProps {
  orders: Order[];
  tables: TableModel[];
  menuItems?: MenuItem[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  showToast: (message: string) => void;
  onPlaceOrder?: (order: any) => Promise<void>;
}

export const CashierBoard: React.FC<CashierBoardProps> = ({ 
  orders, tables, menuItems = [], updateOrderStatus, showToast, onPlaceOrder
}) => {
  const [activeTab, setActiveTab] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [activeTakeawayTab, setActiveTakeawayTab] = useState<'active-orders' | 'new-order'>('active-orders');
  const [selectedCheckoutOrder, setSelectedCheckoutOrder] = useState<Order | null>(null);
  const [takeawayCustomerName, setTakeawayCustomerName] = useState('');
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');

  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);

  const categories = useMemo(() => {
    return ['All Items', ...Array.from(new Set(menuItems.map(m => m.category)))];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'All Items') return menuItems;
    return menuItems.filter(m => m.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const activeOrders = useMemo(() => 
    orders.filter(o => o.status !== OrderStatus.PAID),
  [orders]);

  const getTableOrder = (tableId: string) => {
    return activeOrders.find(o => o.tableId === tableId && o.status !== OrderStatus.PAID);
  };

  const takeawayOrders = useMemo(() => 
    activeOrders.filter(o => o.tableId === 'takeaway'),
  [activeOrders]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(p => p.item.id === itemId);
      if (existing) {
        const newQ = existing.quantity + delta;
        if (newQ <= 0) {
          return prev.filter(p => p.item.id !== itemId);
        }
        return prev.map(p => p.item.id === itemId ? { ...p, quantity: newQ } : p);
      }
      return prev;
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (onPlaceOrder) {
      await onPlaceOrder({
        tableId: 'takeaway',
        tableNumber: 'Takeaway',
        customerName: takeawayCustomerName || 'Walk-in',
        items: cart.map(c => ({
          id: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity
        })),
        status: OrderStatus.PENDING,
        total: cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0)
      });
      setCart([]);
      setTakeawayCustomerName('');
      setActiveTakeawayTab('active-orders');
    }
  };

  return (
    <div className="font-body bg-kitchen-bg text-kitchen-on-surface min-h-full px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Left Column */}
      <section className="flex-1 flex flex-col gap-6 h-[calc(100vh-140px)]">
        {/* Header & Tabs */}
        <div className="flex items-center bg-kitchen-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(227,139,117,0.03)] border border-kitchen-surface-container justify-between gap-4">
          <div className="flex bg-kitchen-surface-container rounded-xl p-1.5 w-fit mx-auto shadow-sm">
            <button 
              onClick={() => setActiveTab('dine-in')}
              className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'dine-in' 
                  ? 'bg-kitchen-surface shadow-sm text-kitchen-primary' 
                  : 'text-kitchen-on-surface-variant hover:bg-kitchen-surface-variant/50'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" /> Dine In
            </button>
            <button 
              onClick={() => setActiveTab('takeaway')}
              className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'takeaway' 
                  ? 'bg-kitchen-surface shadow-sm text-kitchen-primary' 
                  : 'text-kitchen-on-surface-variant hover:bg-kitchen-surface-variant/50'
              }`}
            >
              <ShoppingBag className="w-5 h-5" /> Order
            </button>
          </div>
        </div>

        {/* Dynamic Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8 custom-scrollbar">
          {activeTab === 'dine-in' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tables.map(table => {
                const order = getTableOrder(table.id);

                const getWaitTime = (order: Order) => {
                  if (!order?.createdAt) return '';
                  const timeMs = order.createdAt.toMillis ? order.createdAt.toMillis() : order.createdAt;
                  const diffMins = Math.floor((Date.now() - (timeMs as number)) / 60000);
                  return diffMins > 0 ? `${diffMins} mins` : 'Just now';
                };

                if (order) {
                  const isSelected = selectedCheckoutOrder?.id === order.id;
                  const isReady = order.status === OrderStatus.READY || order.status === OrderStatus.SERVED;
                  
                  if (isSelected) {
                    return (
                      <button 
                        key={table.id}
                        onClick={() => setSelectedCheckoutOrder(order)}
                        className="relative bg-[#FFDBCC] border-2 border-[#E38B75] rounded-[32px] p-4 flex flex-col items-center justify-center gap-3 aspect-[3/4] shadow-[0_8px_24px_rgba(227,139,117,0.15)] transform scale-[1.02] transition-all"
                      >
                        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#E38B75] animate-pulse"></div>
                        <UtensilsCrossed className="w-10 h-10 text-[#512712] mb-1" />
                        <div className="text-center">
                          <span className="font-headline text-2xl font-bold text-[#512712] block leading-none">
                            {table.tableNumber}
                          </span>
                          <span className="text-sm font-semibold text-[#86523A] mt-2 block uppercase tracking-wider">
                            {order.status === OrderStatus.PENDING ? 'Pending' : order.status}
                          </span>
                        </div>
                      </button>
                    );
                  } else {
                    return (
                      <button 
                        key={table.id}
                        onClick={() => setSelectedCheckoutOrder(order)}
                        className={`bg-white border-l-[6px] rounded-[32px] p-4 flex flex-col items-center justify-center gap-3 aspect-[3/4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(227,139,117,0.08)] hover:-translate-y-1 transition-all ${
                          isReady ? 'border-[#006783]' : 'border-[#FFAC98]'
                        }`}
                      >
                        <UtensilsCrossed className={`w-10 h-10 mb-1 ${isReady ? 'text-[#006783]' : 'text-[#86523A]'}`} />
                        <div className="text-center">
                          <span className="font-headline text-2xl font-bold text-[#512712] block leading-none">
                            {table.tableNumber}
                          </span>
                          <span className="text-sm font-semibold text-[#86523A] mt-2 block tracking-wider">
                            {order.status === OrderStatus.PENDING ? 'Pending' : getWaitTime(order)}
                          </span>
                        </div>
                      </button>
                    );
                  }
                } else {
                  return (
                    <button 
                      key={table.id}
                      className="bg-white border-2 border-[#FFE2D7] rounded-[32px] p-4 flex flex-col items-center justify-center gap-3 aspect-[3/4] hover:bg-[#FFF8F6] hover:shadow-sm transition-all opacity-80"
                    >
                      <UtensilsCrossed className="w-10 h-10 text-[#E5A386] mb-1" />
                      <div className="text-center">
                        <span className="font-headline text-2xl font-bold text-[#512712] block leading-none">
                          {table.tableNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#A66D53] mt-2 block tracking-wider">
                          Available
                        </span>
                      </div>
                    </button>
                  );
                }
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-kitchen-primary text-kitchen-on-primary' 
                        : 'bg-kitchen-surface-container-high text-kitchen-on-surface-variant hover:bg-kitchen-surface-variant'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              {/* Quick Selection Grid */}
              <div className="flex-1 overflow-y-auto pr-2 pb-8 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMenuItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-kitchen-surface-container-lowest p-4 rounded-2xl border border-kitchen-surface-container-highest shadow-sm hover:border-kitchen-primary-container hover:shadow-md transition-all flex flex-col gap-2 text-left group"
                    >
                      <div className="w-full aspect-square bg-kitchen-surface-container rounded-xl flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package className="w-12 h-12 text-kitchen-outline-variant group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-label-lg text-kitchen-on-surface font-semibold">{item.name}</h4>
                        <p className="font-label-md text-kitchen-primary font-bold">RM {item.price.toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Current Order Sidebar */}
      <aside className="w-full md:w-[420px] shrink-0 bg-kitchen-surface-container-lowest rounded-[32px] shadow-[0_20px_40px_rgba(227,139,117,0.08)] border border-kitchen-surface-container-highest flex flex-col overflow-hidden h-[calc(100vh-140px)]">
        {activeTab === 'takeaway' ? (
          <>
            <div className="p-6 bg-kitchen-surface-container-low border-b border-kitchen-surface-container-highest">
              <h3 className="font-headline text-2xl font-bold text-kitchen-on-surface mb-4">Current Order</h3>
              <input 
                type="text" 
                placeholder="Walk-in (Optional)" 
                value={takeawayCustomerName}
                onChange={e => setTakeawayCustomerName(e.target.value)}
                className="w-full bg-kitchen-surface-container-lowest border-2 border-kitchen-surface-container-highest rounded-xl px-4 py-3 font-semibold text-kitchen-on-surface focus:outline-none focus:border-kitchen-primary-container"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-kitchen-on-surface-variant">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
                  <p className="font-headline text-xl font-bold">Cart Empty</p>
                  <p className="text-sm mt-2">Add items from the menu.</p>
                </div>
              ) : (
                cart.map(c => (
                  <div key={c.item.id} className="flex flex-col gap-2 p-4 bg-kitchen-surface-container rounded-2xl border border-kitchen-surface-container-highest">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm text-kitchen-on-surface">{c.item.name}</h4>
                      <span className="font-semibold text-sm text-kitchen-on-surface">RM {(c.item.price * c.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <button onClick={() => updateCartQty(c.item.id, -1)} className="w-8 h-8 rounded-lg bg-kitchen-surface-container-highest text-kitchen-on-surface-variant hover:text-kitchen-primary hover:bg-kitchen-surface-container-lowest flex items-center justify-center transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center">{c.quantity}</span>
                      <button onClick={() => updateCartQty(c.item.id, 1)} className="w-8 h-8 rounded-lg bg-kitchen-surface-container-highest text-kitchen-on-surface-variant hover:text-kitchen-primary hover:bg-kitchen-surface-container-lowest flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-kitchen-surface-container-lowest border-t border-kitchen-surface-container-highest flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="font-headline text-xl font-bold text-kitchen-on-surface">Total</span>
                  <span className="font-headline text-3xl font-bold text-kitchen-primary">
                    RM {cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <button 
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                className="w-full mt-2 bg-kitchen-primary text-kitchen-on-primary rounded-2xl py-5 font-headline text-lg font-bold shadow-[0_8px_20px_rgba(146,74,55,0.25)] hover:bg-kitchen-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-3"
              >
                Place Order
              </button>
            </div>
          </>
        ) : !selectedCheckoutOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-kitchen-on-surface-variant">
            <Receipt className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-headline text-xl font-bold">No Order Selected</p>
            <p className="text-sm mt-2">Select a table or takeaway order to process payment.</p>
          </div>
        ) : (
          <>
            {/* Order Header */}
            <div className="p-6 bg-kitchen-surface-container-low border-b border-kitchen-surface-container-highest flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="w-6 h-6 text-kitchen-primary-container" />
                  <h3 className="font-headline text-2xl font-bold text-kitchen-on-surface leading-none">
                     {selectedCheckoutOrder.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${selectedCheckoutOrder.tableNumber}`}
                  </h3>
                </div>
                <p className="text-sm text-kitchen-on-surface-variant font-medium">
                  Order #{selectedCheckoutOrder.id.slice(-4)} {selectedCheckoutOrder.customerName ? `· ${selectedCheckoutOrder.customerName}` : ''}
                </p>
              </div>
              <div className="bg-kitchen-primary-fixed text-kitchen-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase">
                <Info className="w-4 h-4" />
                {selectedCheckoutOrder.status}
              </div>
            </div>

            {/* Line Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {selectedCheckoutOrder.items.map(item => (
                <div key={item.id} className="flex items-start justify-between group">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-kitchen-secondary-container flex items-center justify-center text-kitchen-on-secondary-container shrink-0">
                      <span className="font-semibold text-sm">{item.quantity}x</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-kitchen-on-surface">{item.name}</h4>
                      {item.notes && (
                         <p className="text-xs font-medium text-kitchen-on-surface-variant mt-0.5 max-w-[180px] break-words">
                           {item.notes}
                         </p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-kitchen-on-surface">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Order Totals & Actions */}
            <div className="p-6 bg-kitchen-surface-container-lowest border-t border-kitchen-surface-container-highest flex flex-col gap-4">
              {/* Calculation Breakdown */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-kitchen-on-surface-variant font-medium">
                  <span>Subtotal</span>
                  <span>RM {selectedCheckoutOrder.total.toFixed(2)}</span>
                </div>
                {/* Visual tax mockup for design fidelity */}
                <div className="flex justify-between text-sm text-kitchen-on-surface-variant font-medium">
                  <span>Tax (Included)</span>
                  <span>RM {(selectedCheckoutOrder.total * 0.1).toFixed(2)}</span>
                </div>
                <div className="h-[1px] w-full bg-kitchen-outline-variant/50 my-1"></div>
                <div className="flex justify-between items-end">
                  <span className="font-headline text-xl font-bold text-kitchen-on-surface">Total</span>
                  <span className="font-headline text-3xl font-bold text-kitchen-primary">RM {selectedCheckoutOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Split/Discount Actions */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button className="py-2.5 px-4 rounded-xl border border-kitchen-outline-variant text-kitchen-on-surface text-xs font-semibold hover:bg-kitchen-surface-container transition-colors flex justify-center items-center gap-2">
                  <SplitSquareHorizontal className="w-[18px] h-[18px]" />
                  Split Bill
                </button>
                <button className="py-2.5 px-4 rounded-xl border border-kitchen-outline-variant text-kitchen-on-surface text-xs font-semibold hover:bg-kitchen-surface-container transition-colors flex justify-center items-center gap-2">
                  <Tag className="w-[18px] h-[18px]" />
                  Discount
                </button>
              </div>

              {/* Primary CTA */}
              <button 
                onClick={() => {
                  updateOrderStatus(selectedCheckoutOrder.id, OrderStatus.PAID);
                  setReceiptModalOrder(selectedCheckoutOrder);
                  showToast(`${selectedCheckoutOrder.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${selectedCheckoutOrder.tableNumber}`} Paid!`);
                  setSelectedCheckoutOrder(null);
                }}
                className="w-full mt-2 bg-kitchen-primary text-kitchen-on-primary rounded-2xl py-5 font-headline text-lg font-bold shadow-[0_8px_20px_rgba(146,74,55,0.25)] hover:bg-kitchen-primary/90 hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
              >
                <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Proceed to Payment
              </button>
            </div>
          </>
        )}
      </aside>

      {/* E-Receipt Modal */}
      <AnimatePresence>
        {receiptModalOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fdfaf6] text-[#333] p-8 rounded-lg max-w-sm w-full font-mono shadow-2xl relative"
            >
              {/* Paper zig-zag effect top & bottom */}
              <div className="absolute top-[-4px] left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMicgaGVpZ2h0PScxMCc+PHBvbHlnb24gcG9pbnRzPScwLDEwIDYsMCAxMiwxMCcgZmlsbD0nI2ZkZmFmNicvPjwvc3ZnPg==')] repeat-x bg-[length:12px_10px]"></div>
              
              <div className="text-center mb-6 pt-2">
                <h2 className="text-2xl font-black mb-1">QUICKSERVE SMB</h2>
                <p className="text-xs text-gray-600">123 Baker Street, CA</p>
                <p className="text-xs text-gray-600">Tel: (555) 123-4567</p>
              </div>
              
              <div className="text-xs border-b-2 border-dashed border-gray-300 pb-4 mb-4 space-y-1">
                <div className="flex justify-between"><span>ORDER ID:</span> <span className="font-bold">{receiptModalOrder.id}</span></div>
                <div className="flex justify-between"><span>DATE:</span> <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>TABLE:</span> <span>{receiptModalOrder.tableNumber}</span></div>
                {receiptModalOrder.customerName && <div className="flex justify-between"><span>CUSTOMER:</span> <span>{receiptModalOrder.customerName}</span></div>}
              </div>
              
              <div className="mb-4 text-sm space-y-2">
                <div className="flex justify-between font-bold border-b border-gray-200 pb-1 mb-2">
                  <span>ITEM</span>
                  <span>AMT</span>
                </div>
                {receiptModalOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <span className="pr-4">{item.quantity}x {item.name}</span>
                    <span className="shrink-0 text-right">RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-sm border-t-2 border-dashed border-gray-300 pt-4 mb-8">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Subtotal</span>
                  <span>RM {receiptModalOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Tax (Included)</span>
                  <span>RM {(receiptModalOrder.total * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-xl mt-3 pt-2 border-t border-gray-300">
                  <span>TOTAL</span>
                  <span>RM {receiptModalOrder.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-center text-xs mb-8 font-medium space-y-1">
                <div className="flex justify-center mb-3">
                  <Receipt className="w-8 h-8 text-gray-300" />
                </div>
                <p>Thank you for your visit!</p>
                <p className="text-gray-500">Please come again</p>
              </div>
              
              <div className="flex gap-4">
                 <button onClick={() => window.print()} className="flex-1 border-2 border-gray-800 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider text-xs">Print</button>
                 <button onClick={() => setReceiptModalOrder(null)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors uppercase tracking-wider text-xs shadow-xl">Close</button>
              </div>

              <div className="absolute bottom-[-5px] left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMicgaGVpZ2h0PScxMCc+PHBvbHlnb24gcG9pbnRzPScwLDEwIDYsMCAxMiwxMCcgZmlsbD0nI2ZkZmFmNicvPjwvc3ZnPg==')] repeat-x bg-[length:12px_10px] rotate-180"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
