"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, MapPin, User, Loader2, Calendar, 
  Clock, Package, Phone, ChevronDown, ChevronUp, CheckCircle2 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Order, OrderItem } from "@/types/database";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setOrdersLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
        } else if (data) {
          setOrders(data);
          // Expand the most recent order by default
          if (data.length > 0) {
            setExpandedOrders({ [data[0].id]: true });
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const datePart = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      const timePart = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      return { datePart, timePart };
    } catch {
      return { datePart: dateString, timePart: "" };
    }
  };

  const parseOrderItems = (rawItems: any): OrderItem[] => {
    if (!rawItems) return [];
    if (Array.isArray(rawItems)) return rawItems;
    if (typeof rawItems === "string") {
      try {
        return JSON.parse(rawItems);
      } catch {
        return [];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#008080]" />
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
          <p className="text-gray-500 mb-8">
            You need to be logged in to view your account and order history.
          </p>
          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-4 bg-[#008080] text-white rounded-xl font-bold hover:bg-[#006666] transition-colors"
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
            <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-[#008080] to-[#98c01d] h-24" />
              <div className="px-6 pb-8 -mt-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100 mb-4 shadow-md relative">
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-4 text-gray-400" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.user_metadata?.full_name || "Valued Customer"}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">{user.email}</p>

                  <button
                    onClick={() => signOut()}
                    className="w-full py-3 px-4 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors cursor-pointer"
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
            <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#008080]" />
                    Order History & Details
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Complete records of your past purchases and items
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                </span>
              </div>

              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#008080]" />
                  <p className="text-sm text-gray-400">Loading order details...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-4">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex px-6 py-2.5 bg-[#008080] text-white text-sm font-bold rounded-xl hover:bg-[#006666] transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const isExpanded = !!expandedOrders[order.id];
                    const { datePart, timePart } = formatDateTime(order.created_at);
                    const items = parseOrderItems(order.items);

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-xs hover:border-[#008080]/40 transition-colors"
                      >
                        {/* Order Header Summary */}
                        <div
                          onClick={() => toggleOrderDetails(order.id)}
                          className="p-5 bg-gray-50/70 hover:bg-gray-100/50 cursor-pointer transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#008080] shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-gray-900 tracking-tight">
                                  Order #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {order.status || "Placed"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {datePart}
                                </span>
                                {timePart && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {timePart}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-gray-500 block">Total Amount</span>
                              <span className="text-base font-black text-gray-900">
                                ₹{order.total.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="p-1 text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Details Body */}
                        {isExpanded && (
                          <div className="p-5 border-t border-gray-100 space-y-6 animate-in fade-in duration-200">
                            {/* What They Ordered */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#008080]" />
                                Items Ordered ({items.length})
                              </h4>
                              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                {items.length > 0 ? (
                                  items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3.5 bg-white flex items-center justify-between gap-4 text-sm"
                                    >
                                      <div>
                                        <p className="font-bold text-gray-900">
                                          {item.product_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                          {item.variety_label && (
                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                                              {item.variety_label}
                                            </span>
                                          )}
                                          <span>Qty: {item.quantity}</span>
                                          <span>× ₹{item.price}</span>
                                        </div>
                                      </div>
                                      <span className="font-bold text-gray-900 shrink-0">
                                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="p-3 text-xs text-gray-400 italic">
                                    Item details not available for this record.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Delivery Information */}
                            {(order.customer_name || order.customer_address || order.customer_phone) && (
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs text-gray-600">
                                <h4 className="font-black uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#008080]" />
                                  Delivery Address & Contact
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 leading-relaxed">
                                  <div>
                                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                                    <p className="text-gray-600 mt-0.5">{order.customer_address}</p>
                                    {order.customer_landmark && (
                                      <p className="text-gray-500 italic mt-0.5">
                                        Landmark: {order.customer_landmark}
                                      </p>
                                    )}
                                  </div>
                                  {order.customer_phone && (
                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                                      <span>{order.customer_phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
