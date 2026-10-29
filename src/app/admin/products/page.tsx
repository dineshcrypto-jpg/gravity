"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2, Search, Package, Plus, Pencil, Trash2, Check, X,
  ToggleLeft, ToggleRight, ChevronDown, ArrowUpDown,
  ShoppingBag, AlertTriangle, Eye, EyeOff, FolderOpen, IndianRupee,
  Scissors, Link2, Gift, Sparkles
} from "lucide-react";
import { Product, Category, Variety, Offer } from "@/types/database";
import SafeImage from "@/components/SafeImage";
import { fetchOffers, saveOfferToDb, deleteOfferFromDb } from "@/lib/offers";
import { parseProductOffers } from "@/lib/deduplicate";
import Link from "next/link";

// ─── Delete Confirmation Modal ───────────────────────────────────
function DeleteModal({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const canDelete = typed === "DELETE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Delete Product</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          You are about to permanently delete <strong className="text-red-600">{productName}</strong> and all its varieties.
        </p>
        <p className="text-sm text-gray-500 mb-3">
          Type <code className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">DELETE</code> to confirm:
        </p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type DELETE here"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none font-mono text-center text-lg tracking-widest mb-6"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              canDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Product Modal ────────────────────────────────────
function ProductFormModal({
  product,
  categories,
  onSave,
  onClose,
}: {
  product: Product | null; // null = adding new
  categories: Category[];
  onSave: () => void;
  onClose: () => void;
}) {
  const isEditing = !!product;
  const parsed = product ? parseProductOffers(product) : null;
  const [name, setName] = useState(parsed?.name || "");
  const [description, setDescription] = useState(parsed?.description || "");
  const [price, setPrice] = useState(parsed?.price?.toString() || "");
  const [weight, setWeight] = useState(parsed?.weight || "");
  const [imageUrl, setImageUrl] = useState(parsed?.image_url || "");
  const [categoryId, setCategoryId] = useState(parsed?.category_id || categories[0]?.id || "");
  const [offer, setOffer] = useState(parsed?.offer || "");
  const [isInStock, setIsInStock] = useState(parsed?.is_in_stock ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Varieties management
  const [varieties, setVarieties] = useState<Variety[]>(parsed?.varieties || []);
  const [showVarieties, setShowVarieties] = useState((parsed?.varieties?.length || 0) > 0);

  // Split product state
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitInitialVarietyId, setSplitInitialVarietyId] = useState<string | undefined>(undefined);

  const addVariety = () => {
    setVarieties([
      ...varieties,
      {
        id: `new-${Date.now()}`,
        product_id: product?.id || "",
        name: "",
        label: "",
        price: 0,
        weight: "",
        image_url: "",
        is_in_stock: true,
      },
    ]);
  };

  const updateVariety = (index: number, field: keyof Variety, value: any) => {
    const updated = [...varieties];
    (updated[index] as any)[field] = value;
    setVarieties(updated);
  };

  const removeVariety = (index: number) => {
    setVarieties(varieties.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Valid price is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const cleanDesc = description.trim();
      const varietyOffers: Record<string, string> = {};
      for (const v of varieties) {
        if (v.offer && v.offer.trim()) {
          varietyOffers[v.id] = v.offer.trim();
          if (v.label) varietyOffers[v.label.trim()] = v.offer.trim();
          if (v.name) varietyOffers[v.name.trim()] = v.offer.trim();
        }
      }

      const offerMeta = {
        product: offer.trim() || null,
        varieties: varietyOffers,
      };

      let finalDescription: string | null = cleanDesc || null;
      if (offerMeta.product || Object.keys(varietyOffers).length > 0) {
        const metaComment = `<!--KSN_OFFERS:${JSON.stringify(offerMeta)}-->`;
        finalDescription = cleanDesc ? `${cleanDesc}\n${metaComment}` : metaComment;
      }

      if (isEditing && product) {
        // Update product
        const productPayload: any = {
          name: name.trim(),
          description: finalDescription,
          price: parseFloat(price),
          weight: weight.trim() || null,
          image_url: imageUrl.trim() || null,
          category_id: categoryId,
          is_in_stock: isInStock,
          offer: offer.trim() || null,
        };

        let { error: updateErr } = await supabase
          .from("products")
          .update(productPayload)
          .eq("id", product.id);

        if (updateErr && (updateErr.message?.includes("offer") || updateErr.details?.includes("offer"))) {
          delete productPayload.offer;
          const retry = await supabase.from("products").update(productPayload).eq("id", product.id);
          updateErr = retry.error;
        }

        if (updateErr) throw updateErr;

        // Handle varieties
        // Delete removed varieties
        const existingIds = varieties.filter((v) => !v.id.startsWith("new-")).map((v) => v.id);
        const originalIds = (product.varieties || []).map((v) => v.id);
        const toDelete = originalIds.filter((id) => !existingIds.includes(id));

        if (toDelete.length > 0) {
          await supabase.from("varieties").delete().in("id", toDelete);
        }

        // Upsert existing + insert new
        for (const v of varieties) {
          const varietyPayload: any = {
            product_id: product.id,
            name: v.name,
            label: v.label,
            price: v.price,
            weight: v.weight || null,
            image_url: v.image_url || null,
            is_in_stock: v.is_in_stock !== false,
            offer: v.offer?.trim() || null,
          };

          if (v.id.startsWith("new-")) {
            let { error: insErr } = await supabase.from("varieties").insert(varietyPayload);
            if (insErr && (insErr.message?.includes("offer") || insErr.details?.includes("offer"))) {
              delete varietyPayload.offer;
              insErr = (await supabase.from("varieties").insert(varietyPayload)).error;
            }
            if (insErr && (insErr.message?.includes("is_in_stock") || insErr.details?.includes("is_in_stock"))) {
              delete varietyPayload.is_in_stock;
              await supabase.from("varieties").insert(varietyPayload);
            }
          } else {
            delete varietyPayload.product_id;
            let { error: updErr } = await supabase
              .from("varieties")
              .update(varietyPayload)
              .eq("id", v.id);
            if (updErr && (updErr.message?.includes("offer") || updErr.details?.includes("offer"))) {
              delete varietyPayload.offer;
              updErr = (await supabase.from("varieties").update(varietyPayload).eq("id", v.id)).error;
            }
            if (updErr && (updErr.message?.includes("is_in_stock") || updErr.details?.includes("is_in_stock"))) {
              delete varietyPayload.is_in_stock;
              await supabase
                .from("varieties")
                .update(varietyPayload)
                .eq("id", v.id);
            }
          }
        }
      } else {
        // Insert new product
        const newProductPayload: any = {
          name: name.trim(),
          description: finalDescription,
          price: parseFloat(price),
          weight: weight.trim() || null,
          image_url: imageUrl.trim() || null,
          category_id: categoryId,
          is_in_stock: isInStock,
          offer: offer.trim() || null,
        };

        let { data: newProduct, error: insertErr } = await supabase
          .from("products")
          .insert(newProductPayload)
          .select()
          .single();

        if (insertErr && (insertErr.message?.includes("offer") || insertErr.details?.includes("offer"))) {
          delete newProductPayload.offer;
          const retry = await supabase.from("products").insert(newProductPayload).select().single();
          newProduct = retry.data;
          insertErr = retry.error;
        }

        if (insertErr) throw insertErr;

        // Insert varieties for new product
        if (newProduct && varieties.length > 0) {
          const varietyData = varieties.map((v) => ({
            product_id: newProduct.id,
            name: v.name,
            label: v.label,
            price: v.price,
            weight: v.weight || null,
            image_url: v.image_url || null,
            is_in_stock: v.is_in_stock !== false,
            offer: v.offer?.trim() || null,
          }));
          let { error: insErr } = await supabase.from("varieties").insert(varietyData);
          if (insErr && (insErr.message?.includes("offer") || insErr.details?.includes("offer"))) {
            const fallbackData = varietyData.map(({ offer: _off, ...rest }) => rest);
            insErr = (await supabase.from("varieties").insert(fallbackData)).error;
          }
          if (insErr && (insErr.message?.includes("is_in_stock") || insErr.details?.includes("is_in_stock"))) {
            const fallbackData = varietyData.map(({ is_in_stock: _st, offer: _off, ...rest }) => rest);
            await supabase.from("varieties").insert(fallbackData);
          }
        }
      }

      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunflower Oil"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-gray-900 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-gray-900 resize-none"
            />
          </div>

          {/* Price & Weight Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Base Price (₹) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-gray-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Weight / Size
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 1 kg, 500 ml"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-gray-900 appearance-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Product-Specific Offer / Freebie */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-600" />
                Product Offer / Freebie (Optional)
              </label>
              <span className="text-[11px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                Shows badge on card & page
              </span>
            </div>
            <input
              type="text"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="e.g. Free 1 Gulab Jamun Cup, Buy 1 Get 1 Free, 10% Extra"
              className="w-full px-4 py-2.5 bg-white border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none text-gray-900 font-medium text-sm placeholder-gray-400"
            />
          </div>

          {/* Image URL with Preview - Larger & Clear */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Product Image URL
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border-2 border-gray-200 shrink-0 flex items-center justify-center shadow-xs p-1">
                <SafeImage
                  src={imageUrl}
                  alt={name || "Product"}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or Supabase storage URL"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900 text-sm font-medium"
              />
            </div>
          </div>

          {/* Stock Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="font-bold text-gray-700">In Stock</span>
            <button
              type="button"
              onClick={() => setIsInStock(!isInStock)}
              className="flex items-center gap-2"
            >
              {isInStock ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-300" />
              )}
              <span className={`text-sm font-bold ${isInStock ? "text-green-600" : "text-gray-400"}`}>
                {isInStock ? "Available" : "Out of Stock"}
              </span>
            </button>
          </div>

          {/* ─── Varieties Section ─────────────────────────── */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Varieties / Sizes ({varieties.length})
                </label>
                {isEditing && varieties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSplitInitialVarietyId(undefined);
                      setShowSplitModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-[#008080] border border-teal-200 rounded-lg text-xs font-bold transition-colors shadow-xs"
                    title="Split this product into separate products (e.g. Bru packet vs Bru bottle)"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Split / Separate Product</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVarieties(!showVarieties);
                  if (!showVarieties && varieties.length === 0) addVariety();
                }}
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                {showVarieties ? "Hide" : "Add Varieties"}
              </button>
            </div>

            {showVarieties && (
              <div className="space-y-4">
                {varieties.map((v, idx) => (
                  <div key={v.id} className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all shadow-xs">
                    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Much larger variety photo */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white border-2 border-gray-200 shrink-0 shadow-xs flex items-center justify-center p-1">
                          <SafeImage
                            src={v.image_url || imageUrl}
                            alt={v.label || v.name || `Variety ${idx + 1}`}
                            fill
                            className="object-contain p-0.5"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                              Variety #{idx + 1}
                            </span>
                            {v.label && (
                              <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 truncate">
                                {v.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 font-medium">
                            {v.weight || "No weight"} • <span className="font-extrabold text-gray-900 text-sm">₹{v.price || 0}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Stock toggle */}
                        <button
                          type="button"
                          onClick={() => updateVariety(idx, "is_in_stock", v.is_in_stock === false ? true : false)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            v.is_in_stock !== false
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {v.is_in_stock !== false ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-green-600 shrink-0" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-red-500 shrink-0" />
                              <span>Out of Stock</span>
                            </>
                          )}
                        </button>

                        {/* Separate / Split this single variety button */}
                        {isEditing && varieties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSplitInitialVarietyId(v.id);
                              setShowSplitModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                            title={`Separate "${v.label || v.name || 'this variety'}" into a new product`}
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Separate</span>
                          </button>
                        )}

                        <button
                          onClick={() => removeVariety(idx)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete variety"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inputs with crystal clear labels */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Name (e.g. Small / Pouch / Bottle)
                        </label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => updateVariety(idx, "name", e.target.value)}
                          placeholder="Name"
                          className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Label / Size (e.g. 50g, 250g, 1L)
                        </label>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => updateVariety(idx, "label", e.target.value)}
                          placeholder="Label"
                          className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Rate / Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={v.price ?? ""}
                          onChange={(e) => updateVariety(idx, "price", parseFloat(e.target.value) || 0)}
                          placeholder="Rate ₹"
                          className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Weight / Pack (e.g. 50g, 100g)
                        </label>
                        <input
                          type="text"
                          value={v.weight || ""}
                          onChange={(e) => updateVariety(idx, "weight", e.target.value)}
                          placeholder="Weight"
                          className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white font-medium"
                        />
                      </div>
                    </div>

                    {/* Variety specific image with preview */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-2xs flex items-center justify-center">
                        <SafeImage
                          src={v.image_url || imageUrl}
                          alt="Variety preview"
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                      <input
                        type="text"
                        value={v.image_url || ""}
                        onChange={(e) => updateVariety(idx, "image_url", e.target.value)}
                        placeholder="Variety specific image URL (optional - falls back to product photo)"
                        className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                      />
                    </div>

                    {/* Variety specific offer / freebie */}
                    <div className="mt-2.5">
                      <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-600" /> Variety Offer (e.g. Free 1 Gulab Jamun Cup on this size)
                      </label>
                      <input
                        type="text"
                        value={v.offer || ""}
                        onChange={(e) => updateVariety(idx, "offer", e.target.value)}
                        placeholder="e.g. Free 1 Gulab Jamun Cup"
                        className="w-full px-3 py-2 bg-amber-50/50 border-2 border-amber-200/70 rounded-lg text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 focus:bg-white font-medium"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariety}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Variety
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {saving ? "Saving..." : isEditing ? "Update Product" : "Add Product"}
          </button>
        </div>

        {/* ─── Split Product Modal (nested inside Edit section) ───── */}
        {showSplitModal && product && (
          <SplitProductModal
            product={product}
            initialVarietyId={splitInitialVarietyId}
            categories={categories}
            onSave={(newProductName, count) => {
              setShowSplitModal(false);
              setSplitInitialVarietyId(undefined);
              onSave();
            }}
            onClose={() => {
              setShowSplitModal(false);
              setSplitInitialVarietyId(undefined);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Split / Separate Product Modal ──────────────────────────────
function SplitProductModal({
  product,
  initialVarietyId,
  categories,
  onSave,
  onClose,
}: {
  product: Product;
  initialVarietyId?: string;
  categories: Category[];
  onSave: (newProductName: string, count: number) => void;
  onClose: () => void;
}) {
  const varieties = product.varieties || [];

  // Determine initial selection
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialVarietyId && varieties.some((v) => v.id === initialVarietyId)) {
      return [initialVarietyId];
    }
    return varieties.length > 0 ? [varieties[0].id] : [];
  });

  const selectedVarieties = varieties.filter((v) => selectedIds.includes(v.id));
  const firstSelected = selectedVarieties[0] || null;

  // New product form states
  const [name, setName] = useState(() => {
    if (firstSelected) {
      const tag = firstSelected.label || firstSelected.name;
      return tag ? `${product.name} - ${tag}` : `${product.name} (Separated)`;
    }
    return `${product.name} (Separated)`;
  });
  const [description, setDescription] = useState(product.description || "");
  const [categoryId, setCategoryId] = useState(product.category_id || categories[0]?.id || "");
  const [price, setPrice] = useState(firstSelected ? firstSelected.price.toString() : product.price.toString());
  const [weight, setWeight] = useState(firstSelected?.weight || product.weight || "");
  const [imageUrl, setImageUrl] = useState(firstSelected?.image_url || product.image_url || "");
  const [removeFromOriginal, setRemoveFromOriginal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleToggleSelect = (variety: Variety) => {
    const isSelected = selectedIds.includes(variety.id);
    let nextIds: string[];
    if (isSelected) {
      nextIds = selectedIds.filter((id) => id !== variety.id);
    } else {
      nextIds = [...selectedIds, variety.id];
    }
    setSelectedIds(nextIds);

    // If selecting and now there is at least 1, update suggestions
    if (!isSelected && nextIds.length === 1) {
      const tag = variety.label || variety.name;
      setName(tag ? `${product.name} - ${tag}` : `${product.name} (Separated)`);
      if (variety.price) setPrice(variety.price.toString());
      if (variety.weight) setWeight(variety.weight);
      if (variety.image_url) setImageUrl(variety.image_url);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(varieties.map((v) => v.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirmSplit = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one variety to separate into the new product.");
      return;
    }
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    const numPrice = price === "" ? 0 : parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid price (₹0 or greater).");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. Create the new product
      const catId = categoryId && categoryId.length > 10 ? categoryId : null;
      const { data: newProd, error: insertProdErr } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          category_id: catId,
          price: numPrice,
          weight: weight.trim() || null,
          image_url: imageUrl.trim() || null,
          is_in_stock: true,
        })
        .select()
        .single();

      if (insertProdErr || !newProd) {
        console.error("Split insert error:", insertProdErr);
        throw new Error(insertProdErr?.message || "Failed to create new product");
      }

      // 2. Transfer or copy varieties
      if (removeFromOriginal) {
        // Move existing database varieties
        const existingIds = selectedVarieties
          .filter((v) => !v.id.startsWith("new-"))
          .map((v) => v.id);

        if (existingIds.length > 0) {
          const { error: moveErr } = await supabase
            .from("varieties")
            .update({ product_id: newProd.id })
            .in("id", existingIds);

          if (moveErr) throw moveErr;
        }

        // Insert new/unsaved varieties
        const newOnes = selectedVarieties.filter((v) => v.id.startsWith("new-"));
        if (newOnes.length > 0) {
          const insertPayload = newOnes.map((v) => ({
            product_id: newProd.id,
            name: v.name,
            label: v.label,
            price: v.price,
            weight: v.weight || null,
            image_url: v.image_url || null,
            is_in_stock: v.is_in_stock !== false,
          }));
          const { error: insErr } = await supabase.from("varieties").insert(insertPayload);
          if (insErr && (insErr.message?.includes("is_in_stock") || insErr.details?.includes("is_in_stock"))) {
            const fallback = insertPayload.map(({ is_in_stock, ...rest }) => rest);
            await supabase.from("varieties").insert(fallback);
          }
        }
      } else {
        // Copy varieties to new product without deleting from original
        const copyPayload = selectedVarieties.map((v) => ({
          product_id: newProd.id,
          name: v.name,
          label: v.label,
          price: v.price,
          weight: v.weight || null,
          image_url: v.image_url || null,
          is_in_stock: v.is_in_stock !== false,
        }));
        const { error: copyErr } = await supabase.from("varieties").insert(copyPayload);
        if (copyErr && (copyErr.message?.includes("is_in_stock") || copyErr.details?.includes("is_in_stock"))) {
          const fallback = copyPayload.map(({ is_in_stock, ...rest }) => rest);
          await supabase.from("varieties").insert(fallback);
        }
      }

      onSave(name.trim(), selectedIds.length);
    } catch (err: any) {
      console.error("Split product error:", err);
      setError(err.message || "Failed to split product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-[#008080] rounded-2xl">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Separate / Split Product
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Split <strong className="text-gray-800">{product.name}</strong> varieties into a new separate product
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Step 1: Varieties Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              1. Select Varieties to Move ({selectedIds.length} of {varieties.length} selected)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-[#008080] hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs font-bold text-gray-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {varieties.map((v) => {
              const isSelected = selectedIds.includes(v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => handleToggleSelect(v)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#008080] bg-teal-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#008080] rounded accent-[#008080] cursor-pointer shrink-0"
                    />
                    {/* V.V. Small original photo */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-2xs flex items-center justify-center p-0.5">
                      <SafeImage
                        src={v.image_url || product.image_url}
                        alt={v.label || v.name}
                        fill
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm truncate">
                          {v.label || v.name || "Untitled Variety"}
                        </span>
                        {v.name && v.label && v.name !== v.label && (
                          <span className="text-xs text-gray-400 truncate">({v.name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {v.weight && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-medium">{v.weight}</span>}
                        <span className="font-bold text-gray-900">₹{v.price}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                      v.is_in_stock !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {v.is_in_stock !== false ? "In Stock" : "Out"}
                  </span>
                </div>
              );
            })}
          </div>
          {varieties.length > 0 && selectedIds.length === varieties.length && (
            <p className="text-xs text-amber-600 font-medium mt-2">
              Note: All varieties are selected. The original product will remain with its base details.
            </p>
          )}
        </div>

        {/* Step 2: New Product Details */}
        <div className="space-y-4 border-t border-gray-100 pt-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            2. New Product Details (Pre-filled with same data)
          </label>

          {/* New Product Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              New Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bru Coffee Bottle"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900 font-bold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900 resize-none text-sm"
            />
          </div>

          {/* Price, Weight, Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Base Price (₹) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Weight / Size
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 50g, 100g"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900 appearance-none bg-white text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Image URL with Preview */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Product Image URL
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-200 shrink-0 flex items-center justify-center shadow-2xs">
                <SafeImage
                  src={imageUrl}
                  alt={name || "Product"}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL for new product"
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#008080] outline-none text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Remove from original toggle */}
          <div
            onClick={() => setRemoveFromOriginal(!removeFromOriginal)}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <input
              type="checkbox"
              checked={removeFromOriginal}
              onChange={() => {}}
              className="w-4 h-4 text-[#008080] rounded accent-[#008080] cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-gray-800">
                Remove moved varieties from original product ({product.name})
              </span>
              <p className="text-gray-500 mt-0.5">
                Splits the product cleanly into 2. Uncheck if you want to keep copies in both products.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert above actions so it is never missed */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSplit}
            disabled={saving || selectedIds.length === 0}
            className="flex-1 py-3.5 bg-[#008080] text-white rounded-xl font-bold hover:bg-[#006666] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Scissors className="w-5 h-5" />
            )}
            {saving ? "Splitting..." : `Create "${name.slice(0, 20)}${name.length > 20 ? '...' : ''}"`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Merge Products Modal ─────────────────────────────────────────
function MergeProductsModal({
  sourceProduct,
  allProducts,
  onSave,
  onClose,
}: {
  sourceProduct: Product;
  allProducts: Product[];
  onSave: (targetName: string) => void;
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);

  // New variety details for target product
  const [varietyLabel, setVarietyLabel] = useState(
    sourceProduct.weight || sourceProduct.name
  );
  const [varietyName, setVarietyName] = useState(sourceProduct.name);
  const [varietyPrice, setVarietyPrice] = useState(sourceProduct.price.toString());
  const [varietyWeight, setVarietyWeight] = useState(sourceProduct.weight || "");
  const [varietyImage, setVarietyImage] = useState(sourceProduct.image_url || "");
  const [deleteSourceProduct, setDeleteSourceProduct] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Candidate target products (exclude the source product itself)
  const availableTargets = allProducts.filter((p) => p.id !== sourceProduct.id);
  const filteredTargets = availableTargets.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
  });

  const handleSelectTarget = (target: Product) => {
    setTargetProduct(target);
    setError("");
  };

  const handleConfirmMerge = async () => {
    if (!targetProduct) {
      setError("Please choose a target product to merge into (e.g. Cow Ghee).");
      return;
    }
    const numPrice = varietyPrice === "" ? 0 : parseFloat(varietyPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid rate/price.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. If source product already has existing varieties in database, reassign them to target
      if (sourceProduct.varieties && sourceProduct.varieties.length > 0) {
        const { error: moveVarErr } = await supabase
          .from("varieties")
          .update({ product_id: targetProduct.id })
          .eq("product_id", sourceProduct.id);

        if (moveVarErr) {
          console.warn("Could not reassign existing varieties directly:", moveVarErr);
        }
      }

      // 2. Add the source product itself as a variety under the target product
      const newVarietyPayload: any = {
        product_id: targetProduct.id,
        name: varietyName.trim() || sourceProduct.name,
        label: varietyLabel.trim() || sourceProduct.weight || sourceProduct.name,
        price: numPrice,
        weight: varietyWeight.trim() || null,
        image_url: varietyImage.trim() || null,
        is_in_stock: sourceProduct.is_in_stock,
      };

      const { error: insErr } = await supabase.from("varieties").insert(newVarietyPayload);
      if (insErr) {
        if (insErr.message?.includes("is_in_stock") || insErr.details?.includes("is_in_stock")) {
          delete newVarietyPayload.is_in_stock;
          const { error: insFallbackErr } = await supabase.from("varieties").insert(newVarietyPayload);
          if (insFallbackErr) throw insFallbackErr;
        } else {
          throw insErr;
        }
      }

      // 3. Delete the original standalone source product if requested
      if (deleteSourceProduct) {
        await supabase.from("varieties").delete().eq("product_id", sourceProduct.id);
        const { error: delErr } = await supabase.from("products").delete().eq("id", sourceProduct.id);
        if (delErr) {
          console.warn("Could not delete source product:", delErr);
        }
      }

      onSave(targetProduct.name);
    } catch (err: any) {
      console.error("Merge error:", err);
      setError(err.message || "Failed to merge products. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Merge Product into Another
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Combine standalone sizes (e.g. 100ml, 200ml) into a single master product
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Source Product Card */}
        <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 mb-6 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-purple-200 shrink-0 shadow-xs flex items-center justify-center">
            <SafeImage
              src={sourceProduct.image_url}
              alt={sourceProduct.name}
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Source Product (Will be merged)
            </span>
            <h3 className="font-extrabold text-gray-900 text-base truncate mt-1">
              {sourceProduct.name}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Rate: <span className="font-bold text-gray-900">₹{sourceProduct.price}</span> • Weight:{" "}
              <span className="font-bold text-gray-900">{sourceProduct.weight || "None"}</span>
            </p>
          </div>
        </div>

        {/* Step 1: Select Target Product */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            1. Select Master Product to Merge into *
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search master product (e.g. Cow Ghee, Bru, 3 Roses)..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredTargets.slice(0, 30).map((target) => {
              const isSelected = targetProduct?.id === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => handleSelectTarget(target)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/50 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-purple-600 accent-purple-600 cursor-pointer shrink-0"
                    />
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-2xs flex items-center justify-center p-1">
                      <SafeImage
                        src={target.image_url}
                        alt={target.name}
                        fill
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{target.name}</h4>
                      <p className="text-xs text-gray-500">
                        Base: ₹{target.price} • {target.varieties?.length || 0} existing varieties
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full shrink-0">
                      Selected Target
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: New Variety Details */}
        {targetProduct && (
          <div className="space-y-4 border-t border-gray-100 pt-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              2. New Variety Details for &ldquo;{targetProduct.name}&rdquo;
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Variety Label (e.g. 200ml, 100g, Pack)
                </label>
                <input
                  type="text"
                  value={varietyLabel}
                  onChange={(e) => setVarietyLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-purple-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Rate / Price (₹) *
                </label>
                <input
                  type="number"
                  value={varietyPrice}
                  onChange={(e) => setVarietyPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-purple-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Weight / Size
                </label>
                <input
                  type="text"
                  value={varietyWeight}
                  onChange={(e) => setVarietyWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Variety Name (Optional)
                </label>
                <input
                  type="text"
                  value={varietyName}
                  onChange={(e) => setVarietyName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Variety Image URL */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Variety Image URL
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center shadow-xs p-1">
                  <SafeImage
                    src={varietyImage}
                    alt="Variety preview"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <input
                  type="text"
                  value={varietyImage}
                  onChange={(e) => setVarietyImage(e.target.value)}
                  placeholder="Image URL for this variety"
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none text-gray-900 text-xs"
                />
              </div>
            </div>

            {/* Delete Source Product Option */}
            <div
              onClick={() => setDeleteSourceProduct(!deleteSourceProduct)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={deleteSourceProduct}
                onChange={() => {}}
                className="w-4 h-4 text-purple-600 rounded accent-purple-600 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-800">
                  Delete &ldquo;{sourceProduct.name}&rdquo; as a standalone product after merging
                </span>
                <p className="text-gray-500 mt-0.5">
                  Recommended. It will cleanly exist as a variety under &ldquo;{targetProduct.name}&rdquo;.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmMerge}
            disabled={saving || !targetProduct}
            className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Link2 className="w-5 h-5" />
            )}
            {saving
              ? "Merging..."
              : targetProduct
              ? `Merge into "${targetProduct.name.slice(0, 20)}"`
              : "Select Target Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Management Modal ───────────────────────────────────
function CategoryModal({
  categories,
  onSave,
  onClose,
}: {
  categories: Category[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [cats, setCats] = useState<Category[]>(categories);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleToggleHidden = async (cat: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_hidden: !cat.is_hidden })
      .eq("id", cat.id);

    if (!error) {
      setCats(cats.map((c) => (c.id === cat.id ? { ...c, is_hidden: !c.is_hidden } : c)));
    }
  };

  const handleAddCategory = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const slug = newSlug.trim() || newName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: newName.trim(), slug })
      .select()
      .single();

    if (!error && data) {
      setCats([...cats, data]);
      setNewName("");
      setNewSlug("");
    }
    setSaving(false);
  };

  const handleRename = async (catId: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim() })
      .eq("id", catId);

    if (!error) {
      setCats(cats.map((c) => (c.id === catId ? { ...c, name: editName.trim() } : c)));
      setEditingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing categories */}
        <div className="space-y-3 mb-8">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                cat.is_hidden ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FolderOpen className="w-5 h-5 text-gray-400 shrink-0" />
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(cat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleRename(cat.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-gray-900 truncate">{cat.name}</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditName(cat.name);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rename"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleHidden(cat)}
                  className={`p-2 rounded-lg transition-colors ${
                    cat.is_hidden
                      ? "text-gray-400 hover:text-green-600 hover:bg-green-50"
                      : "text-green-600 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={cat.is_hidden ? "Show on website" : "Hide from website"}
                >
                  {cat.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Add New Category
          </h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
              }}
              placeholder="Category name"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-500 font-medium"
            />
            <button
              onClick={handleAddCategory}
              disabled={saving || !newName.trim()}
              className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
          {newSlug && (
            <p className="text-xs text-gray-400 mt-2">
              Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{newSlug}</code>
            </p>
          )}
        </div>

        <button
          onClick={() => {
            onSave();
            onClose();
          }}
          className="w-full mt-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Offers Management Modal ──────────────────────────────────────
function OffersModal({
  onClose,
  onOffersUpdated,
}: {
  onClose: () => void;
  onOffersUpdated: () => void;
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("SPECIAL OFFER");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/products");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadOffers = async () => {
    setLoading(true);
    const data = await fetchOffers();
    setOffers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleStartEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description);
    setBadge(offer.badge || "SPECIAL OFFER");
    setImageUrl(offer.image_url || "");
    setLinkUrl(offer.link_url || "/products");
    setIsActive(offer.is_active);
    setError("");
  };

  const handleResetForm = () => {
    setEditingOffer(null);
    setTitle("");
    setDescription("");
    setBadge("SPECIAL OFFER");
    setImageUrl("");
    setLinkUrl("/products");
    setIsActive(true);
    setError("");
  };

  const handleToggleActive = async (offer: Offer) => {
    const updated = { ...offer, is_active: !offer.is_active };
    await saveOfferToDb(updated);
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
    onOffersUpdated();
  };

  const handleDelete = async (offerId: string) => {
    await deleteOfferFromDb(offerId);
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    if (editingOffer?.id === offerId) handleResetForm();
    onOffersUpdated();
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Offer title is required (e.g. Free Matchbox with Cooking Oil).");
      return;
    }
    if (!description.trim()) {
      setError("Offer description is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: Partial<Offer> = {
        id: editingOffer?.id,
        title: title.trim(),
        description: description.trim(),
        badge: badge.trim() || "SPECIAL OFFER",
        image_url: imageUrl.trim() || null,
        link_url: linkUrl.trim() || "/products",
        is_active: isActive,
      };

      await saveOfferToDb(payload);
      await loadOffers();
      handleResetForm();
      onOffersUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Manage Store Offers & Freebies
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Configure 1+1 offers, free gifts (like matchboxes), and promotional deals shown on website
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Existing Offers List */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Current Website Offers ({offers.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              Loading offers...
            </div>
          ) : offers.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-2xl text-center text-gray-500 text-sm">
              No offers created yet. Use the form below to create your first offer!
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    offer.is_active
                      ? "bg-white border-amber-200/80 shadow-xs"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-2xs flex items-center justify-center">
                      <SafeImage
                        src={offer.image_url}
                        alt={offer.title}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                          {offer.badge || "OFFER"}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{offer.title}</h4>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{offer.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(offer)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-colors ${
                        offer.is_active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                      title={offer.is_active ? "Visible on website" : "Hidden from website"}
                    >
                      {offer.is_active ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-green-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(offer)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit offer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(offer.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Form */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {editingOffer ? "Edit Offer" : "Add New Offer / Freebie"}
            </h3>
            {editingOffer && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                + Add new instead
              </button>
            )}
          </div>

          <form onSubmit={handleSaveOffer} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Matchbox on Cooking Oil"
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Badge Tag (e.g. FREE GIFT, 1+1 FREE)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="FREE GIFT"
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Buy any 1L Cooking Oil or 500g Masala packet and get 1 free Homelite matchbox!"
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Offer Image URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0 shadow-2xs flex items-center justify-center">
                    <SafeImage
                      src={imageUrl}
                      alt="Offer"
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... photo of matchbox or deal"
                    className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Link / Target URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/categories/cooking-essentials or /products"
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded accent-amber-500"
                />
                Show this offer actively on customer homepage
              </label>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-extrabold hover:bg-amber-600 transition-colors flex items-center gap-2 shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {saving ? "Saving..." : editingOffer ? "Update Offer" : "Add Offer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Price Editor ─────────────────────────────────────────
function InlinePriceEditor({
  currentPrice,
  onSave,
}: {
  currentPrice: number;
  onSave: (newPrice: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPrice.toString());

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(currentPrice.toString());
          setEditing(true);
        }}
        className="flex items-center gap-1 font-bold text-gray-900 hover:text-brand-600 transition-colors group"
        title="Click to edit price"
      >
        ₹{currentPrice.toLocaleString("en-IN")}
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 font-bold">₹</span>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 px-2 py-1 border-2 border-brand-400 rounded-lg text-sm font-bold outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const num = parseFloat(value);
            if (num > 0) {
              onSave(num);
              setEditing(false);
            }
          }
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button
        onClick={() => {
          const num = parseFloat(value);
          if (num > 0) {
            onSave(num);
            setEditing(false);
          }
        }}
        className="p-1 text-green-600 hover:bg-green-50 rounded"
      >
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── Main Admin Products Page ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState<"all" | "in" | "out">("all");
  const [sortField, setSortField] = useState<"name" | "price" | "created_at">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Modal states
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined); // undefined = closed
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [splittingProduct, setSplittingProduct] = useState<{ product: Product; varietyId?: string } | null>(null);
  const [mergingProduct, setMergingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authorized) {
          setIsAuthorized(true);
          fetchData();
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

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
        fetchData();
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
    localStorage.removeItem("admin_product_auth");
    localStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_product_auth");
    sessionStorage.removeItem("admin_auth");
    setIsAuthorized(false);
  };

  // ─── Data Fetching ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*, varieties(*), categories(name, slug)").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (productsRes.data) setProducts(productsRes.data.map((p) => parseProductOffers(p)));
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setIsLoading(false);
  }, []);

  // ─── Quick Actions ─────────────────────────────────────────────
  const toggleStock = async (product: Product) => {
    const newStatus = !product.is_in_stock;
    const { error } = await supabase
      .from("products")
      .update({ is_in_stock: newStatus })
      .eq("id", product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_in_stock: newStatus } : p))
      );
      showToast(`${product.name} is now ${newStatus ? "In Stock" : "Out of Stock"}`);
    }
  };

  const toggleVarietyStock = async (variety: Variety, productId: string) => {
    const newStatus = variety.is_in_stock === false ? true : false;
    const { error } = await supabase
      .from("varieties")
      .update({ is_in_stock: newStatus })
      .eq("id", variety.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          return {
            ...p,
            varieties: (p.varieties || []).map((v) =>
              v.id === variety.id ? { ...v, is_in_stock: newStatus } : v
            ),
          };
        })
      );
      showToast(`${variety.label || variety.name} is now ${newStatus ? "In Stock" : "Out of Stock"}`);
    } else {
      showToast(`To persist in database, run supabase/add_variety_stock.sql in Supabase SQL editor`, "error");
    }
  };

  const updatePrice = async (productId: string, newPrice: number) => {
    const { error } = await supabase
      .from("products")
      .update({ price: newPrice })
      .eq("id", productId);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
      );
      showToast(`Price updated to ₹${newPrice}`);
    }
  };

  const deleteProduct = async (product: Product) => {
    // Varieties will cascade-delete since FK has ON DELETE CASCADE (or we delete manually)
    await supabase.from("varieties").delete().eq("product_id", product.id);
    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setDeletingProduct(null);
      showToast(`${product.name} deleted permanently`, "error");
    }
  };

  // ─── Filtering & Sorting ──────────────────────────────────────
  const filteredProducts = products
    .filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !(p.description || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (filterCategory !== "all" && p.category_id !== filterCategory) return false;
      if (filterStock === "in" && !p.is_in_stock) return false;
      if (filterStock === "out" && p.is_in_stock) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "price") cmp = a.price - b.price;
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortAsc ? cmp : -cmp;
    });

  const inStockCount = products.filter((p) => p.is_in_stock).length;
  const outOfStockCount = products.filter((p) => !p.is_in_stock).length;

  // ─── Render ────────────────────────────────────────────────────
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
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-[0.2em]">
              Product Control
            </h1>
            <p className="text-sm text-gray-400 mt-2">Enter your admin passcode to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              placeholder="ENTER THE PASSWORD"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-center text-lg font-bold tracking-widest text-gray-900 placeholder:text-gray-400 transition-all"
            />
            {error && (
              <p className="text-red-500 text-xs font-bold uppercase tracking-wider">{error}</p>
            )}
            <button className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all uppercase tracking-widest text-sm">
              Enter
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-2">
            <Link
              href="/admin/orders"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              → Go to Order Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header ──────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Product Control
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your products, prices, and stock from one place.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/admin/orders"
              className="px-5 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              📦 Orders
            </Link>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-5 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              🗂️ Categories
            </button>
            <button
              onClick={() => setShowOffersModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm text-sm flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Offers & 1+1</span>
            </button>
            <button
              onClick={() => setEditingProduct(null)} // null = add new
              className="px-5 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors shadow-sm text-sm"
              title="Lock Admin Dashboard"
            >
              🔒 Logout
            </button>
          </div>
        </div>

        {/* ─── Stats Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Products</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Varieties</p>
            <p className="text-3xl font-extrabold text-purple-600 mt-1">{products.reduce((sum, p) => sum + (p.varieties?.length || 0), 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">In Stock</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">{inStockCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Out of Stock</p>
            <p className="text-3xl font-extrabold text-red-500 mt-1">{outOfStockCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</p>
            <p className="text-3xl font-extrabold text-brand-600 mt-1">{categories.length}</p>
          </div>
        </div>

        {/* ─── Filters & Search ────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search - matching website style */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or description..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-full outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080] transition-all shadow-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080] text-sm font-medium text-gray-900 min-w-[160px] shadow-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Stock Filter */}
            <div className="flex gap-2">
              {(["all", "in", "out"] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => setFilterStock(val)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                    filterStock === val
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {val === "all" ? "All" : val === "in" ? "In Stock" : "Out of Stock"}
                </button>
              ))}
            </div>

            {/* Sort */}
            <button
              onClick={() => {
                if (sortField === "name") {
                  setSortField("price");
                  setSortAsc(true);
                } else if (sortField === "price") {
                  setSortField("created_at");
                  setSortAsc(false);
                } else {
                  setSortField("name");
                  setSortAsc(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortField === "name" ? "A-Z" : sortField === "price" ? "Price" : "Newest"}
            </button>
          </div>
        </div>

        {/* ─── Results Count ───────────────────────────────── */}
        <p className="text-sm text-gray-400 font-medium mb-4 px-1">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* ─── Products List ───────────────────────────────── */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500 mt-1">Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const categoryName =
                (product as any).categories?.name ||
                categories.find((c) => c.id === product.category_id)?.name ||
                "Uncategorized";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    {/* Left: Stock indicator + Image + Product Details */}
                    <div className="flex items-start sm:items-center gap-3 md:gap-4 flex-1 min-w-0">
                      {/* Stock indicator */}
                      <button
                        onClick={() => toggleStock(product)}
                        className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${
                          product.is_in_stock
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-red-100 text-red-500 hover:bg-red-200"
                        }`}
                        title={product.is_in_stock ? "Click to mark Out of Stock" : "Click to mark In Stock"}
                      >
                        {product.is_in_stock ? (
                          <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </button>

                      {/* Product Thumbnail - Large & High Quality */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden bg-white border-2 border-gray-100 shrink-0 shadow-xs flex items-center justify-center p-1.5">
                        <SafeImage
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-extrabold text-gray-900 truncate text-sm sm:text-base md:text-lg">
                            {product.name}
                          </h3>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              product.is_in_stock
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {product.is_in_stock ? "In Stock" : "Out"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-xs font-bold text-gray-700">
                            {categoryName}
                          </span>
                          {product.weight && (
                            <span className="text-xs text-gray-600 font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              {product.weight}
                            </span>
                          )}
                          {product.offer && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md shadow-2xs">
                              <Gift className="w-3 h-3 text-amber-600 shrink-0" /> {product.offer}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Rate / Price & Action buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2.5 md:pt-0 border-t border-gray-100 md:border-t-0 shrink-0">
                      {/* Price (inline editable) */}
                      <div className="flex items-center gap-1.5 bg-gray-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-xl border border-gray-200/60 md:border-0">
                        <span className="text-[11px] font-bold text-gray-400 md:hidden uppercase tracking-wider">
                          Rate:
                        </span>
                        <div className="font-black text-gray-900 text-base md:text-lg">
                          <InlinePriceEditor
                            currentPrice={product.price}
                            onSave={(newPrice) => updatePrice(product.id, newPrice)}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Split Button */}
                        {product.varieties && product.varieties.length > 1 && (
                          <button
                            onClick={() => setSplittingProduct({ product })}
                            className="p-2 sm:p-2.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors border border-transparent hover:border-teal-200"
                            title="Split / Separate varieties into new product"
                          >
                            <Scissors className="w-4 h-4" />
                          </button>
                        )}
                        {/* Merge Button */}
                        <button
                          onClick={() => setMergingProduct(product)}
                          className="p-2 sm:p-2.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors border border-transparent hover:border-purple-200"
                          title="Merge this product into another master product"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 sm:p-2.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors border border-transparent hover:border-brand-200"
                          title="Edit product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-2 sm:p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ─── Varieties Section (always visible) ─── */}
                  {product.varieties && product.varieties.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50/70 p-4 md:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Varieties & Sizes ({product.varieties.length})
                        </p>
                        {product.varieties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSplittingProduct({ product })}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition-colors bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 shadow-2xs"
                            title="Split varieties into separate products"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Split / Separate</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {product.varieties.map((v) => (
                          <div
                            key={v.id}
                            className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                              v.is_in_stock !== false
                                ? "bg-white border-gray-200 hover:border-gray-300 shadow-xs"
                                : "bg-red-50/40 border-red-200"
                            }`}
                          >
                            {/* Variety Photo: Much larger, 56x56 px */}
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-2xs flex items-center justify-center p-1">
                              <SafeImage
                                src={v.image_url || product.image_url}
                                alt={v.label || v.name}
                                fill
                                className="object-contain p-0.5"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-gray-900 text-sm truncate">
                                  {v.label || v.name}
                                </span>
                                {v.weight && (
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {v.weight}
                                  </span>
                                )}
                              </div>
                              <p className="font-extrabold text-emerald-700 text-sm mb-1">
                                ₹{v.price.toLocaleString("en-IN")}
                              </p>
                              {v.offer && (
                                <div className="mb-1.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded max-w-full truncate" title={v.offer}>
                                    <Gift className="w-2.5 h-2.5 text-amber-600 shrink-0" /> {v.offer}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => toggleVarietyStock(v, product.id)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border ${
                                    v.is_in_stock !== false
                                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  }`}
                                  title={v.is_in_stock !== false ? "In Stock" : "Out of Stock"}
                                >
                                  {v.is_in_stock !== false ? (
                                    <>
                                      <ToggleRight className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      <span>In Stock</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                      <span>Out</span>
                                    </>
                                  )}
                                </button>
                                {product.varieties && product.varieties.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setSplittingProduct({ product, varietyId: v.id })}
                                    className="p-1 text-gray-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
                                    title={`Separate "${v.label || v.name}" into a new product`}
                                  >
                                    <Scissors className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────────────────── */}
      {editingProduct !== undefined && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onSave={() => {
            setEditingProduct(undefined);
            fetchData();
            showToast(editingProduct ? "Product updated!" : "Product added!");
          }}
          onClose={() => setEditingProduct(undefined)}
        />
      )}

      {splittingProduct && (
        <SplitProductModal
          product={splittingProduct.product}
          initialVarietyId={splittingProduct.varietyId}
          categories={categories}
          onSave={(newName, count) => {
            setSplittingProduct(null);
            fetchData();
            showToast(`Product split! Created "${newName}" with ${count} ${count === 1 ? "variety" : "varieties"}.`);
          }}
          onClose={() => setSplittingProduct(null)}
        />
      )}

      {mergingProduct && (
        <MergeProductsModal
          sourceProduct={mergingProduct}
          allProducts={products}
          onSave={(targetName) => {
            setMergingProduct(null);
            fetchData();
            showToast(`Successfully merged "${mergingProduct.name}" into "${targetName}"!`);
          }}
          onClose={() => setMergingProduct(null)}
        />
      )}

      {showOffersModal && (
        <OffersModal
          onClose={() => setShowOffersModal(false)}
          onOffersUpdated={() => {
            showToast("Offers updated successfully!");
          }}
        />
      )}

      {deletingProduct && (
        <DeleteModal
          productName={deletingProduct.name}
          onConfirm={() => deleteProduct(deletingProduct)}
          onCancel={() => setDeletingProduct(null)}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onSave={() => fetchData()}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* ─── Toast Notification ──────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}
    </main>
  );
}
