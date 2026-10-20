"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2, Search, Package, Plus, Pencil, Trash2, Check, X,
  ToggleLeft, ToggleRight, ChevronDown, ArrowUpDown,
  ShoppingBag, AlertTriangle, Eye, EyeOff, FolderOpen, IndianRupee
} from "lucide-react";
import { Product, Category, Variety } from "@/types/database";
import Link from "next/link";

const ADMIN_PRODUCT_PASSCODE = "2218";

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
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [weight, setWeight] = useState(product?.weight || "");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || categories[0]?.id || "");
  const [isInStock, setIsInStock] = useState(product?.is_in_stock ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Varieties management
  const [varieties, setVarieties] = useState<Variety[]>(product?.varieties || []);
  const [showVarieties, setShowVarieties] = useState((product?.varieties?.length || 0) > 0);

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
      },
    ]);
  };

  const updateVariety = (index: number, field: keyof Variety, value: string | number) => {
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
      if (isEditing && product) {
        // Update product
        const { error: updateErr } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            price: parseFloat(price),
            weight: weight.trim() || null,
            image_url: imageUrl.trim() || null,
            category_id: categoryId,
            is_in_stock: isInStock,
          })
          .eq("id", product.id);

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
          if (v.id.startsWith("new-")) {
            await supabase.from("varieties").insert({
              product_id: product.id,
              name: v.name,
              label: v.label,
              price: v.price,
              weight: v.weight || null,
              image_url: v.image_url || null,
            });
          } else {
            await supabase
              .from("varieties")
              .update({
                name: v.name,
                label: v.label,
                price: v.price,
                weight: v.weight || null,
                image_url: v.image_url || null,
              })
              .eq("id", v.id);
          }
        }
      } else {
        // Insert new product
        const { data: newProduct, error: insertErr } = await supabase
          .from("products")
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            price: parseFloat(price),
            weight: weight.trim() || null,
            image_url: imageUrl.trim() || null,
            category_id: categoryId,
            is_in_stock: isInStock,
          })
          .select()
          .single();

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
          }));
          await supabase.from("varieties").insert(varietyData);
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

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... or Supabase storage URL"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none text-gray-900 text-sm"
            />
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Varieties / Sizes
              </label>
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
                  <div key={v.id} className="p-4 bg-white rounded-xl border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Variety #{idx + 1}</span>
                      <button
                        onClick={() => removeVariety(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariety(idx, "name", e.target.value)}
                        placeholder="Name (e.g. Small)"
                        className="px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                      />
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) => updateVariety(idx, "label", e.target.value)}
                        placeholder="Label (e.g. 250g)"
                        className="px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                      />
                      <input
                        type="number"
                        value={v.price || ""}
                        onChange={(e) => updateVariety(idx, "price", parseFloat(e.target.value) || 0)}
                        placeholder="Price ₹"
                        className="px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                      />
                      <input
                        type="text"
                        value={v.weight || ""}
                        onChange={(e) => updateVariety(idx, "weight", e.target.value)}
                        placeholder="Weight (e.g. 250g)"
                        className="px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={v.image_url || ""}
                      onChange={(e) => updateVariety(idx, "image_url", e.target.value)}
                      placeholder="Variety image URL (optional)"
                      className="mt-3 w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#008080] focus:bg-white"
                    />
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_product_auth");
    if (saved === "true") {
      setIsAuthorized(true);
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PRODUCT_PASSCODE) {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_product_auth", "true");
      fetchData();
    } else {
      setError("Incorrect Passcode. Access Denied.");
    }
  };

  // ─── Data Fetching ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*, varieties(*), categories(name, slug)").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
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
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-center text-lg font-bold tracking-widest transition-all"
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
              onClick={() => setEditingProduct(null)} // null = add new
              className="px-5 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
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
                  <div className="p-4 md:p-5 flex items-center gap-4">
                    {/* Stock indicator */}
                    <button
                      onClick={() => toggleStock(product)}
                      className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        product.is_in_stock
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-red-100 text-red-500 hover:bg-red-200"
                      }`}
                      title={product.is_in_stock ? "Click to mark Out of Stock" : "Click to mark In Stock"}
                    >
                      {product.is_in_stock ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            product.is_in_stock
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {product.is_in_stock ? "In Stock" : "Out"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                          {categoryName}
                        </span>
                        {product.weight && (
                          <span className="text-xs">{product.weight}</span>
                        )}
                      </div>
                    </div>

                    {/* Price (inline editable) */}
                    <div className="shrink-0 text-right">
                      <InlinePriceEditor
                        currentPrice={product.price}
                        onSave={(newPrice) => updatePrice(product.id, newPrice)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-3 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                        title="Edit product"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ─── Varieties Section (always visible) ─── */}
                  {product.varieties && product.varieties.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 md:px-5 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Varieties ({product.varieties.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.varieties.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
                          >
                            <span className="font-semibold text-gray-700">{v.label || v.name}</span>
                            {v.weight && (
                              <span className="text-gray-400">{v.weight}</span>
                            )}
                            <span className="font-bold text-gray-900">₹{v.price.toLocaleString("en-IN")}</span>
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
