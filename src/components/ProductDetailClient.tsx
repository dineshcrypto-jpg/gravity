"use client";

import React, { useState, useEffect } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { 
  Heart, ShoppingCart, Share2, Star, ShieldCheck, 
  CheckCircle2, Info, MessageSquare, Send, Check, User,
  Pencil, Trash2, X, LogIn, Loader2, Gift
} from "lucide-react";
import { Product, Review } from "@/types/database";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { getWhatsAppLink, saveOrderToSupabase } from "@/lib/checkout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import LoginModal from "@/components/LoginModal";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Use varieties from database, or fallback to standard size if none exist
  const varieties = product.varieties && product.varieties.length > 0 
    ? product.varieties 
    : [
        { id: "v1", product_id: product.id, name: "Standard", price: product.price, label: "1x", is_in_stock: product.is_in_stock }
      ];

  const firstInStock = varieties.find((v) => v.is_in_stock !== false) || varieties[0];
  const [selectedVariety, setSelectedVariety] = useState(firstInStock);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);

  // Editing state for review owner
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const isFav = isFavorite(product.id);

  const isCurrentInStock = product.is_in_stock && (selectedVariety.is_in_stock !== false);
  const activeOffer = selectedVariety.offer || product.offer;

  // Fetch genuine customer reviews from Supabase
  useEffect(() => {
    async function fetchReviews() {
      try {
        setReviewsLoading(true);
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Reviews query note:", error.message);
        } else if (data) {
          setReviews(data as Review[]);
        }
      } catch (err) {
        console.warn("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    }

    if (product.id) {
      fetchReviews();
    }
  }, [product.id]);

  // Check if current user already submitted a review
  useEffect(() => {
    const reviewedLocally = localStorage.getItem(`ksn_reviewed_${product.id}`);
    const reviewedInDb = user ? reviews.some((r) => r.user_id === user.id) : false;
    if (reviewedLocally || reviewedInDb) {
      setHasAlreadyReviewed(true);
    } else {
      setHasAlreadyReviewed(false);
    }
  }, [product.id, user, reviews]);

  // Pre-fill reviewer name if user is logged in
  useEffect(() => {
    if (user && !reviewerName) {
      setReviewerName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    }
  }, [user, reviewerName]);

  const handleAddToCart = () => {
    addToCart(product, selectedVariety, quantity);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleBuyNow = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const items = [{
      product,
      variety: selectedVariety,
      quantity
    }];
    const total = selectedVariety.price * quantity;
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919710149758";
    const customerInfo = {
      name: user.user_metadata?.full_name || "Customer",
      phone: user.phone || "",
      address: "Direct Buy (Address provided on WhatsApp)",
      landmark: ""
    };

    try {
      await saveOrderToSupabase(user.id, items, total, customerInfo);
      const waLink = getWhatsAppLink(whatsappNumber, items, total, customerInfo);
      window.location.href = waLink;
    } catch {
      const waLink = getWhatsAppLink(whatsappNumber, items, total, customerInfo);
      window.location.href = waLink;
    }
  };

  // Share Button handler (Web Share API with Clipboard fallback)
  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: product.name,
      text: `Order ${product.name} at KSN Super Store:`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      alert("Product link: " + shareUrl);
    }
  };

  // Submit genuine customer review (tied to verified account)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!reviewerName.trim()) {
      setReviewError("Please enter your name.");
      return;
    }
    if (!comment.trim()) {
      setReviewError("Please write a short review.");
      return;
    }
    if (hasAlreadyReviewed) {
      setReviewError("You have already reviewed this product.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const newReviewPayload = {
        product_id: product.id,
        user_id: user.id,
        customer_name: reviewerName.trim(),
        rating,
        comment: comment.trim(),
      };

      const { data, error } = await supabase
        .from("reviews")
        .insert(newReviewPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setReviews([data as Review, ...reviews]);
      } else {
        setReviews([
          {
            id: `temp-${Date.now()}`,
            product_id: product.id,
            user_id: user.id,
            customer_name: reviewerName.trim(),
            rating,
            comment: comment.trim(),
            created_at: new Date().toISOString(),
          },
          ...reviews,
        ]);
      }

      // Mark as reviewed to prevent duplicate submissions
      localStorage.setItem(`ksn_reviewed_${product.id}`, "true");
      setHasAlreadyReviewed(true);
      setReviewSuccess(true);
      setComment("");
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (err: unknown) {
      const error = err as Error;
      setReviewError(error.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Start editing a review (only the owner can do this)
  const handleStartEdit = (rev: Review) => {
    setEditingReviewId(rev.id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  // Save edited review (strictly restricted to owner account)
  const handleSaveEdit = async (reviewId: string) => {
    if (!user) return;
    if (!editComment.trim()) {
      alert("Review comment cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          rating: editRating,
          comment: editComment.trim(),
        })
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;

      setReviews(
        reviews.map((r) =>
          r.id === reviewId
            ? { ...r, rating: editRating, comment: editComment.trim() }
            : r
        )
      );
      setEditingReviewId(null);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Failed to update review: " + (error.message || "Unknown error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete review (strictly restricted to owner account)
  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;

    const confirmed = window.confirm("Are you sure you want to delete your review?");
    if (!confirmed) return;

    setIsDeletingId(reviewId);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;

      setReviews(reviews.filter((r) => r.id !== reviewId));
      localStorage.removeItem(`ksn_reviewed_${product.id}`);
      setHasAlreadyReviewed(false);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Failed to delete review: " + (error.message || "Unknown error"));
    } finally {
      setIsDeletingId(null);
    }
  };

  // Calculate review score
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1) 
    : "5.0";

  const scrollToReviews = () => {
    const el = document.getElementById("customer-reviews");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
        {/* Floating Success Toast */}
        {showSuccess && (
          <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl shadow-xl z-50 flex flex-col items-center animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span className="font-bold">Added to Cart!</span>
            </div>
            <p className="text-sm text-green-600 mb-3">{quantity}x {product.name} ({selectedVariety.name})</p>
            <div className="flex gap-2">
              <Link 
                href={product.categories ? `/categories/${product.categories.slug}` : "/categories"} 
                className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-green-700 border border-green-200 hover:bg-green-100"
              >
                Continue Shopping
              </Link>
              <Link 
                href="/cart" 
                className="px-4 py-2 bg-green-600 rounded-xl text-xs font-bold text-white hover:bg-green-700"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row">
          
          {/* Left Side - Image Gallery & Notice */}
          <div className="md:w-1/2 p-6 md:p-12 bg-gray-50 flex flex-col items-center justify-center relative">
            <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
              {activeOffer && (
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 animate-pulse">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>{activeOffer}</span>
                </span>
              )}
              {!isCurrentInStock && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                  Out of Stock
                </span>
              )}
              {isCurrentInStock && selectedVariety.price < product.price && (
                <span className="bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                  Sale
                </span>
              )}
            </div>

            {/* Product Image */}
            <div className="relative w-full aspect-square max-w-md mx-auto transform transition-all duration-500 hover:scale-105">
              <SafeImage
                src={selectedVariety.image_url || product.image_url}
                alt={product.name}
                fill
                className="object-contain animate-in fade-in zoom-in duration-500"
                key={selectedVariety.id}
                priority
              />
            </div>

            {/* Packaging Batch & Price Notice for Customers */}
            <div className="mt-6 w-full max-w-md bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-xs text-left">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold text-amber-800">Important Note: </span>
                Product packaging photos may show older printed batch dates or MRP on the label from previous stock. You will always receive <strong>100% fresh, quality stock</strong> at the current listed website rate.
              </div>
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="md:w-1/2 p-6 md:p-12 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              {/* Clickable Rating to Jump to Reviews */}
              <button 
                onClick={scrollToReviews}
                className="flex items-center space-x-1 text-yellow-400 group cursor-pointer"
                title="View customer reviews"
              >
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= Math.round(Number(averageRating)) ? "fill-current text-yellow-400" : "text-gray-300"}`} 
                    />
                  ))}
                </div>
                <span className="text-gray-700 text-xs ml-1.5 font-bold">{averageRating}</span>
                <span className="text-gray-500 text-xs ml-1 font-medium group-hover:text-brand-600 transition-colors">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </button>

              {/* Working Share Button */}
              <div className="relative">
                <button 
                  onClick={handleShare}
                  aria-label="Share product"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 hover:text-brand-600 hover:bg-gray-100 transition-all border border-gray-200 cursor-pointer"
                  title="Share this product"
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {product.name}
            </h1>
            
            <p className="text-gray-500 text-base md:text-lg mb-6 leading-relaxed">
              {product.description || "Premium quality product directly sourced for the best experience."}
            </p>

            <div className="mb-8 flex items-baseline gap-4">
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold text-gray-900 tracking-tight transition-all duration-300">
                  ₹{selectedVariety.price.toLocaleString("en-IN")}
                </span>
                <span className="text-gray-500 text-sm line-through font-medium">
                  ₹{Math.round(selectedVariety.price * 1.2).toLocaleString("en-IN")}
                </span>
              </div>
              
              {(selectedVariety.weight || product.weight) && (
                <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Weight: {selectedVariety.weight || product.weight}
                  </span>
                </div>
              )}
            </div>

            {/* Special Freebie / Offer Banner */}
            {activeOffer && (
              <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3.5 shadow-sm animate-in fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                    Special Freebie / Offer Available
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                    🎁 {activeOffer}
                  </div>
                </div>
              </div>
            )}

            {/* Variety Picker */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Variety</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {varieties.map((variety) => {
                  const isSelected = selectedVariety.id === variety.id;
                  const isVarInStock = variety.is_in_stock !== false;
                  return (
                    <button
                      key={variety.id}
                      onClick={() => setSelectedVariety(variety)}
                      className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-[#008080] bg-teal-50/50 shadow-sm"
                          : isVarInStock
                          ? "border-gray-200 bg-white hover:border-[#008080]/50"
                          : "border-gray-200 bg-gray-50 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {variety.offer && (
                        <span className="absolute -top-2.5 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 z-10 animate-pulse">
                          <Gift className="w-2.5 h-2.5" /> Freebie
                        </span>
                      )}
                      <span className={`text-sm font-bold mb-1 ${
                        isSelected ? "text-[#008080]" : isVarInStock ? "text-gray-900" : "text-gray-500 line-through"
                      }`}>
                        {variety.name}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-teal-100 text-teal-800"
                          : isVarInStock
                          ? "bg-gray-100 text-gray-500"
                          : "bg-red-100 text-red-600 font-bold"
                      }`}>
                        {isVarInStock ? variety.label : "Out of Stock"}
                      </span>
                      {variety.offer && (
                        <span className="text-[10px] font-extrabold text-amber-700 mt-1.5 truncate max-w-full bg-amber-100/70 px-1.5 py-0.5 rounded">
                          🎁 {variety.offer}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="flex items-center gap-4 mb-8 mt-auto">
              <div className="flex items-center border border-gray-200 rounded-full bg-white h-14">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
                >
                  +
                </button>
              </div>

              <button 
                type="button"
                disabled={!isCurrentInStock}
                onClick={handleAddToCart}
                className={`flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-extrabold text-base md:text-lg transition-all duration-300 shadow-md ${
                  isCurrentInStock 
                    ? "bg-[#008080] text-white hover:bg-[#006666] shadow-[#008080]/30 hover:shadow-lg active:scale-98 cursor-pointer" 
                    : "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isCurrentInStock ? "Add to Cart" : "Out of Stock"}
              </button>

              <button 
                onClick={() => toggleFavorite(product)}
                className={`h-14 w-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isFav 
                    ? "border-red-500 bg-red-50 text-red-500" 
                    : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400"
                }`}
              >
                <Heart className={`w-6 h-6 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>

            <button 
               disabled={!isCurrentInStock}
               onClick={handleBuyNow}
               className={`w-full h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                 isCurrentInStock 
                   ? "bg-gray-900 text-white hover:bg-black shadow-lg transform hover:-translate-y-0.5 cursor-pointer" 
                   : "hidden"
               }`}
            >
              Buy Now
            </button>

            {/* Value Props */}
            <div className="flex justify-center mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">100% Genuine</p>
                  <p className="text-xs text-gray-500 font-medium">Quality Guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CUSTOMER REVIEWS SECTION (PERMANENT & EDITABLE ONLY BY AUTHOR ACCOUNT) ─── */}
      <div id="customer-reviews" className="mt-12 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#008080]" />
              Customer Reviews
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Real reviews from verified customer accounts. Only the author can edit or delete their review.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
            <div className="text-3xl font-extrabold text-gray-900">{averageRating}</div>
            <div>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(Number(averageRating)) ? "fill-current" : "text-gray-300"}`} 
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Reviews List (Left / 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
              All Reviews ({reviewCount})
            </h3>

            {reviewsLoading ? (
              <div className="p-8 text-center text-gray-400">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No reviews yet for this product.</p>
                <p className="text-xs text-gray-400 mt-1">Be the first customer to share your experience below!</p>
              </div>
            ) : (
              reviews.map((rev) => {
                const isOwner = Boolean(user && rev.user_id && user.id === rev.user_id);
                const isEditingThis = editingReviewId === rev.id;

                return (
                  <div key={rev.id} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 transition-all hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#008080]/10 text-[#008080] flex items-center justify-center font-bold text-xs uppercase">
                          {rev.customer_name ? rev.customer_name.charAt(0) : "C"}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-900">{rev.customer_name}</span>
                          {isOwner ? (
                            <span className="ml-2 text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                              You
                            </span>
                          ) : (
                            <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>

                        {/* Owner Controls: ONLY the author who wrote it can Edit or Delete */}
                        {isOwner && !isEditingThis && (
                          <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-2">
                            <button
                              onClick={() => handleStartEdit(rev)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit your review"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              disabled={isDeletingId === rev.id}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete your review"
                            >
                              {isDeletingId === rev.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditingThis ? (
                      /* Inline Edit Form for the author */
                      <div className="mt-3 p-4 bg-white rounded-xl border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                            Edit Your Rating
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setEditRating(s)}
                                className="p-0.5"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    s <= editRating ? "fill-current text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#008080]"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingEdit}
                            onClick={() => handleSaveEdit(rev.id)}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#008080] text-white hover:bg-[#006666] flex items-center gap-1"
                          >
                            {isSavingEdit ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex text-yellow-400 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3.5 h-3.5 ${star <= rev.rating ? "fill-current" : "text-gray-300"}`} 
                            />
                          ))}
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed">
                          {rev.comment}
                        </p>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Write a Review Form (Right / 5 cols) */}
          <div className="lg:col-span-5 bg-gray-50 rounded-2xl p-6 border border-gray-200/80">
            <h3 className="text-base font-bold text-gray-900 mb-1">Write a Review</h3>
            <p className="text-xs text-gray-500 mb-5">
              Share your genuine feedback with other shoppers.
            </p>

            {!user ? (
              <div className="p-6 bg-white rounded-xl border border-gray-200 text-center space-y-3">
                <LogIn className="w-8 h-8 text-[#008080] mx-auto" />
                <p className="text-sm font-bold text-gray-900">Sign in to write a review</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  To protect reviews and ensure only real customers can edit or delete their comments, please sign in with your account.
                </p>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2.5 bg-[#008080] text-white rounded-xl font-bold text-xs hover:bg-[#006666] transition-colors cursor-pointer"
                >
                  Sign In to Review
                </button>
              </div>
            ) : hasAlreadyReviewed ? (
              <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-sm">You reviewed this product</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your feedback is saved permanently. If you wish to update or remove your rating, click the <strong>Edit (pencil)</strong> or <strong>Delete (trash)</strong> button on your review on the left.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-medium">
                    Review submitted successfully! Thank you.
                  </div>
                )}
                {reviewError && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-medium">
                    {reviewError}
                  </div>
                )}

                {/* Star Rating Select */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-115 transition-transform"
                      >
                        <Star 
                          className={`w-6 h-6 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-600 ml-2">
                      {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Average" : rating === 2 ? "Below Average" : "Poor"}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:border-[#008080]"
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Review *
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the product quality, packing, and freshness..."
                    required
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:border-[#008080]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}
