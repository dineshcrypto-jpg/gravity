"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Trash2, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { generateAndDownloadInvoice, getWhatsAppLink, saveOrderToSupabase } from "@/lib/checkout";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    landmark: ""
  });

  // User requested to remove delivery fee entirely
  const finalTotal = cartTotal;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert("Please fill in your Name, Phone, and Address to proceed.");
      return;
    }
    setIsCheckingOut(true);
    
    try {
      // 1. Save order to Database (including guests)
      console.log("Saving order...", { userId: user?.id, items, finalTotal, customerInfo });
      await saveOrderToSupabase(user?.id, items, finalTotal, customerInfo);

      // 2. Generate and download PDF
      const invoiceNum = generateAndDownloadInvoice(items, finalTotal, customerInfo);
      
      // 3. Open WhatsApp
      const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919710149758";
      const waLink = getWhatsAppLink(whatsappNumber, items, finalTotal, invoiceNum, customerInfo);
      
      // Use window.location.href for reliable handoff to WhatsApp
      window.location.href = waLink;

    } catch (error: any) {
      console.error("Checkout failed", error);
      alert("Checkout failed: " + (error.message || "Unknown error"));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 md:p-16 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-24 h-24 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            href="/categories" 
            className="w-full flex items-center justify-center px-6 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart
          </h1>
          <Link href="/categories" className="text-brand-600 font-bold hover:text-brand-700 transition-colors flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Continue Shopping
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col gap-6">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.variety.id}`} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    
                    {/* Item Image */}
                    <div className="w-full sm:w-32 aspect-square bg-gray-50 rounded-2xl relative overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image_url || "https://placehold.co/400x400?text=No+Image"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Variety: <span className="font-medium text-gray-900">{item.variety.name} ({item.variety.label})</span>
                          </p>
                        </div>
                        <span className="text-lg font-extrabold text-gray-900">
                          ₹{(item.variety.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-4 sm:mt-auto">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-full bg-white h-10 w-28">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.variety.id, item.quantity - 1)}
                            className="flex-1 h-full flex items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.variety.id, item.quantity + 1)}
                            className="flex-1 h-full flex items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button 
                          onClick={() => removeFromCart(item.product.id, item.variety.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="flex flex-col gap-4 text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-medium text-gray-900">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="mb-6 space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delivery Details</h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="Enter contact number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Door No / Street</label>
                  <textarea
                    rows={2}
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    placeholder="Address details"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Area / Landmark</label>
                  <input
                    type="text"
                    value={customerInfo.landmark}
                    onChange={(e) => setCustomerInfo({...customerInfo, landmark: e.target.value})}
                    placeholder="e.g. Near Bus Stand"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-gray-900">
                    Rs. {finalTotal.toLocaleString("en-IN")}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
                </div>
              </div>


              <button 
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full h-14 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 group ${
                  isCheckingOut 
                    ? "bg-gray-400 text-white cursor-wait" 
                    : "bg-green-600 text-white hover:bg-green-700 shadow-green-500/30"
                }`}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    Checkout with WhatsApp
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Clicking this will download your invoice and open WhatsApp to send your order directly to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
