"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ShoppingBag, Phone, MapPin, Calendar, CheckCircle, Clock } from "lucide-react";
import { Order, OrderItem } from "@/types/database";

const ADMIN_PASSCODE = "7010364635";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const saved = sessionStorage.getItem("admin_auth");
      if (saved === "true") {
        setIsAuthorized(true);
        await fetchOrders();
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_auth", "true");
      fetchOrders();
    } else {
      setError("Incorrect Passcode. Access Denied.");
    }
  };

  async function fetchOrders() {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
    }
    setIsLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-8 uppercase tracking-[0.2em]">Admin Dashboard</h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input 
                type="password"
                placeholder="ENTER THE PASSWORD"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-center text-lg font-bold tracking-widest transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wider">{error}</p>}
            <button className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all uppercase tracking-widest text-sm">
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Order Dashboard
            </h1>
            <p className="text-gray-500 mt-2">Manage and track your customer orders here.</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Refresh List
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
                <p className="text-gray-500">When customers order, they will show up here.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    selectedOrder?.id === order.id ? "border-brand-500 shadow-lg" : "border-transparent shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{order.customer_name}</h3>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                      order.status === 'Delivered' ? "bg-green-100 text-green-700" : 
                      order.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {order.customer_phone}
                    </div>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      ₹{order.total.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <ShoppingBag className="w-4 h-4" />
                      {order.items.length} items
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Details Panel */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                <div className="bg-brand-600 p-6 text-white">
                  <h2 className="text-xl font-bold">Order Details</h2>
                  <p className="text-brand-100 text-sm mt-1">Status: {selectedOrder.status}</p>
                </div>
                
                <div className="p-6">
                  {/* Customer Info */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-brand-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                          <p className="text-gray-500">{selectedOrder.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-brand-600 mt-0.5" />
                        <div>
                          <p className="text-gray-700">{selectedOrder.customer_address}</p>
                          {selectedOrder.customer_landmark && (
                            <p className="text-brand-600 font-medium text-sm mt-1 italic">
                              Landmark: {selectedOrder.customer_landmark}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Info */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Items</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {selectedOrder.items.map((item: OrderItem, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.variety_label} x {item.quantity}</p>
                          </div>
                          <span className="font-bold text-gray-900 ml-4">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-extrabold text-brand-600">₹{selectedOrder.total.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => updateStatus(selectedOrder.id, 'Delivered')}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark as Delivered
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedOrder.id, 'Processing')}
                        className="w-full py-4 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Clock className="w-5 h-5" />
                        Set to Processing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center sticky top-24">
                <p className="text-gray-400 font-medium">Select an order to view full details and manage status.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
