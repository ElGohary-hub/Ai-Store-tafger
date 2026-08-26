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
  sales_count?: number;
  fake_sales_count?: number;
  long_description?: string;
  warranty?: string;
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



type Order = {
  id: string | number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  metadata?: string;
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
  explorer_url?: string;
  created_at: string;
  verified_at: string;
  // Payment audit fields
  payment_status: "exact" | "underpaid" | "overpaid" | null;
  actual_amount: number | null;
  expected_amount: number;
  amount_difference: number | null;
  refund_required: boolean;
};

type InstaPayment = {
  id: string | number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  product_id: string;
  product_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  receipt_url: string;
  status: string;
  created_at: string;
  confirmed_at?: string;
};

const sectionList = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "categories", label: "Categories", icon: "🗂️" },
  { id: "orders", label: "Orders", icon: "🛍️" },
  { id: "crypto", label: "Crypto / Binance", icon: "⚡" },
  { id: "instapay", label: "InstaPay / فودافون", icon: "💸" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function formatNumber(val: any): string {
  const num = Number(val || 0);
  if (isNaN(num)) return "0";
  // Round to max 2 decimals and format cleanly (e.g. 5.9 instead of 5.8999999999999995)
  return Number(num.toFixed(2)).toLocaleString();
}

function PaymentAuditBadge({ p }: { p: CryptoPayment }) {
  if (!p || (!p.payment_status && p.actual_amount == null)) return null;
  const ps = p.payment_status;
  const diff = typeof p.amount_difference === "number" ? Math.abs(p.amount_difference) : 0;

  if (ps === "exact") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        ✓ مبلغ صحيح
      </span>
    );
  }
  if (ps === "underpaid") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30" title={`دفع ${p.actual_amount} من أصل ${p.expected_amount ?? p.amount} USDT`}>
        ⬇ نقص {diff.toFixed(4)} USDT
      </span>
    );
  }
  if (ps === "overpaid") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30" title={`دفع ${p.actual_amount} من أصل ${p.expected_amount ?? p.amount} USDT`}>
        ⬆ زائد {diff.toFixed(4)} USDT — يحتاج استرداد
      </span>
    );
  }
  return null;
}

export default function AdminPanel({ admin }: { admin: AdminInfo }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const [dashboard, setDashboard] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cryptoPayments, setCryptoPayments] = useState<CryptoPayment[]>([]);
  const [instapayPayments, setInstapayPayments] = useState<InstaPayment[]>([]);
  const [instapayFilter, setInstapayFilter] = useState<"pending" | "confirmed" | "rejected" | "all">("pending");
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({ 
    visible: 1, 
    discount_enabled: 0, 
    featured: 0, 
    best_seller: 0, 
    is_new: 0, 
    stock: 0, 
    sort_order: 0,
    sales_count: 0,
    fake_sales_count: 0,
    long_description: "",
    description: "",
    warranty: "",
  });
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({ visible: 1, sort_order: 0 });
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [productImageError, setProductImageError] = useState("");
  const [cryptoFilter, setCryptoFilter] = useState<"all" | "completed" | "underpaid" | "pending">("all");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }

  function promptConfirm({
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    type = "danger",
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }) {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
    });
  }

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
    hero_button_message: "",
    hero_button2_text: "",
    hero_button2_url: "",
    hero_button2_message: "",
  });

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        !productSearch ||
        item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (item.tags && item.tags.toLowerCase().includes(productSearch.toLowerCase()));
      
      const matchesCategory =
        selectedCategoryFilter === "all" ||
        String(item.category_id) === String(selectedCategoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategoryFilter]);

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, productsRes, categoriesRes, settingsRes, ordersRes, customersRes, cryptoRes, instapayRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/customers"),
        fetch("/api/admin/crypto-payments"),
        fetch("/api/admin/instapay-payments"),
      ]);

      if (!dashboardRes.ok || !productsRes.ok || !categoriesRes.ok || !settingsRes.ok || !ordersRes.ok || !customersRes.ok) {
        throw new Error("Unable to load admin data.");
      }

      setDashboard(await dashboardRes.json());
      setProducts(await productsRes.json());
      setCategories(await categoriesRes.json());
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      setOrders(await ordersRes.json());
      setCustomers(await customersRes.json());
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        setCryptoPayments(cryptoData.payments || []);
      }
      if (instapayRes && instapayRes.ok) {
        const instaData = await instapayRes.json();
        setInstapayPayments(instaData.payments || []);
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
        usdt_rate: settingsData.usdt_rate || "50",
        footer_text: settingsData.footer_text || "",
        seo_title: settingsData.seo_title || "",
        seo_description: settingsData.seo_description || "",
        hero_title: settingsData.hero_title || "",
        hero_description: settingsData.hero_description || "",
        hero_image: settingsData.hero_image || "",
        hero_button_text: settingsData.hero_button_text || "",
        hero_button_url: settingsData.hero_button_url || "",
        hero_button_message: settingsData.hero_button_message || "",
        hero_button2_text: settingsData.hero_button2_text || "",
        hero_button2_url: settingsData.hero_button2_url || "",
        hero_button2_message: settingsData.hero_button2_message || "",
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
        sales_count: Number(productForm.sales_count || 0),
        fake_sales_count: Number(productForm.fake_sales_count || 0),
        long_description: productForm.long_description || productForm.description || "",
        warranty: productForm.warranty || "",
      }),
    });
    if (response.ok) {
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ visible: 1, discount_enabled: 0, featured: 0, best_seller: 0, is_new: 0, stock: 0, sort_order: 0, sales_count: 0, fake_sales_count: 0, long_description: "", description: "", warranty: "" });
      refreshAll();
    } else {
      const data = await response.json();
      setError(data.error || "Failed to save product.");
    }
  }

  function deleteProduct(productId: string | number) {
    const prod = products.find((p) => p.id === productId);
    promptConfirm({
      title: "Delete Product",
      message: `Are you sure you want to delete "${prod?.name || "this product"}"? This action cannot be undone.`,
      confirmText: "Delete Product",
      type: "danger",
      onConfirm: async () => {
        const prevProducts = [...products];
        const prevDashboard = dashboard;

        // Optimistic UI update
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setDashboard((prev: any) => prev ? { ...prev, totalProducts: Math.max(0, (prev.totalProducts ?? 1) - 1) } : prev);

        try {
          const res = await fetch("/api/admin/products", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: productId }),
          });
          if (!res.ok) throw new Error();
          showToast(`Product "${prod?.name || ""}" deleted successfully!`, "success");
        } catch {
          setProducts(prevProducts);
          setDashboard(prevDashboard);
          showToast("Failed to delete product.", "error");
        }
      },
    });
  }

  async function duplicateProduct(product: Product) {
    const clone = { ...product, sku: `${product.sku}-${Date.now()}` };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...clone,
        visible: clone.visible,
        discount_enabled: clone.discount_enabled,
        sales_count: clone.sales_count ?? 0,
        fake_sales_count: clone.fake_sales_count ?? 0,
        long_description: clone.long_description || clone.description || "",
        warranty: clone.warranty || "",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) => [...prev, { ...clone, id: data.id || Date.now() }]);
      setDashboard((prev: any) => prev ? { ...prev, totalProducts: (prev.totalProducts ?? 0) + 1 } : prev);
      showToast(`Product cloned as "${clone.sku}"`, "success");
    }
  }

  async function toggleVisibility(product: Product) {
    const newVisible = product.visible ? 0 : 1;
    const prevProducts = [...products];
    const prevDashboard = dashboard;

    // Instant optimistic update (0ms lag!)
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, visible: newVisible } : p))
    );
    setDashboard((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        activeProducts: newVisible === 1 ? (prev.activeProducts ?? 0) + 1 : Math.max(0, (prev.activeProducts ?? 1) - 1),
        hiddenProducts: newVisible === 0 ? (prev.hiddenProducts ?? 0) + 1 : Math.max(0, (prev.hiddenProducts ?? 1) - 1),
      };
    });

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, visible: newVisible }),
      });
      if (!res.ok) throw new Error();
      showToast(newVisible === 1 ? `✓ "${product.name}" is now visible` : `Product "${product.name}" hidden`, "info");
    } catch {
      // Revert if request failed
      setProducts(prevProducts);
      setDashboard(prevDashboard);
      showToast("Failed to change product visibility.", "error");
    }
  }

  async function saveCategory() {
    if (!categoryForm.name || !categoryForm.slug) {
      setError("Category name and slug are required.");
      return;
    }
    const method = categoryForm.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    if (res.ok) {
      setShowCategoryModal(false);
      setCategoryForm({ visible: 1, sort_order: 0 });
      const catRes = await fetch("/api/admin/categories");
      if (catRes.ok) setCategories(await catRes.json());
      showToast("Category saved successfully!", "success");
    } else {
      setError("Failed to save category.");
    }
  }

  function deleteCategory(categoryId: string | number) {
    const cat = categories.find((c) => c.id === categoryId);
    promptConfirm({
      title: "Delete Category",
      message: `Are you sure you want to delete category "${cat?.name || ""}"?`,
      confirmText: "Delete Category",
      type: "danger",
      onConfirm: async () => {
        const prevCats = [...categories];
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));

        try {
          const res = await fetch("/api/admin/categories", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: categoryId }),
          });
          if (!res.ok) throw new Error();
          showToast("Category deleted successfully!", "success");
        } catch {
          setCategories(prevCats);
          showToast("Failed to delete category.", "error");
        }
      },
    });
  }

  async function handleProductImageFile(file: File) {
    if (!file) return;
    setProductImageUploading(true);
    setProductImageError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProductForm((prev) => ({ ...prev, image: data.url }));
        showToast("✓ Image compressed to WebP and saved in database!", "success");
      } else {
        setProductImageError(data.error || "Failed to upload and compress image.");
      }
    } catch (err: any) {
      setProductImageError("Upload failed: " + err.message);
    } finally {
      setProductImageUploading(false);
    }
  }

  async function updateOrderStatus(orderId: string | number, status: string) {
    const prevOrders = [...orders];
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      if (!res.ok) throw new Error();
      showToast(`Order #${orderId} status set to "${status}"`, "info");
    } catch {
      setOrders(prevOrders);
      showToast("Failed to update order status.", "error");
    }
  }

  function deleteOrder(orderId: string | number) {
    promptConfirm({
      title: "Delete Order",
      message: `Are you sure you want to delete order #${orderId}? This cannot be undone.`,
      confirmText: "Delete Order",
      type: "danger",
      onConfirm: async () => {
        const prevOrders = [...orders];
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setDashboard((prev: any) => prev ? { ...prev, newOrders: Math.max(0, (prev.newOrders ?? 1) - 1) } : prev);

        try {
          const res = await fetch("/api/admin/orders", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: orderId }),
          });
          if (!res.ok) throw new Error();
          showToast("Order deleted successfully!", "success");
        } catch {
          setOrders(prevOrders);
          showToast("Failed to delete order.", "error");
        }
      },
    });
  }

  function clearAllOrders() {
    promptConfirm({
      title: "Clear All Orders",
      message: "Are you sure you want to delete ALL orders from database? All customer order records will be permanently erased.",
      confirmText: "Delete All Orders",
      type: "danger",
      onConfirm: async () => {
        const prevOrders = [...orders];
        setOrders([]);
        setDashboard((prev: any) => prev ? { ...prev, newOrders: 0, totalSales: 0 } : prev);

        try {
          const res = await fetch("/api/admin/orders", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clearAll: true }),
          });
          if (!res.ok) throw new Error();
          showToast("All orders have been cleared!", "success");
        } catch {
          setOrders(prevOrders);
          showToast("Failed to clear all orders.", "error");
        }
      },
    });
  }

  async function updateCryptoStatus(paymentId: string | number, status: string) {
    const prevCrypto = [...cryptoPayments];
    // Optimistic update
    setCryptoPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status } : p)));

    try {
      const res = await fetch("/api/admin/crypto-payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, status }),
      });
      if (!res.ok) throw new Error();
      showToast(`Payment status updated to "${status}"`, "info");
    } catch {
      setCryptoPayments(prevCrypto);
      showToast("Failed to update crypto payment status.", "error");
    }
  }

  function deleteCryptoPayment(paymentId: string | number) {
    promptConfirm({
      title: "Delete Crypto Record",
      message: "Are you sure you want to delete this crypto transaction record?",
      confirmText: "Delete Record",
      type: "danger",
      onConfirm: async () => {
        const prevCrypto = [...cryptoPayments];
        setCryptoPayments((prev) => prev.filter((p) => p.id !== paymentId));

        try {
          const res = await fetch("/api/admin/crypto-payments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: paymentId }),
          });
          if (!res.ok) throw new Error();
          showToast("Crypto transaction record deleted!", "success");
        } catch {
          setCryptoPayments(prevCrypto);
          showToast("Failed to delete crypto payment.", "error");
        }
      },
    });
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
        showToast("✓ تم التحقق بنجاح وتأكيد الدفع من بينانس!", "success");
      } else {
        showToast(data.message || "لم يتم العثور على إيداع مطابق في بينانس حتى الآن.", "info");
      }
      refreshAll();
    } catch (err: any) {
      showToast("خطأ أثناء التحقق: " + err.message, "error");
    }
  }

  async function updateInstapayStatus(paymentId: string | number, status: string) {
    const prevInsta = [...instapayPayments];
    setInstapayPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status } : p)));

    try {
      const res = await fetch("/api/admin/instapay-payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, status }),
      });
      if (!res.ok) throw new Error();
      showToast(status === "confirmed" ? "✓ تم تأكيد دفع إنستاباي وتسجيل الطلب بنجاح!" : `تم تغيير الحالة إلى ${status}`, "success");
      refreshAll();
    } catch {
      setInstapayPayments(prevInsta);
      showToast("فشل تحديث حالة دفع إنستاباي.", "error");
    }
  }

  function deleteInstapayPayment(paymentId: string | number) {
    promptConfirm({
      title: "Delete InstaPay Record",
      message: "هل أنت متأكد من رغبتك في حذف هذا الإشعار من قائمة إنستاباي؟",
      confirmText: "Delete Record",
      type: "danger",
      onConfirm: async () => {
        const prevInsta = [...instapayPayments];
        setInstapayPayments((prev) => prev.filter((p) => p.id !== paymentId));

        try {
          const res = await fetch("/api/admin/instapay-payments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: paymentId }),
          });
          if (!res.ok) throw new Error();
          showToast("تم حذف إشعار التحويل بنجاح!", "success");
        } catch {
          setInstapayPayments(prevInsta);
          showToast("فشل حذف الإشعار.", "error");
        }
      },
    });
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteForm),
      });
      showToast("✓ Saved website settings successfully!", "success");
      refreshAll();
    } catch {
      showToast("Failed to save settings.", "error");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white antialiased selection:bg-[#E8A33D]/30 selection:text-[#E8A33D] relative overflow-hidden">
      {/* Subtle background ambient pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.04]">
        <div className="h-full w-full" style={{ backgroundImage: "repeating-linear-gradient(-45deg, #E8A33D 0, #E8A33D 2px, transparent 2px, transparent 25px)" }} />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-b from-[#161a27]/95 to-[#0a0c10]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 py-3 sm:px-6 lg:px-8 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Drawer Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#161a25] text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden shadow-md active:scale-95"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0 rounded-full bg-[#E8A33D] animate-pulse shadow-[0_0_8px_#E8A33D]"></span>
                <h1 className="text-sm sm:text-lg font-extrabold text-[#E8A33D] tracking-wide drop-shadow-[0_2px_8px_rgba(232,163,61,0.4)] truncate flex items-center gap-1.5">
                  <span>AI STORE</span>
                  <span className="text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 border border-white/15 uppercase tracking-wider">Admin</span>
                </h1>
              </div>
              <p className="hidden text-xs text-white/50 sm:block truncate">
                Signed in as <span className="font-semibold text-[#E8A33D]">{admin.email}</span> ({admin.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={refreshAll}
              disabled={loading}
              title="Refresh Data"
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-white/15 bg-[#161a25] px-2.5 sm:px-3.5 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50 shadow-sm active:scale-95"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin text-[#E8A33D]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-xl border border-[#E8A33D]/50 bg-[#161a25] px-3.5 py-2 text-xs font-bold text-[#E8A33D] transition hover:bg-[#E8A33D]/20 md:inline-flex shadow-sm active:scale-95"
            >
              Live Site ↗
            </a>

            <button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25 shadow-sm active:scale-95"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xs:inline sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick Tab Bar */}
        <div className="flex overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden gap-1.5 bg-black/40 scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
          {sectionList.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-[0_4px_12px_rgba(232,163,61,0.4)]"
                    : "bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <div className="rounded-2xl border border-white/10 bg-black/50 p-3 text-xs text-white/60 shadow-inner">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#E8A33D]">⚡</span> Management Hub
                </span>
                <p className="mt-0.5 text-[11px] text-white/40">Live controls & instant updates</p>
              </div>

              <nav className="space-y-1.5">
                {sectionList.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-[0_5px_15px_rgba(232,163,61,0.4),inset_0_2px_3px_rgba(255,255,255,0.3)] scale-[1.02]"
                          : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base">{sec.icon}</span>
                        <span>{sec.label}</span>
                      </span>
                      {sec.id === "products" && products.length > 0 && (
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? "bg-black/30 text-[#10131A]" : "bg-black/60 text-[#E8A33D] border border-white/10"}`}>
                          {products.length}
                        </span>
                      )}
                      {sec.id === "orders" && orders.length > 0 && (
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? "bg-black/30 text-[#10131A]" : "bg-black/60 text-[#E8A33D] border border-white/10"}`}>
                          {orders.length}
                        </span>
                      )}
                      {sec.id === "crypto" && cryptoPayments.filter(p => p.status === "pending" && p.tx_hash).length > 0 && (
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? "bg-black/30 text-[#10131A]" : "bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/40"}`}>
                          {cryptoPayments.filter(p => p.status === "pending" && p.tx_hash).length}
                        </span>
                      )}
                      {sec.id === "instapay" && instapayPayments.filter(p => p.status === "pending").length > 0 && (
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? "bg-black/30 text-[#10131A]" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"}`}>
                          {instapayPayments.filter(p => p.status === "pending").length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile Drawer Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="relative z-10 flex w-72 flex-col bg-gradient-to-b from-[#181d2a] to-[#10131d] border-r border-white/15 p-5 shadow-[0_25px_50px_rgba(0,0,0,0.9)]">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-base font-extrabold text-[#E8A33D]">AI STORE Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-white/15 bg-white/5 p-2 text-white/60 hover:text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 space-y-2 overflow-y-auto">
                  {sectionList.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                        activeSection === sec.id 
                          ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-[0_4px_12px_rgba(232,163,61,0.4)]" 
                          : "text-white/80 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <span className="text-lg">{sec.icon}</span>
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/50">{admin.email}</p>
                  <button onClick={logout} className="mt-2.5 w-full rounded-2xl bg-rose-500/20 border border-rose-500/30 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="min-w-0 space-y-6">
            {error && (
              <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/15 p-4 text-sm text-rose-200 shadow-md">
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-xs font-bold underline">Dismiss</button>
              </div>
            )}

            {/* OVERVIEW SECTION */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                  {[
                    { label: "Total Products", value: dashboard?.totalProducts ?? 0, icon: "📦", color: "text-[#E8A33D]" },
                    { label: "Active Products", value: dashboard?.activeProducts ?? 0, icon: "✅", color: "text-emerald-400" },
                    { label: "Hidden Products", value: dashboard?.hiddenProducts ?? 0, icon: "👁️", color: "text-white/50" },
                    { label: "Total Customers", value: dashboard?.totalCustomers ?? 0, icon: "👥", color: "text-sky-400" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-5 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="flex items-center justify-between text-white/60">
                        <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                        <span className="text-base">{item.icon}</span>
                      </div>
                      <p className={`mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold ${item.color} drop-shadow`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Sales & Orders Highlights */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">Total Sales</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#E8A33D] drop-shadow-[0_2px_8px_rgba(232,163,61,0.4)]">
                      {formatNumber(dashboard?.totalSales)} <span className="text-sm font-normal text-white/60">{settings.currency || "ج.م"}</span>
                    </p>
                    <p className="mt-1 text-xs text-white/50">Cumulative revenue from completed orders.</p>
                  </div>
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">New Orders</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">{dashboard?.newOrders ?? 0}</p>
                    <p className="mt-1 text-xs text-white/50">Orders waiting for fulfillment.</p>
                  </div>
                </div>

                {/* Recent Orders & Best Sellers */}
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-extrabold text-white">Recent Orders</h2>
                      <button onClick={() => setActiveSection("orders")} className="text-xs font-bold text-[#E8A33D] hover:underline">
                        View all →
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {dashboard?.recentOrders?.length ? (
                        dashboard.recentOrders.slice(0, 5).map((order: any) => (
                          <div key={order.id} className="rounded-2xl border border-white/10 bg-black/50 p-3.5 transition hover:border-white/25 shadow-inner">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate text-sm">{order.customer_name || "Guest"}</p>
                                <p className="text-xs text-white/40">Order #{order.id} · {new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-extrabold text-[#E8A33D] text-sm">{formatNumber(order.total)} {settings.currency || "ج.م"}</p>
                                <span className="inline-block rounded-full bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/80">
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-white/40">
                          No recent orders found.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <h2 className="text-base sm:text-lg font-extrabold text-white mb-4">Top Selling Products</h2>
                    <div className="space-y-2.5">
                      {dashboard?.bestSellingProducts?.length ? (
                        dashboard.bestSellingProducts.map((item: any) => (
                          <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 p-3.5 shadow-inner">
                            <p className="font-bold text-white text-sm truncate pr-2">{item.name}</p>
                            <span className="shrink-0 rounded-xl bg-[#E8A33D]/15 border border-[#E8A33D]/30 px-2.5 py-1 text-xs font-extrabold text-[#E8A33D]">
                              {item.sold} sold
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-white/40">
                          No sales data recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS SECTION */}
            {activeSection === "products" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Header & Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white">Products Catalog</h2>
                      <span className="rounded-full bg-[#E8A33D]/20 border border-[#E8A33D]/40 px-2.5 py-0.5 text-xs font-extrabold text-[#E8A33D]">
                        {filteredProducts.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs sm:text-sm text-white/60">Manage catalog inventory, prices, and discounts.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ visible: 1, discount_enabled: 0, featured: 0, best_seller: 0, is_new: 0, stock: 0, sort_order: 0, sales_count: 0, fake_sales_count: 0, long_description: "", description: "", warranty: "" });
                      setShowProductModal(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-5 py-3 text-xs sm:text-sm font-extrabold text-[#10131A] shadow-[0_5px_15px_rgba(232,163,61,0.4),inset_0_2px_3px_rgba(255,255,255,0.4)] transition hover:brightness-110 active:scale-95"
                  >
                    <span>+</span>
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Filter & Search Controls */}
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, SKU, tag..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50 shadow-inner"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-white/90 outline-none focus:border-[#E8A33D] shadow-inner"
                    >
                      <option value="all" className="bg-[#10131d] text-white">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#10131d] text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile View: Product Cards */}
                <div className="grid gap-3 sm:hidden">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 space-y-3 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                      <div className="flex items-start gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-16 w-16 shrink-0 rounded-xl border border-white/15 bg-black/60 object-contain p-1"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/60 border border-white/10 text-xs font-bold text-white/40">
                            IMG
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] text-white/40">{product.sku}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              product.visible ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-white/40 border border-white/10"
                            }`}>
                              {product.visible ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="font-bold text-white text-sm line-clamp-1">{product.name}</p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-extrabold text-[#E8A33D] text-sm">{product.price} {settings.currency || "ج.م"}</span>
                            {product.discount_enabled ? (
                              <span className="text-[10px] font-bold text-emerald-400">-{product.discount_percentage}% OFF</span>
                            ) : null}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md bg-black/50 border border-white/10 px-2 py-1 text-[11px] text-white/80">
                            <span className="text-white/50">المبيعات:</span>
                            <span className="font-mono font-extrabold text-[#E8A33D]">{(product.fake_sales_count || 0) + (product.sales_count || 0)}</span>
                            <span className="text-[10px] text-white/40">({product.fake_sales_count || 0} ترويجي + {product.sales_count || 0} حقيقي)</span>
                            {product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0 ? (
                              <span className="mr-auto rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-black">
                                نفد (0)
                              </span>
                            ) : (
                              <span className="mr-auto text-[10px] text-white/40 font-mono">
                                المخزون: {product.stock ?? 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                        <span className="rounded-lg bg-black/50 border border-white/10 px-2 py-1 text-[11px] text-white/60">
                          {product.category_name || "General"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleVisibility(product)}
                            className="rounded-lg border border-white/15 bg-[#161a25] px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/10"
                          >
                            {product.visible ? "Hide" : "Show"}
                          </button>
                          <button
                            onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductModal(true); }}
                            className="rounded-lg bg-[#E8A33D]/20 border border-[#E8A33D]/40 px-2.5 py-1 text-[11px] font-bold text-[#E8A33D] hover:bg-[#E8A33D]/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => duplicateProduct(product)}
                            className="rounded-lg border border-white/15 bg-[#161a25] px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/10"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/30"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!filteredProducts.length && (
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-white/40">
                      No matching products found.
                    </div>
                  )}
                </div>

                {/* Tablet / Desktop View: Data Table */}
                <div className="hidden sm:block overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm text-white/80">
                      <thead className="border-b border-white/10 bg-black/60 text-xs uppercase tracking-wider text-white/60">
                        <tr>
                          <th className="px-4 py-3.5">Product</th>
                          <th className="px-4 py-3.5">Price</th>
                          <th className="px-4 py-3.5">Sold (المبيعات)</th>
                          <th className="px-4 py-3.5">Category</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-transparent">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-white/[0.04] transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-10 w-10 shrink-0 rounded-xl border border-white/15 bg-black/60 object-contain p-1"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 border border-white/10 text-[10px] font-bold text-white/40">
                                    IMG
                                  </div>
                                )}
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-bold text-white truncate text-sm">{product.name}</p>
                                  <p className="font-mono text-xs text-white/40 truncate">{product.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-extrabold text-[#E8A33D]">{product.price} {settings.currency || "ج.م"}</p>
                              {product.discount_enabled ? (
                                <p className="text-xs text-emerald-400">-{product.discount_percentage}% off</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3.5">
                              <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-white/90">
                                  <span className="text-[#E8A33D] font-mono font-extrabold">{(product.fake_sales_count || 0) + (product.sales_count || 0)}</span>
                                  <span className="text-white/50 text-[11px]">مبيعات</span>
                                </span>
                                <span className="block text-[10px] text-white/40 mt-0.5 font-mono">
                                  {product.fake_sales_count || 0} ترويجي + {product.sales_count || 0} حقيقي
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1 text-xs text-white/70">
                                {product.category_name || "General"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  product.visible ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-white/40 border border-white/10"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${product.visible ? "bg-emerald-400" : "bg-white/40"}`}></span>
                                  {product.visible ? "Visible" : "Hidden"}
                                </span>
                                {product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-black text-rose-300 shadow-sm">
                                    نفد من المخزون (0)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-white/40 font-mono px-1">
                                    المخزون: {product.stock ?? 0}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductModal(true); }}
                                  className="rounded-xl border border-white/15 bg-[#161a25] px-2.5 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => duplicateProduct(product)}
                                  className="rounded-xl border border-white/15 bg-[#161a25] px-2.5 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
                                >
                                  Copy
                                </button>
                                <button
                                  onClick={() => toggleVisibility(product)}
                                  className="rounded-xl border border-[#E8A33D]/50 bg-[#E8A33D]/10 px-2.5 py-1.5 text-xs font-bold text-[#E8A33D] transition hover:bg-[#E8A33D]/20"
                                >
                                  {product.visible ? "Hide" : "Show"}
                                </button>
                                <button
                                  onClick={() => deleteProduct(product.id)}
                                  className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-2.5 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!filteredProducts.length && (
                    <div className="p-8 text-center text-white/40 text-sm">No products found.</div>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORIES SECTION */}
            {activeSection === "categories" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">Categories</h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-white/60">Organize products into customer-facing storefront categories.</p>
                  </div>
                  <button
                    onClick={() => { setCategoryForm({ visible: 1, sort_order: 0 }); setShowCategoryModal(true); }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-5 py-3 text-xs sm:text-sm font-extrabold text-[#10131A] shadow-[0_5px_15px_rgba(232,163,61,0.4),inset_0_2px_3px_rgba(255,255,255,0.4)] transition hover:brightness-110 active:scale-95"
                  >
                    <span>+ Add Category</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-white text-base truncate">{category.name}</p>
                            <p className="font-mono text-xs text-white/40 truncate">/{category.slug}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            category.visible ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-white/40 border border-white/10"
                          }`}>
                            {category.visible ? "Visible" : "Hidden"}
                          </span>
                        </div>
                        {category.image && (
                          <div className="h-24 w-full overflow-hidden rounded-xl border border-white/15 bg-black/60">
                            <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <p className="text-xs text-white/60">Sort Order: <span className="font-mono text-[#E8A33D] font-bold">{category.sort_order}</span></p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
                        <button
                          onClick={() => { setCategoryForm(category); setShowCategoryModal(true); }}
                          className="flex-1 rounded-xl border border-white/15 bg-[#161a25] py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/15 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25 shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {!categories.length && (
                    <div className="col-span-full rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-white/40">
                      No categories created yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORDERS SECTION */}
            {activeSection === "orders" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white">Orders</h2>
                      <span className="rounded-full bg-[#E8A33D]/20 border border-[#E8A33D]/40 px-2.5 py-0.5 text-xs font-extrabold text-[#E8A33D]">
                        {orders.length} Orders
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs sm:text-sm text-white/60">Review customer purchases, update fulfillment, or delete test orders.</p>
                  </div>
                  {orders.length > 0 && (
                    <button
                      onClick={clearAllOrders}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25 shadow-md active:scale-95"
                    >
                      🗑️ Clear All Orders
                    </button>
                  )}
                </div>

                {/* Mobile Orders View */}
                <div className="grid gap-3 sm:hidden">
                  {orders.map((order) => {
                    let orderMeta: any = null;
                    try { if (order.metadata) orderMeta = JSON.parse(order.metadata); } catch {}
                    return (
                      <div key={order.id} className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 space-y-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white/60">#{order.id}</span>
                          <span className="text-[10px] text-white/40">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2">
                          <p className="font-bold text-white text-sm">{order.customer_name || "Guest Customer"}</p>
                          <p className="text-xs text-white/50 mt-0.5">{order.customer_phone || order.customer_email || "No contact info"}</p>
                          {orderMeta?.productName && (
                            <p className="text-xs font-bold text-[#E8A33D] mt-1">📦 {orderMeta.productName}</p>
                          )}
                          {orderMeta?.txHash && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-black/60 border border-[#E8A33D]/30 px-2 py-0.5 text-[10px] font-mono text-white/90" dir="ltr">
                              <span className="text-[#E8A33D] font-bold">TxID:</span>
                              <span>{orderMeta.txHash.slice(0, 6)}...{orderMeta.txHash.slice(-4)}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(orderMeta.txHash);
                                  showToast("تم نسخ TxID بنجاح! ✓", "success");
                                }}
                                className="text-xs hover:text-[#E8A33D] transition ml-1"
                                title="نسخ TxID"
                              >
                                📋
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 pt-2">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Total</span>
                            <p className="font-extrabold text-[#E8A33D] text-sm">{formatNumber(order.total)} {settings.currency || "ج.م"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none shadow-inner"
                            >
                              {["pending", "paid", "confirmed", "processing", "completed", "cancelled"].map((status) => (
                                <option key={status} value={status} className="bg-[#10131d] text-white">{status}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="rounded-xl bg-rose-500/20 border border-rose-500/30 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
                              title="Delete Order"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!orders.length && (
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-white/40">
                      No orders received yet.
                    </div>
                  )}
                </div>

                {/* Desktop / Tablet Orders Table */}
                <div className="hidden sm:block overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm text-white/80">
                      <thead className="border-b border-white/10 bg-black/60 text-xs uppercase tracking-wider text-white/60">
                        <tr>
                          <th className="px-4 py-3.5">Customer / Order</th>
                          <th className="px-4 py-3.5">Product</th>
                          <th className="px-4 py-3.5">Phone</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5">Total</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-transparent">
                        {orders.map((order) => {
                          let orderMeta: any = null;
                          try { if (order.metadata) orderMeta = JSON.parse(order.metadata); } catch {}
                          return (
                            <tr key={order.id} className="hover:bg-white/[0.04] transition">
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-white">{order.customer_name || "Guest"}</p>
                                <p className="font-mono text-xs text-white/40">#{order.id} · {new Date(order.created_at).toLocaleDateString()}</p>
                                {orderMeta?.txHash && (
                                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-black/60 border border-[#E8A33D]/30 px-2 py-0.5 text-[11px] font-mono text-white/90 shadow-inner">
                                    <span className="text-[#E8A33D] font-bold">⚡ TxID:</span>
                                    <span>{orderMeta.txHash.slice(0, 6)}...{orderMeta.txHash.slice(-4)}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(orderMeta.txHash);
                                        showToast("تم نسخ TxID بنجاح! ✓", "success");
                                      }}
                                      className="text-xs hover:text-[#E8A33D] transition ml-1"
                                      title="نسخ TxID"
                                    >
                                      📋
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-block font-bold text-white text-xs bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 max-w-[200px] truncate" title={orderMeta?.productName || "منتج AI"}>
                                  {orderMeta?.productName || "منتج AI"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-white/60">{order.customer_phone || "—"}</td>
                              <td className="px-4 py-3.5">
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none shadow-inner"
                                >
                                  {["pending", "paid", "confirmed", "processing", "completed", "cancelled"].map((status) => (
                                    <option key={status} value={status} className="bg-[#10131d] text-white">{status}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3.5 font-extrabold text-[#E8A33D]">
                                {formatNumber(order.total)} {settings.currency || "ج.م"}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => deleteOrder(order.id)}
                                  className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25"
                                  title="Delete Order"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!orders.length && (
                    <div className="p-8 text-center text-white/40 text-sm">No orders recorded yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* CRYPTO / BINANCE PAY SECTION */}
            {activeSection === "crypto" && (() => {
              const underpaidCount = cryptoPayments.filter(p => p.status === "underpaid" || p.payment_status === "underpaid").length;
              const completedCount = cryptoPayments.filter(p => p.status === "completed" || p.status === "paid").length;
              const pendingWithTxCount = cryptoPayments.filter(p => (p.status === "pending" || p.status === "underpaid") && Boolean(p.tx_hash)).length;

              const displayedCrypto = cryptoPayments.filter((p) => {
                if (cryptoFilter === "completed") return p.status === "completed" || p.status === "paid";
                if (cryptoFilter === "underpaid") return p.status === "underpaid" || p.payment_status === "underpaid";
                if (cryptoFilter === "pending") return (p.status === "pending" || p.status === "underpaid") && Boolean(p.tx_hash);
                return true;
              });

              return (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white">مدفوعات الكريبتو / Binance Pay</h2>
                        <span className="rounded-full bg-[#E8A33D]/20 text-[#E8A33D] text-xs px-2.5 py-0.5 font-mono font-bold border border-[#E8A33D]/30">Live API</span>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-white/60">عرض العمليات المؤكدة، فحص الـ TxID، ومراجعة أرقام الإيداعات في بينانس.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                      {/* Filter Pills */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 w-full sm:w-auto bg-black/60 p-1.5 rounded-2xl border border-white/15 text-xs shadow-inner">
                        <button
                          onClick={() => setCryptoFilter("all")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            cryptoFilter === "all"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          الكل ({cryptoPayments.length})
                        </button>
                        <button
                          onClick={() => setCryptoFilter("completed")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            cryptoFilter === "completed"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          المؤكدة ({completedCount})
                        </button>
                        <button
                          onClick={() => setCryptoFilter("underpaid")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            cryptoFilter === "underpaid"
                              ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md"
                              : "text-rose-400/80 hover:text-rose-300"
                          }`}
                        >
                          دفع ناقص ⚠️ ({underpaidCount})
                        </button>
                        <button
                          onClick={() => setCryptoFilter("pending")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            cryptoFilter === "pending"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          معلقة بـ TxID ({pendingWithTxCount})
                        </button>
                      </div>

                      <button
                        onClick={refreshAll}
                        className="w-full sm:w-auto rounded-2xl bg-[#161a25] border border-white/15 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <span>تحديث</span>
                        <span>🔄</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Crypto Cards */}
                  <div className="grid gap-3 sm:hidden" dir="rtl">
                    {displayedCrypto.map((p) => (
                      <div key={p.id} className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-3.5 sm:p-4 space-y-3 shadow-[0_10px_25px_rgba(0,0,0,0.6)] w-full min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="font-mono text-xs font-extrabold text-[#E8A33D] truncate">{p.order_id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            p.status === "completed" || p.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : p.status === "pending"
                              ? "bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {p.status === "completed" || p.status === "paid" ? "✓ مؤكد في بينانس" : p.status === "pending" ? "قيد المراجعة" : p.status}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{p.product_name || "منتج AI"}</p>
                          <p className="text-xs text-white/50 mt-0.5 truncate">{p.customer_name} {p.customer_phone ? `(${p.customer_phone})` : ""}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs gap-2 min-w-0">
                          <div className="min-w-0">
                            <span className="text-[10px] text-white/40 block">المبلغ المطلوب / المدفوع</span>
                            <span className="font-bold text-white font-mono block truncate">
                              {p.actual_amount != null ? (
                                <>{p.actual_amount} / {p.expected_amount ?? p.amount} {p.currency}</>
                              ) : (
                                <>{formatNumber(p.amount)} {p.currency}</>
                              )}
                            </span>
                            <span className="text-[10px] text-white/40 block">{p.network}</span>
                          </div>
                          {p.binance_order_id && (
                            <div className="text-left font-mono text-[10px] text-emerald-400 shrink-0 truncate max-w-[140px]" dir="ltr">
                              Binance ID: {p.binance_order_id}
                            </div>
                          )}
                        </div>

                        {/* Payment Audit Badge - Mobile */}
                        {p.payment_status && (
                          <div className="border-t border-white/10 pt-2">
                            <span className="text-[10px] text-white/40 block mb-1">تحقق المبلغ:</span>
                            <PaymentAuditBadge p={p} />
                            {p.refund_required && (
                              <span className="block mt-1 text-[10px] text-amber-300 font-bold">⚠️ يتطلب استرداد المبلغ الزائد</span>
                            )}
                          </div>
                        )}

                        {/* TxID Box */}
                        {p.tx_hash ? (
                          <div className="rounded-xl bg-black/60 border border-white/10 p-2.5 space-y-1 text-xs w-full min-w-0 overflow-hidden" dir="ltr">
                            <span className="text-[10px] text-white/40 block">معرّف المعاملة (TxID):</span>
                            <div className="flex items-center justify-between gap-2 w-full min-w-0">
                              <span className="font-mono text-[11px] text-[#E8A33D] truncate font-bold flex-1 min-w-0 block" title={p.tx_hash}>
                                {p.tx_hash}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.tx_hash);
                                    showToast("تم نسخ TxID بنجاح! ✓", "success");
                                  }}
                                  className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white shrink-0 active:scale-95"
                                >
                                  نسخ 📋
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 w-full min-w-0" dir="ltr">
                          <button
                            onClick={() => verifyCryptoPaymentAdmin(p.order_id, p.tx_hash)}
                            className="flex-1 min-w-[110px] rounded-xl bg-[#E8A33D]/20 border border-[#E8A33D]/40 text-[#E8A33D] py-2 px-2 text-xs font-bold hover:bg-[#E8A33D]/30 transition text-center whitespace-nowrap active:scale-95"
                          >
                            ⚡ فحص بينانس
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <select
                              value={p.status}
                              onChange={(e) => updateCryptoStatus(p.id, e.target.value)}
                              className="rounded-xl bg-black/60 border border-white/15 px-2 py-2 text-xs text-white outline-none shadow-inner"
                            >
                              <option value="pending" className="bg-[#10131d]">pending</option>
                              <option value="completed" className="bg-[#10131d]">completed</option>
                              <option value="cancelled" className="bg-[#10131d]">cancelled</option>
                            </select>
                            <button
                              onClick={() => deleteCryptoPayment(p.id)}
                              className="rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 px-2.5 py-2 text-xs font-bold transition shrink-0 active:scale-95"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!displayedCrypto.length && (
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-white/40">
                        {cryptoFilter === "completed" ? "لا توجد مدفوعات مؤكدة حالياً." : "لا توجد مدفوعات مسجلة بهذا الفلتر."}
                      </div>
                    )}
                  </div>

                  {/* Tablet / Desktop Crypto Table */}
                  <div className="hidden sm:block overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px] text-right text-sm text-white/80" dir="rtl">
                        <thead className="border-b border-white/10 bg-black/60 text-xs uppercase tracking-wider text-white/60">
                          <tr>
                            <th className="px-4 py-3.5">رقم الطلب / العميل</th>
                            <th className="px-4 py-3.5">المنتج</th>
                            <th className="px-4 py-3.5">المبلغ المطلوب / المدفوع</th>
                            <th className="px-4 py-3.5">تحقق المبلغ</th>
                            <th className="px-4 py-3.5">معرّف المعاملة (TxID)</th>
                            <th className="px-4 py-3.5">الحالة</th>
                            <th className="px-4 py-3.5 text-left">إجراءات المراجعة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-transparent">
                          {displayedCrypto.map((p) => (
                            <tr key={p.id} className="hover:bg-white/[0.04] transition">
                              <td className="px-4 py-3.5">
                                <p className="font-extrabold text-[#E8A33D] font-mono text-xs">{p.order_id}</p>
                                <p className="text-xs text-white/50">{p.customer_name} {p.customer_phone ? `(${p.customer_phone})` : ""}</p>
                                {p.binance_order_id && (
                                  <span className="block font-mono text-[10px] text-emerald-400 mt-0.5" dir="ltr">
                                    Binance ID: {p.binance_order_id}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-xs font-semibold text-white">{p.product_name || "منتج AI"}</td>
                              <td className="px-4 py-3.5 font-mono">
                                {p.actual_amount != null ? (
                                  <>
                                    <span className="font-bold text-white block">
                                      <span className="text-white/50 text-[10px]">مدفوع: </span>{p.actual_amount} {p.currency}
                                    </span>
                                    <span className="font-bold text-white/60 block text-[10px]">
                                      <span className="text-white/40">مطلوب: </span>{p.expected_amount ?? p.amount} {p.currency}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-bold text-white">{formatNumber(p.amount)} {p.currency}</span>
                                )}
                                <span className="block text-[10px] text-white/40">{p.network}</span>
                              </td>
                              {/* Audit Badge Column */}
                              <td className="px-4 py-3.5">
                                <PaymentAuditBadge p={p} />
                                {p.refund_required && (
                                  <span className="block mt-1 text-[10px] text-amber-300 font-bold">⚠️ يحتاج استرداد</span>
                                )}
                                {!p.payment_status && (
                                  <span className="text-white/30 text-xs font-mono">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                {p.tx_hash ? (
                                  <div className="flex items-center gap-1.5" dir="ltr">
                                    <span 
                                      className="font-mono text-xs font-bold text-white bg-black/60 px-2.5 py-1 rounded-xl border border-white/15 truncate max-w-[150px] shadow-inner" 
                                      title={p.tx_hash}
                                    >
                                      {p.tx_hash.slice(0, 6)}...{p.tx_hash.slice(-4)}
                                    </span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(p.tx_hash);
                                        showToast("تم نسخ TxID بنجاح! ✓", "success");
                                      }}
                                      className="rounded-xl bg-white/5 hover:bg-white/15 px-2.5 py-1.5 text-white/70 hover:text-[#E8A33D] border border-white/10 transition shadow flex items-center gap-1 text-xs"
                                      title="نسخ TxID الكامل"
                                    >
                                      <span>📋</span>
                                      <span>نسخ</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-white/30 text-xs font-mono">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  p.status === "completed" || p.status === "paid"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : p.status === "pending"
                                    ? "bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}>
                                  {p.status === "completed" || p.status === "paid" ? "✓ مؤكد في بينانس" : p.status === "pending" ? "قيد المراجعة" : p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-left" dir="ltr">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => verifyCryptoPaymentAdmin(p.order_id, p.tx_hash)}
                                    className="rounded-xl bg-[#E8A33D]/20 border border-[#E8A33D]/40 text-[#E8A33D] hover:bg-[#E8A33D]/30 px-3 py-1.5 text-xs font-bold transition shadow-sm"
                                  >
                                    ⚡ فحص بينانس
                                  </button>
                                  <select
                                    value={p.status}
                                    onChange={(e) => updateCryptoStatus(p.id, e.target.value)}
                                    className="rounded-xl bg-black/60 border border-white/15 px-2.5 py-1.5 text-xs text-white outline-none shadow-inner"
                                  >
                                    <option value="pending" className="bg-[#10131d]">pending</option>
                                    <option value="completed" className="bg-[#10131d]">completed</option>
                                    <option value="cancelled" className="bg-[#10131d]">cancelled</option>
                                  </select>
                                  <button
                                    onClick={() => deleteCryptoPayment(p.id)}
                                    className="rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 px-2.5 py-1.5 text-xs font-bold transition shadow-sm"
                                    title="Delete Transaction"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!displayedCrypto.length && (
                      <div className="p-8 text-center text-white/40 text-sm">
                        {cryptoFilter === "completed" ? "لا توجد مدفوعات مؤكدة حالياً." : "لا توجد مدفوعات مسجلة بهذا الفلتر."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* INSTAPAY / VODAFONE CASH SECTION */}
            {activeSection === "instapay" && (() => {
              const displayedInstapay = instapayPayments.filter((p) => {
                if (instapayFilter === "pending") return p.status === "pending";
                if (instapayFilter === "confirmed") return p.status === "confirmed" || p.status === "paid";
                if (instapayFilter === "rejected") return p.status === "rejected" || p.status === "cancelled";
                return true;
              });

              const pendingCount = instapayPayments.filter(p => p.status === "pending").length;
              const confirmedCount = instapayPayments.filter(p => p.status === "confirmed" || p.status === "paid").length;
              const totalConfirmedAmount = instapayPayments
                .filter(p => p.status === "confirmed" || p.status === "paid")
                .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

              return (
                <div className="space-y-4 sm:space-y-6">
                  {/* Header Banner */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white">تحويلات InstaPay & فودافون كاش</h2>
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 font-bold border border-emerald-500/30">سجل الإيصالات</span>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-white/60">مراجعة سكرين شوت التحويلات، أرقام هواتف العملاء، وتأكيد الطلبات بضغطة زر.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                      {/* Filter Segmented Controls */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 w-full sm:w-auto bg-black/60 p-1.5 rounded-2xl border border-white/15 text-xs shadow-inner">
                        <button
                          onClick={() => setInstapayFilter("pending")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            instapayFilter === "pending"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          قيد المراجعة ({pendingCount})
                        </button>
                        <button
                          onClick={() => setInstapayFilter("confirmed")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            instapayFilter === "confirmed"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          المؤكدة ({confirmedCount})
                        </button>
                        <button
                          onClick={() => setInstapayFilter("rejected")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            instapayFilter === "rejected"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          المرفوضة
                        </button>
                        <button
                          onClick={() => setInstapayFilter("all")}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] sm:text-xs text-center truncate ${
                            instapayFilter === "all"
                              ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-md"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          الكل ({instapayPayments.length})
                        </button>
                      </div>

                      <button
                        onClick={refreshAll}
                        className="w-full sm:w-auto rounded-2xl bg-[#161a25] border border-white/15 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <span>تحديث</span>
                        <span>🔄</span>
                      </button>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center justify-between text-white/60 text-xs">
                        <span className="font-bold uppercase tracking-wider">قيد المراجعة</span>
                        <span>⏳</span>
                      </div>
                      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#E8A33D]">{pendingCount}</p>
                      <p className="mt-0.5 text-[11px] text-white/40">بانتظار تأكيدك</p>
                    </div>
                    <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center justify-between text-white/60 text-xs">
                        <span className="font-bold uppercase tracking-wider">الطلبات المؤكدة</span>
                        <span>✅</span>
                      </div>
                      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">{confirmedCount}</p>
                      <p className="mt-0.5 text-[11px] text-white/40">تم تسجيلها ومطابقتها</p>
                    </div>
                    <div className="col-span-2 lg:col-span-1 rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center justify-between text-white/60 text-xs">
                        <span className="font-bold uppercase tracking-wider">إجمالي المبالغ المؤكدة</span>
                        <span>💰</span>
                      </div>
                      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                        {formatNumber(totalConfirmedAmount)} <span className="text-sm font-normal text-white/60">{settings.currency || "ج.م"}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/40">أرباح محصلة عبر إنستاباي</p>
                    </div>
                  </div>

                  {/* Mobile InstaPay Cards */}
                  <div className="grid gap-3 sm:hidden" dir="rtl">
                    {displayedInstapay.map((p) => (
                      <div key={p.id} className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-3.5 sm:p-4 space-y-3 shadow-[0_10px_25px_rgba(0,0,0,0.6)] w-full min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <span className="font-mono text-xs font-extrabold text-[#E8A33D] truncate block">{p.order_id}</span>
                            <div className="mt-1">
                              {p.payment_method === "vodafone" || p.payment_method === "vodafone_cash" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5">
                                  🔴 فودافون كاش
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5">
                                  ⚡ إنستاباي (InstaPay)
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            p.status === "confirmed" || p.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : p.status === "pending"
                              ? "bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {p.status === "confirmed" || p.status === "paid" ? "✓ تم التأكيد" : p.status === "pending" ? "قيد المراجعة" : p.status}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{p.product_name || "منتج AI"}</p>
                          <p className="text-xs text-white/50 mt-0.5 truncate">{new Date(p.created_at).toLocaleString("ar-EG")}</p>
                        </div>

                        {/* Phone and Amount */}
                        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs gap-2 min-w-0">
                          <div className="min-w-0">
                            <span className="text-[10px] text-white/40 block">رقم المحول منه:</span>
                            <div className="flex items-center gap-1 mt-0.5" dir="ltr">
                              <span className="font-mono font-bold text-white text-xs truncate">{p.customer_phone}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.customer_phone);
                                  showToast("تم نسخ رقم الهاتف! ✓", "success");
                                }}
                                className="text-white/60 hover:text-[#E8A33D] text-[11px] shrink-0"
                                title="نسخ الرقم"
                              >
                                📋
                              </button>
                              <a
                                href={`https://wa.me/${p.customer_phone.startsWith("0") ? "2" + p.customer_phone : p.customer_phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold hover:bg-emerald-500/30 transition shrink-0"
                                title="محادثة واتساب"
                              >
                                💬
                              </a>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <span className="text-[10px] text-white/40 block">المبلغ</span>
                            <span className="font-extrabold text-[#E8A33D] font-mono text-sm">{formatNumber(p.amount)} {p.currency}</span>
                          </div>
                        </div>

                        {/* Screenshot Preview */}
                        <div className="border-t border-white/10 pt-2">
                          <span className="text-[10px] text-white/40 block mb-1">صورة إيصال التحويل (Screenshot):</span>
                          {p.receipt_url ? (
                            <div className="flex items-center gap-3 bg-black/50 p-2 rounded-xl border border-white/10 w-full min-w-0">
                              <button
                                onClick={() => setPreviewReceiptUrl(p.receipt_url)}
                                className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-white/20 bg-black group"
                              >
                                <img src={p.receipt_url} alt="Receipt" className="h-full w-full object-cover group-hover:scale-105 transition" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition">🔍</div>
                              </button>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-xs font-bold text-white truncate">إيصال تحويل العميل</p>
                                <button
                                  onClick={() => setPreviewReceiptUrl(p.receipt_url)}
                                  className="rounded-lg bg-[#E8A33D]/20 text-[#E8A33D] hover:bg-[#E8A33D]/30 border border-[#E8A33D]/30 px-2.5 py-1 text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  <span>🔍 تكبير الإيصال</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-white/40 italic">لم يتم إرفاق سكرين شوت (تم الإرسال عبر واتساب فقط).</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 w-full min-w-0" dir="ltr">
                          {p.status !== "confirmed" && (
                            <button
                              onClick={() => updateInstapayStatus(p.id, "confirmed")}
                              className="flex-1 min-w-[100px] rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 py-2 px-2 text-xs font-bold hover:bg-emerald-500/30 transition text-center whitespace-nowrap active:scale-95"
                            >
                              ✓ تأكيد الطلب
                            </button>
                          )}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <select
                              value={p.status}
                              onChange={(e) => updateInstapayStatus(p.id, e.target.value)}
                              className="rounded-xl bg-black/60 border border-white/15 px-2 py-2 text-xs text-white outline-none shadow-inner"
                            >
                              <option value="pending" className="bg-[#10131d]">قيد المراجعة</option>
                              <option value="confirmed" className="bg-[#10131d]">مؤكد</option>
                              <option value="rejected" className="bg-[#10131d]">مرفوض</option>
                            </select>
                            <button
                              onClick={() => deleteInstapayPayment(p.id)}
                              className="rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 px-2.5 py-2 text-xs font-bold transition shrink-0 active:scale-95"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!displayedInstapay.length && (
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-white/40">
                        لا توجد إشعارات تحويل مسجلة بهذا الفلتر.
                      </div>
                    )}
                  </div>

                  {/* Desktop / Tablet InstaPay Table */}
                  <div className="hidden sm:block overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[880px] text-right text-sm text-white/80" dir="rtl">
                        <thead className="border-b border-white/10 bg-black/60 text-xs uppercase tracking-wider text-white/60">
                          <tr>
                            <th className="px-4 py-3.5">رقم الطلب / التاريخ</th>
                            <th className="px-4 py-3.5">رقم الهاتف المحول منه</th>
                            <th className="px-4 py-3.5">المنتج والمبلغ</th>
                            <th className="px-4 py-3.5">سكرين شوت الإيصال</th>
                            <th className="px-4 py-3.5">الحالة</th>
                            <th className="px-4 py-3.5 text-left">إجراءات المراجعة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-transparent">
                          {displayedInstapay.map((p) => (
                            <tr key={p.id} className="hover:bg-white/[0.04] transition">
                              <td className="px-4 py-3.5">
                                <p className="font-extrabold text-[#E8A33D] font-mono text-xs">{p.order_id}</p>
                                <div className="mt-1">
                                  {p.payment_method === "vodafone" || p.payment_method === "vodafone_cash" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5">
                                      🔴 فودافون كاش
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5">
                                      ⚡ إنستاباي (InstaPay)
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/40 mt-1">{new Date(p.created_at).toLocaleString("ar-EG")}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5" dir="ltr">
                                  <span className="font-mono font-bold text-white text-sm bg-black/60 px-2.5 py-1 rounded-xl border border-white/15 shadow-inner">
                                    {p.customer_phone}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(p.customer_phone);
                                      showToast("تم نسخ رقم الهاتف! ✓", "success");
                                    }}
                                    className="rounded-xl bg-white/5 hover:bg-white/15 p-1.5 text-white/70 hover:text-[#E8A33D] border border-white/10 transition"
                                    title="نسخ الرقم"
                                  >
                                    📋
                                  </button>
                                  <a
                                    href={`https://wa.me/${p.customer_phone.startsWith("0") ? "2" + p.customer_phone : p.customer_phone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 p-1.5 text-emerald-400 border border-emerald-500/30 transition font-bold text-xs flex items-center gap-1"
                                    title="محادثة العميل عبر واتساب"
                                  >
                                    <span>واتساب</span> 💬
                                  </a>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="text-xs font-semibold text-white truncate max-w-[200px]">{p.product_name || "منتج AI"}</p>
                                <p className="font-extrabold text-[#E8A33D] font-mono text-sm mt-0.5">
                                  {formatNumber(p.amount)} <span className="text-xs font-normal text-white/60">{p.currency}</span>
                                </p>
                              </td>
                              <td className="px-4 py-3.5">
                                {p.receipt_url ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setPreviewReceiptUrl(p.receipt_url)}
                                      className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-white/20 bg-black/60 shadow-md group"
                                      title="انقر لتكبير الإيصال"
                                    >
                                      <img src={p.receipt_url} alt="Receipt Thumbnail" className="h-full w-full object-cover group-hover:scale-110 transition" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition">🔍</div>
                                    </button>
                                    <button
                                      onClick={() => setPreviewReceiptUrl(p.receipt_url)}
                                      className="rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 px-2.5 py-1 text-xs font-bold text-white transition flex items-center gap-1"
                                    >
                                      <span>عرض</span> 🔍
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-white/30 text-xs italic">لا توجد صورة</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  p.status === "confirmed" || p.status === "paid"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : p.status === "pending"
                                    ? "bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}>
                                  {p.status === "confirmed" || p.status === "paid" ? "✓ تم التأكيد" : p.status === "pending" ? "قيد المراجعة" : p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-left" dir="ltr">
                                <div className="flex items-center justify-end gap-2">
                                  {p.status !== "confirmed" && (
                                    <button
                                      onClick={() => updateInstapayStatus(p.id, "confirmed")}
                                      className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1.5 text-xs font-bold transition shadow-sm"
                                      title="تأكيد التحويل وإضافة الطلب للمبيعات"
                                    >
                                      ✓ تأكيد
                                    </button>
                                  )}
                                  <select
                                    value={p.status}
                                    onChange={(e) => updateInstapayStatus(p.id, e.target.value)}
                                    className="rounded-xl bg-black/60 border border-white/15 px-2.5 py-1.5 text-xs text-white outline-none shadow-inner"
                                  >
                                    <option value="pending" className="bg-[#10131d]">قيد المراجعة</option>
                                    <option value="confirmed" className="bg-[#10131d]">مؤكد</option>
                                    <option value="rejected" className="bg-[#10131d]">مرفوض</option>
                                  </select>
                                  <button
                                    onClick={() => deleteInstapayPayment(p.id)}
                                    className="rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 px-2.5 py-1.5 text-xs font-bold transition shadow-sm"
                                    title="حذف الإشعار"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!displayedInstapay.length && (
                      <div className="p-8 text-center text-white/40 text-sm">
                        لا توجد تحويلات مسجلة بهذا الفلتر.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* CUSTOMERS SECTION */}
            {activeSection === "customers" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">Customers</h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-white/60">View customer lifetime value and order volume.</p>
                  </div>
                </div>

                {/* Mobile Customers */}
                <div className="grid gap-3 sm:hidden">
                  {customers.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 space-y-2 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white text-sm">{c.name || "Anonymous Customer"}</p>
                        <span className="rounded-lg bg-black/50 border border-white/10 px-2 py-0.5 text-xs text-white/70">{c.orders_count} orders</span>
                      </div>
                      <p className="text-xs text-white/50">{c.phone || c.email || "No contact info"}</p>
                      <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs">
                        <span className="text-white/40">Total Spent:</span>
                        <span className="font-extrabold text-[#E8A33D]">{formatNumber(c.total_spent)} {settings.currency || "ج.م"}</span>
                      </div>
                    </div>
                  ))}
                  {!customers.length && (
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-white/40">
                      No customer accounts yet.
                    </div>
                  )}
                </div>

                {/* Tablet / Desktop Customers */}
                <div className="hidden sm:block overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm text-white/80">
                      <thead className="border-b border-white/10 bg-black/60 text-xs uppercase tracking-wider text-white/60">
                        <tr>
                          <th className="px-4 py-3.5">Name / Phone</th>
                          <th className="px-4 py-3.5">Email</th>
                          <th className="px-4 py-3.5">Total Spent</th>
                          <th className="px-4 py-3.5 text-right">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-transparent">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.04] transition">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-white">{c.name || "Anonymous"}</p>
                              <p className="text-xs text-white/40">{c.phone || "—"}</p>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-white/60">{c.email || "—"}</td>
                            <td className="px-4 py-3.5 font-extrabold text-[#E8A33D]">{formatNumber(c.total_spent)} {settings.currency || "ج.م"}</td>
                            <td className="px-4 py-3.5 text-right font-mono text-white/80">{c.orders_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS SECTION */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                <form onSubmit={saveSettings} className="space-y-6">
                  {/* Top Bar with Sticky/Prominent Save Action */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-4 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white">Store Settings & Content</h2>
                        <span className="rounded-full bg-[#E8A33D]/20 text-[#E8A33D] text-xs px-2.5 py-0.5 font-mono font-bold border border-[#E8A33D]/30">Live Config</span>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-white/60">Manage storefront headlines, branding, currency rates, support channels, and SEO.</p>
                    </div>
                    <button
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-6 py-3.5 text-sm font-extrabold text-[#10131A] transition hover:brightness-110 shadow-[0_5px_15px_rgba(232,163,61,0.4),inset_0_2px_3px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>💾</span>
                      <span>Save All Changes</span>
                    </button>
                  </div>

                  {/* 1. Hero & Storefront Header */}
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-5 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8A33D]/15 border border-[#E8A33D]/30 text-[#E8A33D] text-lg">
                        🌟
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white">Hero & Storefront Header (واجهة المتجر)</h3>
                        <p className="text-xs text-white/60">The main banner headlines and call-to-action button seen by customers at the top of the homepage.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Hero Main Headline (العنوان الترويجي الرئيسي)</label>
                        <input
                          value={siteForm.hero_title}
                          onChange={(e) => setSiteForm({ ...siteForm, hero_title: e.target.value })}
                          placeholder="e.g. اختر الباقة المناسبة لك"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50 shadow-inner transition placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Hero Subtitle & Description (الوصف الترويجي)</label>
                        <textarea
                          value={siteForm.hero_description}
                          onChange={(e) => setSiteForm({ ...siteForm, hero_description: e.target.value })}
                          placeholder="e.g. اشتراكات مدعومة بتفعيل احترافي وخدمة عملاء سريعة..."
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50 min-h-[90px] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>

                      {/* CTA Button 1 */}
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 space-y-3.5 shadow-inner">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E8A33D]">
                          <span>🔘</span> CTA Button 1 (الزر الترويجي الأساسي)
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-white/80">CTA Button Text (نص زر الطلب)</label>
                            <input
                              value={siteForm.hero_button_text}
                              onChange={(e) => setSiteForm({ ...siteForm, hero_button_text: e.target.value })}
                              placeholder="e.g. اطلب الآن"
                              className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-white/80">CTA Button Link / Number (رابط أو رقم الزر)</label>
                            <input
                              value={siteForm.hero_button_url}
                              onChange={(e) => setSiteForm({ ...siteForm, hero_button_url: e.target.value })}
                              placeholder="e.g. https://wa.me/201040248751 or 201040248751"
                              className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] font-mono shadow-inner transition placeholder:text-white/30"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-white/80">WhatsApp Auto Message (رسالة الواتساب التلقائية عند الضغط)</label>
                          <input
                            value={siteForm.hero_button_message}
                            onChange={(e) => setSiteForm({ ...siteForm, hero_button_message: e.target.value })}
                            placeholder="e.g. مرحباً، أود الاستفسار عن الاشتراكات المتوفرة"
                            className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                          />
                        </div>
                      </div>

                      {/* CTA Button 2 */}
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 space-y-3.5 shadow-inner">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-sky-400">
                          <span>🔘</span> CTA Button 2 (الزر الترويجي الثاني)
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-white/80">CTA Button 2 Text (نص زر الطلب الثاني)</label>
                            <input
                              value={siteForm.hero_button2_text}
                              onChange={(e) => setSiteForm({ ...siteForm, hero_button2_text: e.target.value })}
                              placeholder="e.g. تواصل معنا / الدعم"
                              className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-white/80">CTA Button 2 Link / Number (رابط أو رقم الزر الثاني)</label>
                            <input
                              value={siteForm.hero_button2_url}
                              onChange={(e) => setSiteForm({ ...siteForm, hero_button2_url: e.target.value })}
                              placeholder="e.g. https://wa.me/201040248751 or https://t.me/username"
                              className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] font-mono shadow-inner transition placeholder:text-white/30"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-white/80">CTA Button 2 WhatsApp Auto Message (رسالة الواتساب التلقائية للزر الثاني)</label>
                          <input
                            value={siteForm.hero_button2_message}
                            onChange={(e) => setSiteForm({ ...siteForm, hero_button2_message: e.target.value })}
                            placeholder="e.g. مرحباً، أحتاج مساعدة أو استفسار بخصوص الدعم"
                            className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Store Identity & Rates */}
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-5 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-lg">
                        🏪
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white">Store Identity & Currency (هوية المتجر والعملة)</h3>
                        <p className="text-xs text-white/60">Configure your store brand name and currency exchange calculations.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Store Name (اسم المتجر)</label>
                        <input
                          value={siteForm.website_name}
                          onChange={(e) => setSiteForm({ ...siteForm, website_name: e.target.value })}
                          placeholder="AI STORE"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Currency Symbol (رمز العملة)</label>
                        <input
                          value={siteForm.currency}
                          onChange={(e) => setSiteForm({ ...siteForm, currency: e.target.value })}
                          placeholder="ج.م or $"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">1 USDT Exchange Rate (سعر 1 دولار USDT)</label>
                        <input
                          value={siteForm.usdt_rate}
                          onChange={(e) => setSiteForm({ ...siteForm, usdt_rate: e.target.value })}
                          placeholder="50"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] font-mono shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Support & Social Channels */}
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-5 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-lg">
                        📞
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white">Support Channels & Social Links (بيانات التواصل والدعم)</h3>
                        <p className="text-xs text-white/60">Direct contact channels for your customers and official social profiles.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">WhatsApp Link / Number</label>
                        <input
                          value={siteForm.contact_whatsapp}
                          onChange={(e) => setSiteForm({ ...siteForm, contact_whatsapp: e.target.value })}
                          placeholder="https://wa.me/201040248751"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Phone Number</label>
                        <input
                          value={siteForm.contact_phone}
                          onChange={(e) => setSiteForm({ ...siteForm, contact_phone: e.target.value })}
                          placeholder="+20 115 841 3075"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Support Email</label>
                        <input
                          value={siteForm.contact_email}
                          onChange={(e) => setSiteForm({ ...siteForm, contact_email: e.target.value })}
                          placeholder="support@aistore.com"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 pt-2">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Facebook Page URL</label>
                        <input
                          value={siteForm.facebook_url}
                          onChange={(e) => setSiteForm({ ...siteForm, facebook_url: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Instagram Profile URL</label>
                        <input
                          value={siteForm.instagram_url}
                          onChange={(e) => setSiteForm({ ...siteForm, instagram_url: e.target.value })}
                          placeholder="https://instagram.com/..."
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Telegram Channel / User</label>
                        <input
                          value={siteForm.telegram_url}
                          onChange={(e) => setSiteForm({ ...siteForm, telegram_url: e.target.value })}
                          placeholder="https://t.me/..."
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. SEO & Footer */}
                  <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-5 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-lg">
                        🔍
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white">SEO & Footer Disclaimer (محركات البحث وتذييل الصفحة)</h3>
                        <p className="text-xs text-white/60">Search engine metadata and footer copyright text.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">SEO Meta Title</label>
                        <input
                          value={siteForm.seo_title}
                          onChange={(e) => setSiteForm({ ...siteForm, seo_title: e.target.value })}
                          placeholder="AI STORE | أفضل اشتراكات وأدوات الذكاء الاصطناعي"
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">SEO Meta Description</label>
                        <textarea
                          value={siteForm.seo_description}
                          onChange={(e) => setSiteForm({ ...siteForm, seo_description: e.target.value })}
                          placeholder="متجر متخصص في توفير أفضل حسابات واشتراكات الذكاء الاصطناعي بأفضل الأسعار..."
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-[#E8A33D] min-h-[85px] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80">Footer Text / Disclaimer (تذييل الصفحة)</label>
                        <textarea
                          value={siteForm.footer_text}
                          onChange={(e) => setSiteForm({ ...siteForm, footer_text: e.target.value })}
                          placeholder="جميع الحقوق محفوظة © AI STORE. تفعيل سريع ودعم فني متواصل."
                          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-[#E8A33D] min-h-[85px] shadow-inner transition placeholder:text-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-8 py-3.5 text-sm font-extrabold text-[#10131A] transition hover:brightness-110 shadow-[0_5px_15px_rgba(232,163,61,0.4)] active:scale-95"
                    >
                      💾 Save All Settings
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-gradient-to-b from-[#181d2a] to-[#10131d] p-4 sm:p-6 shadow-[0_25px_50px_rgba(0,0,0,0.9)] my-auto max-h-[92vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">{editingProduct ? "Edit Product" : "New Product"}</h3>
                <p className="text-xs text-white/60">Fill in the product details and price points.</p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2.5 custom-scrollbar" dir="ltr">
              {/* Product Image Database Uploader */}
              <div className="rounded-2xl border border-white/15 bg-black/50 p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-extrabold text-white">Product Image (Saved directly in DB)</span>
                    <p className="text-[11px] text-white/50">Automatically compressed to WebP for instant loading & minimal storage.</p>
                  </div>
                  {productForm.image && productForm.image.startsWith("/api/public/images/") && (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 border border-emerald-500/30">
                      ✓ Database Stored
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {productForm.image ? (
                    <div className="relative group shrink-0">
                      <img
                        src={productForm.image}
                        alt="Product preview"
                        className="h-24 w-24 rounded-2xl border border-white/15 bg-black/60 object-contain p-1.5 shadow-md"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, image: "" })}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-lg hover:bg-rose-600 transition"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/40 text-xs font-bold text-white/40">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <label className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/40 p-3 text-center cursor-pointer transition hover:border-[#E8A33D] ${productImageUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProductImageFile(file);
                        }}
                      />
                      {productImageUploading ? (
                        <span className="text-xs font-bold text-[#E8A33D] animate-pulse">Compressing & Saving to Database...</span>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-white">📁 Choose New Image to Upload</span>
                          <span className="text-[10px] text-white/40 mt-0.5">PNG, JPG, WebP (auto-optimized to ~15KB WebP)</span>
                        </>
                      )}
                    </label>

                    {productImageError && (
                      <p className="text-xs text-rose-400 font-semibold">{productImageError}</p>
                    )}

                    <input
                      type="text"
                      placeholder="Image DB URL (/api/public/images/...)"
                      value={productForm.image ?? ""}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white/60 outline-none focus:border-[#E8A33D] font-mono shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "SKU", key: "sku", type: "text", placeholder: "e.g. AI-PRO-01" },
                  { label: "Product Name", key: "name", type: "text", placeholder: "e.g. ChatGPT Plus Account" },
                  { label: "Price", key: "price", type: "number", placeholder: "250" },
                  { label: "Original Price", key: "original_price", type: "number", placeholder: "350" },
                  { label: "Discount %", key: "discount_percentage", type: "number", placeholder: "20" },
                  { label: "Stock Quantity", key: "stock", type: "number", placeholder: "100" },
                  { label: "Promo / Fake Sales (مبيعات وهمية ترويجية)", key: "fake_sales_count", type: "number", placeholder: "0" },
                  { label: "Real Sales (المبيعات الحقيقية)", key: "sales_count", type: "number", placeholder: "0" },
                  { label: "Warranty (فترة ومواصفات الضمان)", key: "warranty", type: "text", placeholder: "مثال: مدى الحياة / شهر كامل / 12 شهر" },
                  { label: "Sort Order", key: "sort_order", type: "number", placeholder: "0" },
                  { label: "Tags (comma separated)", key: "tags", type: "text", placeholder: "ai, chatgpt, plus" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-white/80">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={(productForm as any)[key] ?? ""}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          [key]: type === "number" ? Number(event.target.value) : event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner placeholder:text-white/30"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80">Category</label>
                <select
                  value={productForm.category_id ?? ""}
                  onChange={(event) => setProductForm({ ...productForm, category_id: event.target.value || null })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner"
                >
                  <option value="" className="bg-[#10131d]">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#10131d]">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80">Short Summary (نبذة سريعة للكارت)</label>
                <textarea
                  value={productForm.description ?? ""}
                  onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                  placeholder="نبذة سريعة تظهر على كارت المنتج في الصفحة الرئيسية..."
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] min-h-[70px] shadow-inner placeholder:text-white/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white">Full Long Description (التفاصيل والمميزات الكاملة - تظهر في صفحة تفاصيل المنتج)</label>
                  <span className="text-[10px] text-[#E8A33D] font-mono">يدعم التنسيق والفقرات المتعددة</span>
                </div>
                <p className="text-[11px] text-white/50 mb-1">اكتب هنا كل مميزات الاشتراك، تعليمات التفعيل، شروط الاستخدام، والضمان بالتفصيل.</p>
                <textarea
                  value={productForm.long_description ?? ""}
                  onChange={(event) => setProductForm({ ...productForm, long_description: event.target.value })}
                  placeholder={`✨ مميزات الاشتراك وتفاصيل الباقة:\n- تفعيل رسمي وسريع ومباشر\n- يعمل على جميع أجهزتك (Windows, Mac, iOS, Android)\n- دعم فني متواصل وضمان كامل طوال المدة\n\n📝 تعليمات الاستلام والتفعيل:\n- سيتم إرسال بيانات الحساب والتفعيل فوراً بعد الدفع.`}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] min-h-[160px] shadow-inner placeholder:text-white/30 font-sans leading-relaxed"
                />
              </div>

              {/* Flags Grid */}
              <div>
                <p className="text-xs font-semibold text-white/80 mb-2">Display Badges & Flags</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Visible", key: "visible" },
                    { label: "Featured", key: "featured" },
                    { label: "Best Seller", key: "best_seller" },
                    { label: "New Arrival", key: "is_new" },
                    { label: "Enable Discount", key: "discount_enabled" },
                  ].map(({ label, key }) => (
                    <label key={key} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white/80 cursor-pointer hover:border-white/20 transition">
                      <input
                        type="checkbox"
                        checked={Boolean((productForm as any)[key])}
                        onChange={(event) =>
                          setProductForm({ ...productForm, [key]: event.target.checked ? 1 : 0 })
                        }
                        className="h-4 w-4 rounded border-white/20 bg-black/60 text-[#E8A33D] accent-[#E8A33D]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveProduct}
                className="rounded-xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-5 py-2 text-xs font-extrabold text-[#10131A] shadow-[0_4px_12px_rgba(232,163,61,0.35)] hover:brightness-110 active:scale-95"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-gradient-to-b from-[#181d2a] to-[#10131d] p-4 sm:p-6 shadow-[0_25px_50px_rgba(0,0,0,0.9)] my-auto">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white">{categoryForm.id ? "Edit Category" : "New Category"}</h3>
                <p className="text-xs text-white/60">Configure category names and storefront slug.</p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 p-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80">Category Name</label>
                <input
                  value={categoryForm.name || ""}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  placeholder="e.g. AI Subscriptions"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] shadow-inner placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80">Slug</label>
                <input
                  value={categoryForm.slug || ""}
                  onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })}
                  placeholder="e.g. ai-subscriptions"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] font-mono shadow-inner placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80">Image URL</label>
                <input
                  value={categoryForm.image || ""}
                  onChange={(event) => setCategoryForm({ ...categoryForm, image: event.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] font-mono shadow-inner placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80">Sort Order</label>
                <input
                  type="number"
                  value={categoryForm.sort_order ?? 0}
                  onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E8A33D] font-mono shadow-inner"
                />
              </div>
              <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/80 cursor-pointer hover:border-white/20 transition">
                <input
                  type="checkbox"
                  checked={Boolean(categoryForm.visible)}
                  onChange={(event) => setCategoryForm({ ...categoryForm, visible: event.target.checked ? 1 : 0 })}
                  className="h-4 w-4 rounded border-white/20 bg-black/60 text-[#E8A33D] accent-[#E8A33D]"
                />
                <span>Visible on storefront</span>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                className="rounded-xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-5 py-2 text-xs font-extrabold text-[#10131A] shadow-[0_4px_12px_rgba(232,163,61,0.35)] hover:brightness-110 active:scale-95"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-b from-[#181d2a] to-[#10131d] p-5 sm:p-6 shadow-[0_25px_50px_rgba(0,0,0,0.9)] space-y-4 my-auto">
            <div className="flex items-start gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                confirmDialog.type === "danger"
                  ? "bg-rose-500/15 border border-rose-500/30 text-rose-300 text-lg"
                  : confirmDialog.type === "warning"
                  ? "bg-[#E8A33D]/15 border border-[#E8A33D]/30 text-[#E8A33D] text-lg"
                  : "bg-blue-500/15 border border-blue-500/30 text-blue-300 text-lg"
              }`}>
                {confirmDialog.type === "danger" ? "🗑️" : confirmDialog.type === "warning" ? "⚠️" : "ℹ️"}
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-white">{confirmDialog.title}</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 sm:flex-initial rounded-xl border border-white/15 bg-[#161a25] px-4 py-2.5 text-xs sm:text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {confirmDialog.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`flex-1 sm:flex-initial rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white transition shadow-lg ${
                  confirmDialog.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                    : confirmDialog.type === "warning"
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] shadow-[0_4px_12px_rgba(232,163,61,0.4)]"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                }`}
              >
                {confirmDialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR RECEIPT SCREENSHOT */}
      {previewReceiptUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-gradient-to-b from-[#1a1f2c] to-[#11141d] border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>🧾</span> سكرين شوت إيصال التحويل
              </h3>
              <div className="flex items-center gap-2" dir="ltr">
                <a
                  href={previewReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#E8A33D]/20 text-[#E8A33D] hover:bg-[#E8A33D]/30 border border-[#E8A33D]/30 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1"
                >
                  <span>فتح في نافذة جديدة</span> ↗
                </a>
                <button
                  onClick={() => setPreviewReceiptUrl(null)}
                  className="rounded-xl bg-white/10 hover:bg-white/20 text-white p-2 transition"
                  title="إغلاق"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center rounded-2xl bg-black/80 p-2 border border-white/10">
              <img
                src={previewReceiptUrl}
                alt="Receipt Screenshot"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-sm sm:max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-gradient-to-b from-[#1a1f2c]/95 to-[#11141d]/95 px-4 py-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            toast.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : toast.type === "error"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "bg-[#E8A33D]/20 text-[#E8A33D] border border-[#E8A33D]/30"
          }`}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <p className="text-xs sm:text-sm font-bold text-white truncate">{toast.message}</p>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="ml-auto text-xs text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
