"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Loader2, ShoppingBag, Phone, MapPin, Calendar, CheckCircle, Clock, 
  Users, User, Award, Search, Sparkles, MessageCircle, 
  ArrowUpRight, RefreshCw, Eye, Bell, BellRing, Volume2, VolumeX, X
} from "lucide-react";
import { Order, OrderItem } from "@/types/database";

export interface CustomerRecord {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  address: string;
  landmark: string | null;
  orders: Order[];
  orderCount: number;
  totalSpend: number;
  firstOrderDate: string;
  lastOrderDate: string;
  isRegular: boolean;
  isVip: boolean;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<"orders" | "customers">("orders");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  
  // Search and Filter states
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<"all" | "regular" | "vip">("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  // ─── Realtime Presence & Live Visitor Tracking ──────────────────
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlinePages, setOnlinePages] = useState<Record<string, number>>({});

  // ─── Realtime Order Notifications ───────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean>(false);
  const [latestNewOrder, setLatestNewOrder] = useState<Order | null>(null);

  // Play crisp 2-tone order alert chime via Web Audio API (no external file needed)
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: High crisp ding (D5 - 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Harmonic higher bell (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.14);
      gain2.gain.setValueAtTime(0.45, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn("AudioContext playback prevented:", e);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationsAllowed(perm === "granted");
        playAlertChime();
        if (perm === "granted") {
          new Notification("🔔 KSN Super Store Notifications Active!", {
            body: "You and your dad will now receive instant popups when customers order.",
            icon: "/favicon.ico",
          });
        }
      } catch (err) {
        console.warn("Notification request error:", err);
      }
    } else {
      playAlertChime();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsAllowed(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authorized) {
          setIsAuthorized(true);
          await fetchOrders();
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ─── Realtime Subscriptions (Orders + Presence Listener) ────────
  useEffect(() => {
    if (!isAuthorized) return;

    // 1. Initialise and sync live visitors from PresenceTracker
    if (typeof window !== "undefined") {
      if (window.__KSN_ONLINE_COUNT__) {
        setOnlineCount(window.__KSN_ONLINE_COUNT__);
      }
      if (window.__KSN_ONLINE_PAGES__) {
        setOnlinePages(window.__KSN_ONLINE_PAGES__);
      }
    }

    const handlePresenceSync = (e: Event) => {
      const customEvt = e as CustomEvent<{ count: number; pages: Record<string, number> }>;
      if (customEvt.detail) {
        setOnlineCount(customEvt.detail.count || 1);
        if (customEvt.detail.pages) {
          setOnlinePages(customEvt.detail.pages);
        }
      }
    };

    window.addEventListener("ksn_presence_sync", handlePresenceSync);

    // 2. Realtime Orders Notification Channel (Unique channel instance to avoid collisions)
    const channelName = `admin-orders-realtime-${Date.now()}`;
    const ordersChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as Order;
          // Play loud chime!
          playAlertChime();
          // Pop-up banner
          setLatestNewOrder(newOrder);

          // Native browser push notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("🚨 NEW CUSTOMER ORDER RECEIVED!", {
                body: `${newOrder.customer_name} placed an order of ₹${Number(newOrder.total).toLocaleString("en-IN")}`,
                icon: "/favicon.ico",
              });
            } catch {}
          }

          // Automatically prepend to current orders list
          setOrders((prev) => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("ksn_presence_sync", handlePresenceSync);
      try {
        supabase.removeChannel(ordersChannel);
      } catch {}
    };
  }, [isAuthorized, soundEnabled]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthorized(true);
        fetchOrders();
      } else {
        setError(data.error || "Incorrect Passcode. Access Denied.");
      }
    } catch {
      setError("An error occurred during authentication.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_product_auth");
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_product_auth");
    setIsAuthorized(false);
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
      if (selectedCustomer) {
        setSelectedCustomer({
          ...selectedCustomer,
          orders: selectedCustomer.orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        });
      }
    }
  }

  // Group orders into Customer Records for finding regular buyers
  const customers = useMemo<CustomerRecord[]>(() => {
    const map = new Map<string, CustomerRecord>();

    orders.forEach((order) => {
      const digits = (order.customer_phone || "").replace(/\D/g, "");
      const key = digits.length >= 10 
        ? digits.slice(-10) 
        : (digits || order.user_id || order.customer_name?.trim().toLowerCase() || order.id);

      const existing = map.get(key);
      if (existing) {
        existing.orders.push(order);
        existing.totalSpend += Number(order.total) || 0;
        existing.orderCount += 1;
        if (order.customer_name) existing.name = order.customer_name;
        if (order.customer_address) existing.address = order.customer_address;
        if (order.customer_landmark) existing.landmark = order.customer_landmark;
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
        if (new Date(order.created_at) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.created_at;
        }
      } else {
        const customerId = digits.length >= 4 
          ? `CUST-${digits.slice(-6)}` 
          : (order.user_id ? `USER-${order.user_id.slice(0, 6).toUpperCase()}` : `CUST-${order.id.slice(0, 6).toUpperCase()}`);

        map.set(key, {
          id: customerId,
          userId: order.user_id,
          name: order.customer_name || "Guest Customer",
          phone: order.customer_phone || "",
          address: order.customer_address || "No address entered",
          landmark: order.customer_landmark || null,
          orders: [order],
          orderCount: 1,
          totalSpend: Number(order.total) || 0,
          firstOrderDate: order.created_at,
          lastOrderDate: order.created_at,
          isRegular: false,
          isVip: false,
        });
      }
    });

    const list = Array.from(map.values()).map(c => ({
      ...c,
      orders: c.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      isRegular: c.orderCount >= 2,
      isVip: c.orderCount >= 3 || c.totalSpend >= 2500,
    }));

    return list.sort((a, b) => b.orderCount - a.orderCount || b.totalSpend - a.totalSpend);
  }, [orders]);

  const customerOrderCountMap = useMemo(() => {
    const map = new Map<string, { count: number; customer: CustomerRecord }>();
    customers.forEach((c) => {
      const digits = (c.phone || "").replace(/\D/g, "");
      const key = digits.length >= 10 ? digits.slice(-10) : (digits || c.name.toLowerCase());
      map.set(key, { count: c.orderCount, customer: c });
    });
    return map;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch) ||
        c.id.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.address.toLowerCase().includes(customerSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (customerFilter === "regular") return c.isRegular;
      if (customerFilter === "vip") return c.isVip;
      return true;
    });
  }, [customers, customerSearch, customerFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer_phone.includes(orderSearch) ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase());

      if (!matchesSearch) return false;
      if (orderStatusFilter !== "all" && o.status.toLowerCase() !== orderStatusFilter.toLowerCase()) return false;
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const handleViewCustomerProfile = (order: Order) => {
    const digits = (order.customer_phone || "").replace(/\D/g, "");
    const key = digits.length >= 10 ? digits.slice(-10) : (digits || order.customer_name.toLowerCase());
    const info = customerOrderCountMap.get(key);
    if (info) {
      setSelectedCustomer(info.customer);
      setActiveTab("customers");
    }
  };

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
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-center text-lg font-bold tracking-widest text-gray-900 placeholder:text-gray-400 transition-all"
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

  const regularCustomersCount = customers.filter(c => c.isRegular).length;

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Floating Real-time Order Alert Banner */}
        {latestNewOrder && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0 shadow-sm animate-bounce">
                🔔
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-200">New Order Placed Just Now!</p>
                <p className="text-base font-extrabold">
                  {latestNewOrder.customer_name} — ₹{(Number(latestNewOrder.total) || 0).toLocaleString("en-IN")} ({latestNewOrder.items.length} items)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(latestNewOrder);
                  setActiveTab("orders");
                  setLatestNewOrder(null);
                }}
                className="px-4 py-2 bg-white text-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
              >
                View Order
              </button>
              <button
                type="button"
                onClick={() => setLatestNewOrder(null)}
                className="p-2 text-white/80 hover:text-white"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              Store Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Live customer orders, realtime visitors, and regular customers.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Notification & Sound Toggle */}
            <button
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) playAlertChime();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                soundEnabled 
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100" 
                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
              }`}
              title="Toggle audio ding alert for new orders"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              <span>{soundEnabled ? "Order Sound ON" : "Order Sound MUTED"}</span>
            </button>

            {/* Browser Push Notification Permission */}
            <button
              onClick={requestNotificationPermission}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                notificationsAllowed
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
              }`}
              title="Receive popup notifications on mobile/desktop"
            >
              <Bell className="w-4 h-4 text-[#008080]" />
              <span>{notificationsAllowed ? "Mobile Alerts Active" : "Enable Mobile Popups"}</span>
            </button>

            <Link
              href="/admin/products"
              className="px-5 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm text-xs"
            >
              🎛️ Products
            </Link>
            <button 
              onClick={fetchOrders}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors shadow-sm text-xs"
              title="Lock Admin Dashboard"
            >
              🔒 Logout
            </button>
          </div>
        </div>

        {/* ─── LIVE TRACKING & STATS ROW ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          {/* LIVE WEBSITE VISITORS CARD */}
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-800 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-100"></span>
                </span>
                Live Visitors
              </span>
              <Eye className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="text-3xl font-black">{onlineCount}</div>
            <span className="text-[11px] text-emerald-100 font-medium block mt-0.5">
              Browsing store right now
            </span>
            {Object.keys(onlinePages).length > 0 && (
              <div className="mt-2 text-[10px] text-emerald-200/90 truncate border-t border-emerald-500/30 pt-1.5">
                {Object.entries(onlinePages).map(([p, cnt]) => `${p === "/" ? "Home" : p}: ${cnt}`).join(" • ")}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">{orders.length}</div>
            <span className="text-[11px] text-gray-500 font-medium">All time orders</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Unique Customers</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">{customers.length}</div>
            <span className="text-[11px] text-gray-500 font-medium">Verified by phone number</span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Regular Customers</span>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-900">{regularCustomersCount}</div>
            <span className="text-[11px] text-amber-700 font-bold">Placed 2+ orders</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              ₹{orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-green-600 font-bold">Gross order value</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "orders"
                ? "bg-black text-white shadow-sm"
                : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders List ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "customers"
                ? "bg-[#008080] text-white shadow-sm"
                : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Details & Regulars ({customers.length})</span>
            {regularCustomersCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                activeTab === "customers" ? "bg-white text-[#008080]" : "bg-amber-100 text-amber-800"
              }`}>
                {regularCustomersCount} Regulars
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: ALL ORDERS VIEW                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div>
            {/* Orders Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search orders by customer name, phone, order ID..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const digits = (order.customer_phone || "").replace(/\D/g, "");
                    const key = digits.length >= 10 ? digits.slice(-10) : (digits || order.customer_name.toLowerCase());
                    const custInfo = customerOrderCountMap.get(key);
                    const isRegularCust = (custInfo?.count || 1) >= 2;

                    return (
                      <div 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
                          selectedOrder?.id === order.id ? "border-[#008080] shadow-lg" : "border-transparent shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              {custInfo && (
                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {custInfo.customer.id}
                                </span>
                              )}
                              {isRegularCust && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                                  👑 Regular Customer ({custInfo?.count} Orders)
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">{order.customer_name}</h3>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                            order.status === 'Delivered' ? "bg-green-100 text-green-700" : 
                            order.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {order.status}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {order.customer_phone}
                          </div>
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                            ₹{(Number(order.total) || 0).toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <ShoppingBag className="w-4 h-4" />
                            {order.items.length} items
                          </div>
                        </div>

                        {/* Customer Quick History Link */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500 truncate max-w-[280px] sm:max-w-md">
                            📍 {order.customer_address}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCustomerProfile(order);
                            }}
                            className="text-xs font-bold text-[#008080] hover:text-[#006666] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors"
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>View Customer Profile →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Order Details Panel */}
              <div className="lg:col-span-1">
                {selectedOrder ? (
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                    <div className="bg-[#008080] p-6 text-white">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Order Details</h2>
                        <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-md">
                          #{selectedOrder.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-teal-100 text-sm mt-1">Status: {selectedOrder.status}</p>
                    </div>
                    
                    <div className="p-6">
                      {/* Customer Info */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Details</h4>
                          <button
                            type="button"
                            onClick={() => handleViewCustomerProfile(selectedOrder)}
                            className="text-xs font-bold text-[#008080] hover:underline flex items-center gap-1"
                          >
                            <span>Customer ID Profile</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-[#008080] mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                              <a href={`tel:${selectedOrder.customer_phone}`} className="text-sm font-semibold text-teal-700 hover:underline">
                                {selectedOrder.customer_phone}
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[#008080] mt-0.5 shrink-0" />
                            <div>
                              <p className="text-gray-700 text-sm">{selectedOrder.customer_address}</p>
                              {selectedOrder.customer_landmark && (
                                <p className="text-teal-700 font-medium text-xs mt-1 italic">
                                  Landmark: {selectedOrder.customer_landmark}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items Info */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Items</h4>
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                          {selectedOrder.items.map((item: OrderItem, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                              <div className="flex-1 pr-2">
                                <p className="font-semibold text-gray-900 line-clamp-1">{item.product_name}</p>
                                <p className="text-xs text-gray-500">{item.variety_label} × {item.quantity}</p>
                              </div>
                              <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-base font-bold text-gray-900">Total Amount</span>
                          <span className="text-2xl font-extrabold text-[#008080]">₹{(Number(selectedOrder.total) || 0).toLocaleString("en-IN")}</span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <button 
                            onClick={() => updateStatus(selectedOrder.id, 'Delivered')}
                            className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Delivered
                          </button>
                          <button 
                            onClick={() => updateStatus(selectedOrder.id, 'Processing')}
                            className="w-full py-3.5 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
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
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: CUSTOMER DIRECTORY & REGULAR CUSTOMERS              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "customers" && (
          <div>
            {/* Customer Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, phone, customer ID or address..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#008080] outline-none"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCustomerFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    customerFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter("regular")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    customerFilter === "regular"
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  👑 Regulars ({regularCustomersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter("vip")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    customerFilter === "vip"
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                  }`}
                >
                  ⭐ VIPs ({customers.filter(c => c.isVip).length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Customer List Column */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {filteredCustomers.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No customers found</h3>
                    <p className="text-gray-500">Try clearing the search or filter.</p>
                  </div>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
                          isSelected ? "border-[#008080] shadow-lg ring-2 ring-[#008080]/10" : "border-transparent shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                {cust.id}
                              </span>
                              {cust.isVip ? (
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                  👑 VIP Customer
                                </span>
                              ) : cust.isRegular ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                  🔁 Regular Customer
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                                  🌱 New Customer
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-extrabold text-gray-900 mt-1.5">{cust.name}</h3>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">Total Spend</span>
                            <span className="text-lg font-black text-[#008080]">₹{cust.totalSpend.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm py-2 bg-gray-50/80 px-4 rounded-xl border border-gray-100 mb-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Phone</span>
                            <span className="font-bold text-gray-800">{cust.phone || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Orders Placed</span>
                            <span className="font-extrabold text-teal-700">{cust.orderCount} {cust.orderCount === 1 ? "Order" : "Orders"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">First Order</span>
                            <span className="font-medium text-gray-600">{new Date(cust.firstOrderDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Last Order</span>
                            <span className="font-medium text-gray-600">{new Date(cust.lastOrderDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="truncate max-w-[280px] sm:max-w-md">📍 {cust.address}</span>
                          <span className="text-[#008080] font-bold shrink-0">Click to view order history →</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Customer Detailed Profile Panel */}
              <div className="lg:col-span-1">
                {selectedCustomer ? (
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                    <div className="bg-gradient-to-r from-[#008080] to-teal-700 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-md font-bold">
                          {selectedCustomer.id}
                        </span>
                        {selectedCustomer.isRegular && (
                          <span className="bg-amber-400 text-gray-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                            👑 Regular Customer
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black mt-2">{selectedCustomer.name}</h2>
                      <p className="text-teal-100 text-xs mt-1">Customer Profile & Order History</p>
                    </div>

                    <div className="p-6">
                      
                      {/* Customer Details Box */}
                      <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400 uppercase">Phone</span>
                          <a 
                            href={`tel:${selectedCustomer.phone}`} 
                            className="text-sm font-bold text-teal-800 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {selectedCustomer.phone}
                          </a>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Delivery Address</span>
                          <p className="text-xs font-medium text-gray-800 leading-relaxed">{selectedCustomer.address}</p>
                          {selectedCustomer.landmark && (
                            <p className="text-xs font-semibold text-teal-700 mt-1 italic">
                              Landmark: {selectedCustomer.landmark}
                            </p>
                          )}
                        </div>

                        {/* Direct Action Links */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <a 
                            href={`tel:${selectedCustomer.phone}`}
                            className="py-2 px-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call Customer
                          </a>
                          <a 
                            href={`https://wa.me/91${(selectedCustomer.phone || "").replace(/\D/g, "").slice(-10)}?text=Hello%20${encodeURIComponent(selectedCustomer.name)}%2C%20greetings%20from%20KSN%20Super%20Store!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      </div>

                      {/* Lifetime Statistics */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-100 text-center">
                          <span className="text-[10px] font-bold text-teal-800 uppercase block">Total Orders</span>
                          <span className="text-xl font-black text-teal-950">{selectedCustomer.orderCount}</span>
                        </div>
                        <div className="bg-green-50/60 p-3 rounded-2xl border border-green-100 text-center">
                          <span className="text-[10px] font-bold text-green-800 uppercase block">Lifetime Spend</span>
                          <span className="text-xl font-black text-green-950">₹{selectedCustomer.totalSpend.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Order History for this customer */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Past Orders ({selectedCustomer.orders.length})
                        </h4>
                        
                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                          {selectedCustomer.orders.map((ord) => (
                            <div 
                              key={ord.id} 
                              className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono font-bold text-gray-500">
                                  #{ord.id.slice(0, 8).toUpperCase()}
                                </span>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  ord.status === 'Delivered' ? "bg-green-100 text-green-700" : 
                                  ord.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {ord.status}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                                <span className="font-extrabold text-gray-900">₹{(Number(ord.total) || 0).toLocaleString("en-IN")}</span>
                              </div>

                              <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <span className="line-clamp-1">{it.product_name} ({it.variety_label}) × {it.quantity}</span>
                                    <span className="font-semibold text-gray-900 ml-2">₹{(it.price * it.quantity).toLocaleString("en-IN")}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Quick status change */}
                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Update:</span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(ord.id, "Delivered")}
                                    className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100"
                                  >
                                    Delivered
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(ord.id, "Processing")}
                                    className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                                  >
                                    Processing
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center sticky top-24">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium text-sm">
                      Select a customer to view their customer ID, contact details, total orders, and purchase history.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
