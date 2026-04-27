import React from 'react';
import { Settings, QrCode as QrCodeIcon, Plus, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Table, MenuItem } from '../types';
import { RESTAURANT_ID } from '../constants';
import { socket } from '../socket';

interface AdminBoardProps {
  tables: Table[];
  menuItems: MenuItem[];
  baseUrl: string;
  showToast: (message: string) => void;
}

export const AdminBoard: React.FC<AdminBoardProps> = ({ tables, menuItems, baseUrl, showToast }) => {
  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto w-full">
      {/* Menu Management */}
      <div className="space-y-8">
        <h2 className="text-3xl font-black flex items-center gap-4 tracking-tight">
          <Settings className="w-10 h-10 text-brand-muted" /> Menu Admin
        </h2>
        <div className="bg-white p-8 rounded-[40px] border-2 border-brand-border shadow-sm space-y-8">
          <div className="grid grid-cols-2 gap-4 pb-8 border-b-2 border-brand-border">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 block">Item Name</label>
              <input type="text" placeholder="e.g. Satay Chicken" className="w-full bg-brand-bg border-2 border-brand-border rounded-2xl px-5 py-4 font-bold focus:border-brand-orange outline-none transition-all" id="newItemName" />
            </div>
            <div>
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 block">Price ($)</label>
              <input type="number" placeholder="0.00" className="w-full bg-brand-bg border-2 border-brand-border rounded-2xl px-5 py-4 font-bold focus:border-brand-orange outline-none transition-all" id="newItemPrice" />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  const nameInput = document.getElementById('newItemName') as HTMLInputElement;
                  const priceInput = document.getElementById('newItemPrice') as HTMLInputElement;
                  const name = nameInput.value;
                  const price = parseFloat(priceInput.value);
                  if (!name || isNaN(price)) return;
                  socket.emit("add_menu", {
                    name,
                    price,
                    category: 'Main',
                    description: 'House special recipe. Perfectly prepared.',
                    isAvailable: true
                  });
                  nameInput.value = '';
                  priceInput.value = '';
                }}
                className="w-full bg-brand-teal text-white py-4 rounded-2xl font-black shadow-[0_4px_0_0_#229489] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6" /> ADD
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {menuItems.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-brand-bg/30 border-2 border-brand-border/50 group hover:border-brand-orange transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-border overflow-hidden">
                    <img src={m.image || `https://picsum.photos/seed/${m.id}/100/100`} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="font-black text-brand-text">{m.name}</p>
                    <p className="text-xs font-bold text-brand-orange">${m.price.toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (confirm(`Delete ${m.name}?`)) {
                      socket.emit("delete_menu", m.id);
                    }
                  }}
                  className="p-3 text-brand-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Management */}
      <div className="space-y-8">
        <h2 className="text-3xl font-black flex items-center gap-4 tracking-tight">
          <QrCodeIcon className="w-10 h-10 text-brand-muted" /> Floor Setup
        </h2>
        <div className="bg-white p-8 rounded-[40px] border-2 border-brand-border shadow-sm">
          <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-900">New to the app?</p>
              <p className="text-xs text-blue-700">Click this to instantly set up demo tables and food items.</p>
            </div>
            <button 
              onClick={() => {
                if (!confirm("This will create sample tables and menu items. Continue?")) return;
                socket.emit("init_demo");
                alert("Demo system initialized! Real-time updates have been broadcast.");
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm"
            >
              Initialize Demo System
            </button>
          </div>

          <div className="flex items-center gap-4 mb-10 pb-10 border-b-2 border-brand-border">
            <div className="flex-1">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 block">Table Identifer</label>
              <input type="text" placeholder="Table # (e.g. 05)" className="w-full bg-brand-bg border-2 border-brand-border rounded-2xl px-5 py-4 font-bold focus:border-brand-orange outline-none transition-all" id="newTableNum" />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  const numInput = document.getElementById('newTableNum') as HTMLInputElement;
                  const num = numInput.value;
                  if (!num) return;
                  
                  socket.emit("add_table", { tableNumber: num });
                  numInput.value = '';
                }}
                className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black shadow-[0_4px_0_0_#D85A2B] active:translate-y-[2px] active:shadow-none transition-all"
              >
                ADD TABLE
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {tables.map(t => (
              <div key={t.id} className="p-6 border-2 border-brand-border rounded-[32px] flex flex-col items-center bg-white group hover:border-brand-orange transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                <div className="bg-brand-bg p-4 rounded-3xl border-2 border-brand-border mb-4 group-hover:shadow-2xl transition-all relative">
                   <QRCodeSVG 
                    value={`${baseUrl.replace(/\/$/, '')}/?tableId=${t.id}`} 
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${baseUrl.replace(/\/$/, '')}/?tableId=${t.id}`);
                      showToast(`Copied URL for Table ${t.tableNumber}`);
                    }}
                    className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full border-2 border-brand-border shadow-md hover:text-brand-orange transition-colors"
                    title="Copy Link"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
                <p className="font-black text-2xl text-brand-text mb-1 tracking-tight">TABLE {t.tableNumber}</p>
                <p className="text-[10px] font-bold text-brand-muted mb-4 uppercase tracking-[0.2em]">ID: {t.id.slice(0, 8).toUpperCase()}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (confirm(`Remove Table ${t.tableNumber} and its QR?`)) {
                         socket.emit("delete_table", t.id);
                      }
                    }}
                    className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                     <Trash2 className="w-3 h-3" /> REMOVE
                  </button>
                  <a 
                    href={`${baseUrl.replace(/\/$/, '')}/?tableId=${t.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-brand-teal font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <QrCodeIcon className="w-3 h-3" /> OPEN VIEW
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

