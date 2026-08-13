"use client";

import { useEffect, useMemo, useState } from "react";

type AdminInfo = {
  email: string;
  role: string;
};

type Product = {
  id: string | number;
  sku: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  discount_enabled: number;
  discount_percentage: number;
  featured: number;
  best_seller: number;
  is_new: number;
  visible: number;
  stock: number;
  category_id: string | number | null;
  image: string;
  sort_order: number;
  tags: string;
  category_name?: string;
};

type Category = {
  id: string | number;
  name: string;
  slug: string;
  image: string;
  visible: number;
  sort_order: number;
};

type MediaItem = {
  id: string | number;
  url: string;
  filename: string;
  type: string;
};

type Order = {
  id: string | number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  created_at: string;
};

type Customer = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  orders_count: number;
  total_spent: number;
  last_order_at: string;
};

type CryptoPayment = {
  id: string | number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  amount: number;
  currency: string;
  network: string;
  tx_hash: string;
  status: string;
  binance_order_id: string;
  created_at: string;
  verified_at: string;
};

const sectionNames = [
  "overview",
  "products",
  "categories",
  "homepage",
  "media",
  "orders",
  "crypto",
  "customers",
  "settings",
];

export default function AdminPanel({ admin }: { admin: AdminInfo }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cryptoPayments, setCryptoPayments] = useState<CryptoPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({ visible: 1, discount_enabled: 0, featured: 0, best_seller: 0, is_new: 0, stock: 0, sort_order: 0 });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({ visible: 1, sort_order: 0 });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [siteForm, setSiteForm] = useState({
    website_name: "",
    contact_whatsapp: "",
    contact_phone: "",
    contact_email: "",
    facebook_url: "",
    instagram_url: "",
    telegram_url: "",
    currency: "",
    usdt_rate: "50",
    footer_text: "",
    seo_title: "",
    seo_description: "",
    hero_title: "",
    hero_description: "",
    hero_image: "",
    hero_button_text: "",
    hero_button_url: "",
  });

  const visibleProducts = useMemo(() => products.filter((item) => item.visible === 1), [products]);
  const hiddenProducts = useMemo(() => products.filter((item) => item.visible === 0), [products]);

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, productsRes, categoriesRes, settingsRes, mediaRes, ordersRes, customersRes, cryptoRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/media"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/customers"),
        fetch("/api/admin/crypto-payments"),
      ]);

      if (!dashboardRes.ok || !productsRes.ok || !categoriesRes.ok || !settingsRes.ok || !mediaRes.ok || !ordersRes.ok || !customersRes.ok) {
        throw new Error("Unable to load admin data.");
      }

      setDashboard(await dashboardRes.json());
      setProducts(await productsRes.json());
      setCategories(await categoriesRes.json());
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      setMedia(await mediaRes.json());
      setOrders(await ordersRes.json());
      setCustomers(await customersRes.json());
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        setCryptoPayments(cryptoData.payments || []);
      }

      setSiteForm((prev) => ({
        ...prev,
        website_name: settingsData.website_name || "",
        contact_whatsapp: settingsData.contact_whatsapp || "",
        contact_phone: settingsData.contact_phone || "",
        contact_email: settingsData.contact_email || "",
        facebook_url: settingsData.facebook_url || "",
        instagram_url: settingsData.instagram_url || "",
        telegram_url: settingsData.telegram_url || "",
        currency: settingsData.currency || "",
        footer_text: settingsData.footer_text || "",
        seo_title: settingsData.seo_title || "",
        seo_description: settingsData.seo_description || "",
        hero_title: settingsData.hero_title || "",
        hero_description: settingsData.hero_description || "",
        hero_image: settingsData.hero_image || "",
        hero_button_text: settingsData.hero_button_text || "",
        hero_button_url: settingsData.hero_button_url || "",
      }));
    } catch (err) {
      console.error(err);
      setError("Unable to load admin dashboard. Please refresh or login again.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function saveProduct() {
    if (!productForm.sku || !productForm.name) {
      setError("Product SKU and name are required.");
      return;
    }
    const response = await fetch("/api/admin/products", {
      method: editingProduct ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingProduct?.id,
        sku: productForm.sku,
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price || 0),
        original_price: Number(productForm.original_price || 0),
        discount_enabled: productForm.discount_enabled ? 1 : 0,
        discount_percentage: Number(productForm.discount_percentage || 0),
        featured: productForm.featured ? 1 : 0,
        best_seller: productForm.best_seller ? 1 : 0,
        is_new: productForm.is_new ? 1 : 0,
        visible: productForm.visible ? 1 : 0,
        stock: Number(productForm.stock || 0),
        category_id: productForm.category_id,
        image: productForm.image,
        sort_order: Number(productForm.sort_order || 0),
        tags: productForm.tags,
      }),
    });
    if (response.ok) {
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ visible: 1, discount_enabled: 0, featured: 0, best_seller: 0, is_new: 0, stock: 0, sort_order: 0 });
      refreshAll();
    } else {
      const data = await response.json();
      setError(data.error || "Failed to save product.");
    }
  }

  async function deleteProduct(productId: string | number) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId }),
    });
    refreshAll();
  }

  async function duplicateProduct(product: Product) {
    const clone = { ...product, sku: `${product.sku}-${Date.now()}` };
    await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...clone,
        visible: clone.visible,
        discount_enabled: clone.discount_enabled,
      }),
    });
    refreshAll();
  }

  async function toggleVisibility(product: Product) {
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, visible: product.visible ? 0 : 1 }),
    });
    refreshAll();
  }

  async function saveCategory() {
    if (!categoryForm.name || !categoryForm.slug) {
      setError("Category name and slug are required.");
      return;
    }
    const method = categoryForm.id ? "PUT" : "POST";
    await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    setShowCategoryModal(false);
    setCategoryForm({ visible: 1, sort_order: 0 });
    refreshAll();
  }

  async function deleteCategory(categoryId: string | number) {
    if (!confirm("Delete this category?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryId }),
    });
    refreshAll();
  }

  async function uploadMedia() {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadedFile);
    const response = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      setUploadedFile(null);
      setUploadError("");
      refreshAll();
    } else {
      const data = await response.json();
      setUploadError(data.error || "Upload failed.");
    }
  }

  async function deleteMedia(mediaItem: MediaItem) {
    if (!confirm("Delete this media file?")) return;
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mediaItem.id }),
    });
    refreshAll();
  }

  async function updateOrderStatus(orderId: string | number, status: string) {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    refreshAll();
  }

  async function updateCryptoStatus(paymentId: string | number, status: string) {
    await fetch("/api/admin/crypto-payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: paymentId, status }),
    });
    refreshAll();
  }

  async function verifyCryptoPaymentAdmin(orderId: string, txHash?: string) {
    try {
      const res = await fetch("/api/public/crypto/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, txHash }),
      });
      const data = await res.json();
      if (data.verified) {
        alert("✓ تم التحقق بنجاح وتأكيد الدفع من بينانس!");
      } else {
        alert(data.message || "لم يتم العثور على إيداع مطابق في بينانس حتى الآن.");
      }
      refreshAll();
    } catch (err: any) {
      alert("خطأ أثناء التحقق: " + err.message);
    }
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteForm),
    });
    refreshAll();
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">AI STORE CMS</h1>
            <p className="mt-1 text-sm text-slate-400">Signed in as <span className="font-semibold text-amber-300">{admin.email}</span> ({admin.role}).</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={logout} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400">
              Logout
            </button>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400 shadow-inner shadow-black/10">Current section: {activeSection}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">Use this dashboard to manage your live website data without editing source code.</div>
            <nav className="space-y-2">
              {sectionNames.map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${activeSection === section ? "bg-amber-500 text-slate-950" : "bg-slate-950/80 text-slate-300 hover:bg-slate-800/80"}`}
                >
                  {section.replace(/-/g, " ")}
                </button>
              ))}
            </nav>
          </aside>

          <section className="space-y-6">
            {loading && <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-slate-300">Loading dashboard data…</div>}
            {error ? <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div> : null}

            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total products", value: dashboard?.totalProducts ?? 0 },
                    { label: "Active products", value: dashboard?.activeProducts ?? 0 },
                    { label: "Hidden products", value: dashboard?.hiddenProducts ?? 0 },
                    { label: "Total customers", value: dashboard?.totalCustomers ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-lg shadow-black/10">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                      <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-lg shadow-black/10">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Sales</p>
                    <p className="mt-4 text-3xl font-semibold text-amber-300">{dashboard?.totalSales ?? 0} {settings.currency || "ج.م"}</p>
                    <p className="mt-2 text-sm text-slate-400">Recent orders and performance at a glance.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-lg shadow-black/10">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">New orders</p>
                    <p className="mt-4 text-3xl font-semibold text-white">{dashboard?.newOrders ?? 0}</p>
                    <p className="mt-2 text-sm text-slate-400">Orders waiting for review or fulfillment.</p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-lg shadow-black/10">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Recent orders</h2>
                    </div>
                    <div className="space-y-3">
                      {dashboard?.recentOrders?.length ? dashboard.recentOrders.map((order: any) => (
                        <div key={order.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-slate-400">Order #{order.id}</p>
                              <p className="text-base font-semibold text-white">{order.customer_name || "Guest"}</p>
                            </div>
                            <p className="text-sm text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                            <span>Status: {order.status}</span>
                            <span>Total: {order.total} {settings.currency || "ج.م"}</span>
                          </div>
                        </div>
                      )) : <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-500">No recent orders found.</div>}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-lg shadow-black/10">
                    <h2 className="text-lg font-semibold text-white">Top selling products</h2>
                    <div className="mt-4 space-y-3">
                      {dashboard?.bestSellingProducts?.length ? dashboard.bestSellingProducts.map((item: any) => (
                        <div key={item.name} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-sm text-slate-400">Sold: {item.sold}</p>
                        </div>
                      )) : <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-500">No sales data yet.</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white">Products</h2>
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-bold text-amber-400">
                        {products.length} Products
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">Add, edit, duplicate, and manage your complete product catalog.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => { setEditingProduct(null); setProductForm({ visible: 1, discount_enabled: 0, featured: 0, best_seller: 0, is_new: 0, stock: 0, sort_order: 0 }); setShowProductModal(true); }} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400">+ Add product</button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
                  <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] gap-px bg-slate-800 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <span>Product</span>
                    <span>Price</span>
                    <span>Category</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {products.map((product) => (
                      <div key={product.id} className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] items-center gap-px bg-slate-950 px-4 py-4 text-sm text-slate-300 hover:bg-slate-900/50 transition">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-11 h-11 object-contain rounded-xl bg-black/60 p-1 border border-slate-800 flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold flex-shrink-0">IMG</div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{product.name}</p>
                            <p className="text-xs text-slate-500 truncate">{product.sku}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-amber-400">{product.price} {settings.currency || "ج.م"}</p>
                          {product.discount_enabled ? <p className="text-xs text-emerald-300">-{product.discount_percentage}% off</p> : null}
                        </div>
                        <div>
                          <span className="inline-block rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                            {product.category_name || "General"}
                          </span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            product.visible ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${product.visible ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                            {product.visible ? "Visible" : "Hidden"}
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductModal(true); }} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">Edit</button>
                          <button onClick={() => duplicateProduct(product)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">Copy</button>
                          <button onClick={() => deleteProduct(product.id)} className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20">Delete</button>
                          <button onClick={() => toggleVisibility(product)} className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20">{product.visible ? "Hide" : "Show"}</button>
                        </div>
                      </div>
                    ))}
                    {!products.length && <div className="p-8 text-center text-slate-500">No products available yet.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "categories" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Categories</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage category names, images, order, and visibility.</p>
                  </div>
                  <button onClick={() => { setCategoryForm({ visible: 1, sort_order: 0 }); setShowCategoryModal(true); }} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400">Add category</button>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
                  <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                    {categories.map((category) => (
                      <div key={category.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                        <p className="font-semibold text-white">{category.name}</p>
                        <p className="text-xs text-slate-500">{category.slug}</p>
                        <p className="mt-2 text-xs text-slate-400">Order: {category.sort_order}</p>
                        <p className="text-xs text-slate-400">{category.visible ? "Visible" : "Hidden"}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button onClick={() => { setCategoryForm(category); setShowCategoryModal(true); }} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">Edit</button>
                          <button onClick={() => deleteCategory(category.id)} className="rounded-2xl border border-rose-500 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20">Delete</button>
                        </div>
                      </div>
                    ))}
                    {!categories.length && <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-500">No categories available.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "homepage" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Homepage content</h2>
                      <p className="mt-1 text-sm text-slate-400">Edit hero text, banner links, and featured homepage content.</p>
                    </div>
                    <button onClick={refreshAll} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Refresh content</button>
                  </div>
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-300">Hero title</label>
                        <input value={siteForm.hero_title} onChange={(e) => setSiteForm({ ...siteForm, hero_title: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300">Hero description</label>
                        <textarea value={siteForm.hero_description} onChange={(e) => setSiteForm({ ...siteForm, hero_description: e.target.value })} className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500 min-h-[120px]" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm text-slate-300">Button text</label>
                          <input value={siteForm.hero_button_text} onChange={(e) => setSiteForm({ ...siteForm, hero_button_text: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300">Button URL</label>
                          <input value={siteForm.hero_button_url} onChange={(e) => setSiteForm({ ...siteForm, hero_button_url: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-300">Hero image URL</label>
                        <input value={siteForm.hero_image} onChange={(e) => setSiteForm({ ...siteForm, hero_image: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
                      </div>
                      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-sm text-slate-400">Preview</p>
                        <div className="mt-3 h-48 overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800">
                          {siteForm.hero_image ? <img src={siteForm.hero_image} alt="Hero preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Hero image URL will preview here.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-400">Settings are saved directly to the live website content.</div>
                    <button onClick={saveSettings} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">Save homepage settings</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "media" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Media library</h2>
                      <p className="mt-1 text-sm text-slate-400">Upload and manage images used across the site.</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                      <label className="block text-sm text-slate-300">Upload media file</label>
                      <input type="file" accept="image/*" onChange={(event) => setUploadedFile(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none" />
                      <button onClick={uploadMedia} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">Upload</button>
                      {uploadError ? <p className="text-sm text-rose-300">{uploadError}</p> : null}
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                      <p className="font-semibold text-slate-100">Upload guidelines</p>
                      <p className="mt-2">Files are stored in <code className="rounded bg-slate-900 px-1 py-0.5">/public/uploads</code> and can be used directly in product or hero image fields.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {media.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-lg">
                      <div className="h-40 bg-slate-900/70">
                        <img src={item.url} alt={item.filename} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="text-sm font-semibold text-white truncate">{item.filename}</p>
                        <p className="text-xs text-slate-500">{item.type}</p>
                        <button onClick={() => deleteMedia(item)} className="mt-3 w-full rounded-2xl bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20">Delete</button>
                      </div>
                    </div>
                  ))}
                  {!media.length && <div className="col-span-full rounded-3xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center text-slate-500">No media uploaded yet.</div>}
                </div>
              </div>
            )}

            {activeSection === "orders" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Orders</h2>
                      <p className="mt-1 text-sm text-slate-400">Review customer orders and update status.</p>
                    </div>
                    <button onClick={refreshAll} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Refresh orders</button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr] gap-px bg-slate-800 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <span>Customer</span>
                    <span>Email</span>
                    <span>Phone</span>
                    <span>Status</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {orders.map((order) => (
                      <div key={order.id} className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr] items-center gap-px bg-slate-950 px-4 py-4 text-sm text-slate-300">
                        <div>
                          <p className="font-semibold text-white">{order.customer_name || "Guest"}</p>
                          <p className="text-xs text-slate-500">#{order.id} · {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>{order.customer_email || "—"}</div>
                        <div>{order.customer_phone || "—"}</div>
                        <div>
                          <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="rounded-2xl bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none border border-slate-700">
                            {['pending','confirmed','processing','completed','cancelled'].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div className="text-right font-semibold text-white">{order.total} {settings.currency || "ج.م"}</div>
                      </div>
                    ))}
                    {!orders.length && <div className="p-6 text-center text-slate-500">No orders yet.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "crypto" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <span>مدفوعات الكريبتو / Binance Pay</span>
                        <span className="rounded-full bg-amber-500/20 text-amber-300 text-xs px-3 py-1 font-mono">Live API</span>
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">متابعة طلبات الدفع عبر USDT والتحقق التلقائي واليدوي من منصة بينانس.</p>
                    </div>
                    <button onClick={refreshAll} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                      تحديث المدفوعات
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
                  <div className="grid grid-cols-[1.5fr_1.2fr_1fr_1.2fr_1fr_1.2fr] gap-px bg-slate-800 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-400 text-right" dir="rtl">
                    <span>رقم الطلب / العميل</span>
                    <span>المنتج</span>
                    <span>المبلغ / الشبكة</span>
                    <span>معرف المعاملة (TxID)</span>
                    <span>الحالة</span>
                    <span className="text-left">إجراءات</span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {cryptoPayments.map((p) => (
                      <div key={p.id} className="grid grid-cols-[1.5fr_1.2fr_1fr_1.2fr_1fr_1.2fr] items-center gap-px bg-slate-950 px-4 py-4 text-sm text-slate-300 text-right" dir="rtl">
                        <div>
                          <p className="font-semibold text-white font-mono text-xs">{p.order_id}</p>
                          <p className="text-xs text-slate-400">{p.customer_name} {p.customer_phone ? `(${p.customer_phone})` : ""}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{new Date(p.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-xs font-medium text-amber-200 truncate">{p.product_name || "منتج AI"}</div>
                        <div>
                          <span className="font-bold text-white font-mono">{p.amount} {p.currency}</span>
                          <span className="block text-[11px] text-slate-500">{p.network}</span>
                        </div>
                        <div className="truncate font-mono text-xs text-slate-400">
                          {p.tx_hash ? (
                            <span className="truncate block title={p.tx_hash}">{p.tx_hash.slice(0, 10)}...{p.tx_hash.slice(-6)}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            p.status === "completed" || p.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : p.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}>
                            {p.status === "completed" || p.status === "paid" ? "✓ مؤكد ومستلم" : p.status === "pending" ? "قيد الانتظار" : p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 justify-end" dir="ltr">
                          <button
                            onClick={() => verifyCryptoPaymentAdmin(p.order_id, p.tx_hash)}
                            title="التحقق المباشر من بينانس"
                            className="rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-bold transition"
                          >
                            ⚡ فحص بينانس
                          </button>
                          <select
                            value={p.status}
                            onChange={(e) => updateCryptoStatus(p.id, e.target.value)}
                            className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-300 outline-none"
                          >
                            <option value="pending">pending</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {!cryptoPayments.length && <div className="p-6 text-center text-slate-500">لا توجد مدفوعات كريبتو حتى الآن.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "customers" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Customers</h2>
                      <p className="mt-1 text-sm text-slate-400">View customer data, purchases and order history.</p>
                    </div>
                    <button onClick={refreshAll} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Refresh customers</button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-px bg-slate-800 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Total spent</span>
                    <span className="text-right">Orders</span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {customers.map((customer) => (
                      <div key={customer.id} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-px bg-slate-950 px-4 py-4 text-sm text-slate-300">
                        <div>
                          <p className="font-semibold text-white">{customer.name || "Anonymous"}</p>
                          <p className="text-xs text-slate-500">{customer.phone || "—"}</p>
                        </div>
                        <div>{customer.email || "—"}</div>
                        <div className="font-semibold text-white">{customer.total_spent} {settings.currency || "ج.م"}</div>
                        <div className="text-right text-slate-400">{customer.orders_count}</div>
                      </div>
                    ))}
                    {!customers.length && <div className="p-6 text-center text-slate-500">No customers available.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "settings" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <h2 className="text-2xl font-semibold text-white">Website settings</h2>
                  <p className="mt-2 text-sm text-slate-400">Update contact details, SEO, social links, and brand settings.</p>

                  <form onSubmit={saveSettings} className="mt-6 grid gap-4 md:grid-cols-2">
                    {[
                      { label: "Website name", key: "website_name" },
                      { label: "WhatsApp URL", key: "contact_whatsapp" },
                      { label: "Phone number", key: "contact_phone" },
                      { label: "Email address", key: "contact_email" },
                      { label: "Facebook URL", key: "facebook_url" },
                      { label: "Instagram URL", key: "instagram_url" },
                      { label: "Telegram URL", key: "telegram_url" },
                      { label: "Currency label", key: "currency" },
                      { label: "USDT Exchange Rate (سعر صرف 1 دولار USDT بالعملة)", key: "usdt_rate" },
                      { label: "Footer text", key: "footer_text", area: true },
                      { label: "SEO title", key: "seo_title" },
                      { label: "SEO description", key: "seo_description", area: true },
                    ].map(({ label, key, area }) => (
                      <div key={key}>
                        <label className="block text-sm text-slate-300">{label}</label>
                        {area ? (
                          <textarea value={(siteForm as any)[key]} onChange={(e) => setSiteForm({ ...siteForm, [key]: e.target.value })} className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500 min-h-[100px]" />
                        ) : (
                          <input value={(siteForm as any)[key]} onChange={(e) => setSiteForm({ ...siteForm, [key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
                        )}
                      </div>
                    ))}
                    <div className="md:col-span-2 flex justify-end">
                      <button type="submit" className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">Save website settings</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showProductModal && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/60">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{editingProduct ? "Edit product" : "New product"}</h3>
                <p className="text-sm text-slate-400">Update product details, prices, and inventory data.</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800">Close</button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                { label: "SKU", key: "sku", type: "text" },
                { label: "Name", key: "name", type: "text" },
                { label: "Price", key: "price", type: "number" },
                { label: "Original price", key: "original_price", type: "number" },
                { label: "Discount %", key: "discount_percentage", type: "number" },
                { label: "Stock", key: "stock", type: "number" },
                { label: "Sort order", key: "sort_order", type: "number" },
                { label: "Image URL", key: "image", type: "text" },
                { label: "Tags", key: "tags", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm text-slate-300">{label}</label>
                  <input
                    type={type}
                    value={(productForm as any)[key] ?? ""}
                    onChange={(event) => setProductForm({ ...productForm, [key]: type === "number" ? Number(event.target.value) : event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Category</p>
                <select value={productForm.category_id ?? ""} onChange={(event) => setProductForm({ ...productForm, category_id: event.target.value || null })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500">
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Flags</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { label: "Visible", key: "visible" },
                    { label: "Featured", key: "featured" },
                    { label: "Best seller", key: "best_seller" },
                    { label: "New", key: "is_new" },
                    { label: "Discount enabled", key: "discount_enabled" },
                  ].map(({ label, key }) => (
                    <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                      <input type="checkbox" checked={Boolean((productForm as any)[key])} onChange={(event) => setProductForm({ ...productForm, [key]: event.target.checked ? 1 : 0 })} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-400" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowProductModal(false)} className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Cancel</button>
              <button onClick={saveProduct} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">Save product</button>
            </div>
          </div>
        </dialog>
      )}

      {showCategoryModal && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/60">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{categoryForm.id ? "Edit category" : "New category"}</h3>
                <p className="text-sm text-slate-400">Add or update category content for the storefront.</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800">Close</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300">Name</label>
                <input value={categoryForm.name || ""} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Slug</label>
                <input value={categoryForm.slug || ""} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Image URL</label>
                <input value={categoryForm.image || ""} onChange={(event) => setCategoryForm({ ...categoryForm, image: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Sort order</label>
                <input type="number" value={categoryForm.sort_order ?? 0} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={Boolean(categoryForm.visible)} onChange={(event) => setCategoryForm({ ...categoryForm, visible: event.target.checked ? 1 : 0 })} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-400" />
                Visible
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowCategoryModal(false)} className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Cancel</button>
              <button onClick={saveCategory} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">Save category</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
