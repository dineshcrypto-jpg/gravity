"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, MapPin, User, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Order } from "@/types/database";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setOrdersLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      setOrdersLoading(false);
    }

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 md:p-16 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-500 mb-8">You need to be logged in to view your account and order history.</p>
          <Link 
            href="/" 
            className="w-full flex items-center justify-center px-6 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Profile Card */}
          <div className="md:w-1/3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-brand-600 h-24" />
              <div className="px-6 pb-8 -mt-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100 mb-4 shadow-md">
                    {user.user_metadata.avatar_url ? (
                      <Image 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        width={96} 
                        height={96} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-full h-full p-4 text-gray-400" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user.user_metadata.full_name || "Valued Customer"}</h2>
                  <p className="text-sm text-gray-500 mb-6">{user.email}</p>
                  
                  <button 
                    onClick={() => signOut()}
                    className="w-full py-3 px-4 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-2/3 space-y-8">
            {/* Orders Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-600" />
                  Order History
                </h3>
                <span className="text-sm font-medium text-gray-400">{orders.length} orders</span>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
                  <Link href="/categories" className="text-brand-600 font-bold hover:underline">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 rounded-2xl border border-gray-100 hover:border-brand-200 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-600">₹{order.total.toLocaleString("en-IN")}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                            {order.status || 'Delivered'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Address Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-brand-600" />
                Saved Address
              </h3>
              
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 leading-relaxed italic">
                  Address details will be saved automatically when you place your next order!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
