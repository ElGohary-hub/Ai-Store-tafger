"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";

type Product = {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  detail?: string;
  price: number | string;
  original_price?: number;
  discount_enabled?: number;
  discount_percentage?: number;
  featured?: number;
  best_seller?: number;
  is_new?: number;
  visible?: number;
  stock?: number;
  category_id?: number | null;
  image: string;
  sort_order?: number;
  tags?: string;
  sales_count?: number;
  fake_sales_count?: number;
  long_description?: string;
  warranty?: string;
};

type SettingsState = {
  website_name?: string;
  hero_title: string;
  hero_description: string;
  hero_image: string;
  hero_button_text: string;
  hero_button_url: string;
  hero_button_message?: string;
  hero_button2_text?: string;
  hero_button2_url?: string;
  hero_button2_message?: string;
  contact_whatsapp: string;
  contact_phone: string;
  contact_email: string;
  currency: string;
  usdt_rate?: string;
};

const INITIAL_SETTINGS: SettingsState = {
  website_name: "AI STORE",
  hero_title: "اختر الباقة المناسبة لك",
  hero_description: "اشتراكات مدعومة بتفعيل احترافي وخدمة عملاء سريعة.",
  hero_image: "/p3.png",
  hero_button_text: "اطلب الآن",
  hero_button_url: "https://wa.me/201040248751",
  hero_button_message: "مرحباً، أود الاستفسار عن باقات واشتراكات الذكاء الاصطناعي",
  hero_button2_text: "",
  hero_button2_url: "",
  hero_button2_message: "",
  contact_whatsapp: "https://wa.me/201040248751?text=مرحباً",
  contact_phone: "01158413075",
  contact_email: "info@aistore.com",
  currency: "ج.م",
  usdt_rate: "50",
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: "canva", name: "Canva Pro", detail: "اشتراك Canva Pro مدي الحياه والدفع بعد التفعيل. يتم التفعيل علي حسابك الشخصي وبشكل رسمي من كانفا!", price: 70, image: "/p3.png", sales_count: 0, fake_sales_count: 0 },
  { id: "google", name: "Google Plan", detail: "تشمل: Gemini Pro, Antigravity, Nano Banana, NotebookLM, 5TB تخزين سحابي, Google Flow 1000 Credit/M", price: 70, image: "/p4.png", sales_count: 0, fake_sales_count: 0 },
  { id: "capcut", name: "CapCut", detail: "التفعيل لمدة شهر فقط، تستلم حساب خاص فيك متفعل جاهز", price: 70, image: "/p10.png", sales_count: 0, fake_sales_count: 0 },
  { id: "coursera", name: "Coursera", detail: "باقة البلص، كل الكورسات مفتوحة، يتم ارسال حساب خاص فيك متفعل جاهز", price: 70, image: "/p6.png", sales_count: 0, fake_sales_count: 0 },
  { id: "office", name: "Microsoft Office 365", detail: "باقة البلص، 5 أجهزة، 100 جيجابايت ون درايف، تفعيل 12 شهر (ويندوز فقط)", price: 70, image: "/p5.png", sales_count: 0, fake_sales_count: 0 },
  { id: "leonardo", name: "Leonardo Ai", detail: "شهر واحد وصول كامل، 8500 رصيد، حساب خاص بك، تفعيل مباشر", price: 70, image: "/p16.png", sales_count: 0, fake_sales_count: 0 },
  { id: "notion", name: "Notion", detail: "باقة البلص، باقي التفاصيل كلمني", price: 70, image: "/p13.png", sales_count: 0, fake_sales_count: 0 },
  { id: "adobe", name: "Adobe Express", detail: "عضوية مميزة لمدة 12 شهر، لا حاجة لـ VPN أو VISA، تفعيل مباشر", price: 70, image: "/p14.png", sales_count: 0, fake_sales_count: 0 },
  { id: "gamma", name: "Gamma Ai", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p11.png", sales_count: 0, fake_sales_count: 0 },
  { id: "youtube", name: "YouTube", detail: "حسب المدة والباقة، تواصل معي للتفاصيل", price: 70, image: "/p12.png", sales_count: 0, fake_sales_count: 0 },
  { id: "chatgpt", name: "ChatGPT", detail: "حسب المدة والباقة، تواصل معي للتفاصيل", price: 70, image: "/p15.png", sales_count: 0, fake_sales_count: 0 },
  { id: "claude", name: "Claude", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p7.png", sales_count: 0, fake_sales_count: 0 },
  { id: "manus", name: "Manus", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p1.png", sales_count: 0, fake_sales_count: 0 },
  { id: "higgsfield", name: "Higgsfield", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p2.png", sales_count: 0, fake_sales_count: 0 },
  { id: "grok", name: "Grok", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p8.png", sales_count: 0, fake_sales_count: 0 },
  { id: "figma", name: "Figma", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p9.png", sales_count: 0, fake_sales_count: 0 },
];

function formatPrice(p: number | string, currency = "ج.م", usdtRate = 50) {
  if (typeof p === "number") {
    const rate = usdtRate > 0 ? usdtRate : 50;
    const usdVal = (p / rate).toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1");
    return (
      <span className="flex items-center justify-center gap-1.5" dir="rtl">
        <span>{p} {currency}</span>
        <span className="text-white/40 font-medium">/</span>
        <span dir="ltr">{usdVal}$</span>
      </span>
    );
  }
  return <span dir="rtl">{p}</span>;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState(false);
  const [isVodafoneModalOpen, setIsVodafoneModalOpen] = useState(false);
  const [transferMethod, setTransferMethod] = useState<"instapay" | "vodafone">("instapay");
  
  const [copied, setCopied] = useState(false);
  const [txIdInput, setTxIdInput] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"success" | "overpaid" | "underpaid" | "exhausted" | null>(null);
  const [paymentAudit, setPaymentAudit] = useState<{ actualAmount: number; expectedAmount: number; difference: number; txHash?: string } | null>(null);
  const [retryCooldown, setRetryCooldown] = useState<number>(0);
  const [isFailedExhausted, setIsFailedExhausted] = useState<boolean>(false);

  // ─── Persistent Crypto Cooldown across tabs, pages and reloads ──────────────
  useEffect(() => {
    function checkPersistentCooldown() {
      try {
        const storedUntil = localStorage.getItem("crypto_cooldown_until");
        if (storedUntil) {
          const until = parseInt(storedUntil, 10);
          const remaining = Math.ceil((until - Date.now()) / 1000);
          if (remaining > 0) {
            setRetryCooldown(remaining);
          } else {
            setRetryCooldown(0);
            localStorage.removeItem("crypto_cooldown_until");
          }
        }
      } catch {}
    }

    checkPersistentCooldown();
    const interval = setInterval(checkPersistentCooldown, 1000);

    function handleStorage(e: StorageEvent) {
      if (e.key === "crypto_cooldown_until") {
        checkPersistentCooldown();
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [selectedProductForBuy, setSelectedProductForBuy] = useState<Product | null>(null);
  const [isCheckoutFromCart, setIsCheckoutFromCart] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, settingsRes] = await Promise.all([
          fetch("/api/public/products"),
          fetch("/api/public/settings"),
        ]);
        if (productsRes.ok) {
          const productData = await productsRes.json();
          setProducts(productData);
        }
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings((prev) => ({ ...prev, ...settingsData }));
        }
      } catch (error) {
        console.error("Failed to load public data:", error);
      }
    }
    loadData();
  }, []);

  const cartLoaded = useRef(false);
  const cartSaveMounted = useRef(false);

  // 1. Initial Load & Multi-Tab Synchronization
  useEffect(() => {
    function readCartFromStorage() {
      try {
        const saved = localStorage.getItem("ai_store_cart");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setCart((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
              return parsed;
            });
          }
        }
      } catch (err) {
        console.error("Failed to read cart from storage:", err);
      } finally {
        cartLoaded.current = true;
      }
    }

    readCartFromStorage();

    function handleStorageChange(e: StorageEvent) {
      if (e.key === "ai_store_cart" && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === "object") {
            setCart((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
              return parsed;
            });
          }
        } catch (err) {
          console.error("Failed to parse synced cart:", err);
        }
      }
    }

    function handleTabFocus() {
      readCartFromStorage();
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleTabFocus);
    document.addEventListener("visibilitychange", handleTabFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleTabFocus);
      document.removeEventListener("visibilitychange", handleTabFocus);
    };
  }, []);

  // 2. Safe Save to localStorage (skip on first mount render to avoid overwriting with empty {})
  useEffect(() => {
    if (!cartSaveMounted.current) {
      cartSaveMounted.current = true;
      return;
    }
    if (!cartLoaded.current) return;
    try {
      localStorage.setItem("ai_store_cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart to storage", err);
    }
  }, [cart]);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  
  const cartTotal = useMemo(() =>
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((p) => p.id === id);
      return sum + (p && typeof p.price === 'number' ? p.price * qty : 0);
    }, 0),
  [cart, products]);

  const binanceUsdAmount = useMemo(() => {
    const rate = Number(settings.usdt_rate) > 0 ? Number(settings.usdt_rate) : 50;
    const totalLocal = isCheckoutFromCart ? cartTotal : (selectedProductForBuy ? Number(selectedProductForBuy.price || 0) : 0);
    const converted = totalLocal / rate;
    return Math.max(0.01, Number(converted.toFixed(2)));
  }, [isCheckoutFromCart, cartTotal, selectedProductForBuy, settings.usdt_rate]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function addToCart(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    showToast("تمت إضافة المنتج إلى سلة المشتريات بنجاح! 🛍️");
  }
  function decreaseQuantity(id: string) { setCart((c) => { const qty = c[id]; if (!qty) return c; if (qty === 1) { const newCart = { ...c }; delete newCart[id]; return newCart; } return { ...c, [id]: qty - 1 }; }); }
  function removeFromCart(id: string) { setCart((c) => { const newCart = { ...c }; delete newCart[id]; return newCart; }); }
  function handleDirectBuy(product: Product) { setSelectedProductForBuy(product); setIsCheckoutFromCart(false); setIsPaymentModalOpen(true); }
  function handleCartCheckoutClick() { if (cartCount === 0) return; setIsCheckoutFromCart(true); setSelectedProductForBuy(null); setIsPaymentModalOpen(true); setIsCartOpen(false); }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  }

  async function payViaWhatsApp() {
    if (!senderPhone.trim()) { 
      setPhoneError("يرجى إدخال رقم هاتفك المحول منه أولاً للمتابعة!"); 
      return; 
    }
    setPhoneError("");
    setIsUploadingImage(true);

    let amount = 0;
    let prodName = "";
    let prodId = "";

    if (isCheckoutFromCart) {
      amount = cartTotal;
      prodId = "cart";
      prodName = Object.entries(cart)
        .map(([id, qty]) => {
          const p = products.find(x => x.id === id);
          return p ? `${p.name} (x${qty})` : "";
        })
        .filter(Boolean)
        .join(" + ");
    } else if (selectedProductForBuy) {
      amount = Number(selectedProductForBuy.price) || 0;
      prodId = String(selectedProductForBuy.id || selectedProductForBuy.sku || "");
      prodName = selectedProductForBuy.name;
    }

    let receiptUrl = "";

    try {
      const submitData = new FormData();
      submitData.append("senderPhone", senderPhone.trim());
      submitData.append("customerName", "عميل فودافون كاش / إنستاباي");
      submitData.append("amount", String(amount));
      submitData.append("currency", settings.currency || "ج.م");
      submitData.append("productId", prodId);
      submitData.append("productName", prodName);
      submitData.append("paymentMethod", transferMethod);
      if (receiptFile) {
        submitData.append("receiptFile", receiptFile);
      }

      const res = await fetch("/api/public/instapay/submit", {
        method: "POST",
        body: submitData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.receiptUrl) {
          receiptUrl = typeof window !== "undefined" ? `${window.location.origin}${data.receiptUrl}` : data.receiptUrl;
        }
      }
    } catch (err) {
      console.error("Failed to submit receipt to store database", err);
    } finally {
      setIsUploadingImage(false);
    }

    const methodLabel = transferMethod === "instapay" ? "⚡ إنستاباي (InstaPay)" : "🔴 فودافون كاش (Vodafone Cash)";
    let orderText = `السلام عليكم ورحمة الله وبركاتة\nأرغب في تأكيد طلب شراء:\n`;
    if (isCheckoutFromCart) {
      Object.entries(cart).forEach(([id, qty]) => {
        const p = products.find(x => x.id === id);
        if (p) orderText += `- ${p.name} x${qty}\n`;
      });
      orderText += `\nالإجمالي الكلي:${cartTotal} ${settings.currency || "ج.م"}\nطريقة التحويل:${methodLabel}\nرقم الهاتف المحول منه:${senderPhone}`;
    } else if (selectedProductForBuy) {
      orderText += `-${selectedProductForBuy.name}\nالسعر:${selectedProductForBuy.price} ${settings.currency || "ج.م"}\nطريقة التحويل:${methodLabel}\nرقم الهاتف المحول منه:${senderPhone}`;
    }

    if (receiptUrl) {
      orderText += `\n\nرابط إيصال التحويل المرفق:\n${receiptUrl}`;
    }

    window.open(`${settings.contact_whatsapp || "https://wa.me/201040248751?text="}${encodeURIComponent(orderText)}`, "_blank");
    setIsVodafoneModalOpen(false);
    setIsPaymentModalOpen(false);
  }

  const [cryptoAddresses, setCryptoAddresses] = useState<Array<{ networkId: string; networkName: string; address: string; tag: string; isPopular?: boolean }>>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("PAY_ID");
  const [currentCryptoOrder, setCurrentCryptoOrder] = useState<any>(null);
  const [verificationError, setVerificationError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    if (isCartOpen || isPaymentModalOpen || isVodafoneModalOpen || isBinanceModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen, isPaymentModalOpen, isVodafoneModalOpen, isBinanceModalOpen]);

  useEffect(() => {
    async function fetchCryptoAddresses() {
      try {
        const res = await fetch("/api/public/crypto/addresses");
        if (res.ok) {
          const data = await res.json();
          if (data.addresses && data.addresses.length > 0) {
            setCryptoAddresses(data.addresses);
            // Default to PAY_ID (Binance Pay), fallback to first non-TRX network
            const firstNonTrx = data.addresses.find((a: any) => a.networkId !== "TRX");
            setSelectedNetwork(firstNonTrx ? firstNonTrx.networkId : "PAY_ID");
          }
        }
      } catch (err) {
        console.error("Failed to load crypto addresses", err);
      }
    }
    fetchCryptoAddresses();
  }, []);

  const activeCryptoAddress = useMemo(() => {
    const found = cryptoAddresses.find(a => a.networkId === selectedNetwork)?.address;
    if (found) return found;
    if (selectedNetwork === "BSC") return "0xfa90bd46019435b0aa3d0bc69ee2bf5a432e2806";
    if (selectedNetwork === "APT") return "0xa236707d87a33bed07e75aed59471c605c22846ddd1f464e9ee9910383dbf528";
    return "TN9kZMYS53JbuHQbsGPGDvJXD4gUhPVZi7";
  }, [cryptoAddresses, selectedNetwork]);

  function openVodafoneModal() {
    setIsPaymentModalOpen(false);
    setSenderPhone("");
    setReceiptFile(null);
    setFileName("");
    setPhoneError("");
    setIsVodafoneModalOpen(true);
  }

  function closeVodafoneModal() {
    setIsVodafoneModalOpen(false);
    setSenderPhone("");
    setReceiptFile(null);
    setFileName("");
    setPhoneError("");
  }

  function closeBinanceModal() {
    setIsBinanceModalOpen(false);
    setTxIdInput("");
    setVerificationResult(null);
    setVerificationError("");
    setPaymentAudit(null);
    setIsVerifying(false);
  }

  async function payViaBinance() {
    setIsPaymentModalOpen(false);
    setTxIdInput("");
    setVerificationResult(null);
    setVerificationError("");
    setPaymentAudit(null);
    setIsVerifying(false);
    setIsFailedExhausted(false);
    setSelectedNetwork("PAY_ID");
    setIsBinanceModalOpen(true);

    // Re-check persistent cooldown & failure count from localStorage
    try {
      const storedUntil = localStorage.getItem("crypto_cooldown_until");
      let activeCooldown = 0;
      if (storedUntil) {
        const until = parseInt(storedUntil, 10);
        const remaining = Math.ceil((until - Date.now()) / 1000);
        if (remaining > 0) {
          activeCooldown = remaining;
          setRetryCooldown(remaining);
        } else {
          setRetryCooldown(0);
          localStorage.removeItem("crypto_cooldown_until");
          localStorage.removeItem("crypto_fail_count");
        }
      }

      const failCount = Number(localStorage.getItem("crypto_fail_count") || 0);
      if (failCount >= 2 && activeCooldown > 0) {
        setIsFailedExhausted(true);
        setVerificationResult("exhausted");
      } else if (activeCooldown === 0) {
        setIsFailedExhausted(false);
        setVerificationResult(null);
      }
    } catch {}

    // Create a pending crypto order in backend
    try {
      let prodName = selectedProductForBuy?.name || "اشتراك AI";
      let prodId = selectedProductForBuy?.id || "product";

      if (isCheckoutFromCart) {
        prodId = "cart";
        const items = Object.entries(cart)
          .map(([id, qty]) => {
            const p = products.find((x) => x.id === id);
            return p ? `${p.name} (x${qty})` : "";
          })
          .filter(Boolean)
          .join(" + ");
        prodName = items || `سلة مشتريات (${cartCount} منتجات)`;
      }

      const res = await fetch("/api/public/crypto/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "عميل المتجر",
          customerPhone: senderPhone || "",
          productId: prodId,
          productName: prodName,
          amount: binanceUsdAmount,
          currency: "USDT",
          network: selectedNetwork,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentCryptoOrder(data);
      }
    } catch (err) {
      console.error("Error creating crypto order:", err);
    }
  }

  const myBinancePayId = "1082962624";
  function copyBinanceId() { navigator.clipboard.writeText(myBinancePayId); setCopied(true); setTimeout(() => setCopied(false), 2500); }
  function copyWalletAddress() { navigator.clipboard.writeText(activeCryptoAddress); setCopiedAddress(true); setTimeout(() => setCopiedAddress(false), 2500); }

  async function verifyBinancePayment() {
    if (retryCooldown > 0) return;

    setIsVerifying(true);
    setVerificationError("");
    setVerificationResult(null);
    setPaymentAudit(null);

    const orderId = currentCryptoOrder?.orderId;
    if (!orderId) {
      setVerificationError("يرجى إعادة المحاولة");
      setIsVerifying(false);
      return;
    }

    const currentClientFail = Number(localStorage.getItem("crypto_fail_count") || 0);

    try {
      const res = await fetch("/api/public/crypto/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          txHash: txIdInput.trim() || undefined,
          clientFailCount: currentClientFail,
        }),
      });

      const data = await res.json();
      setIsVerifying(false);

      if (!res.ok || data.error) {
        setVerificationError(data.error || data.message || "حدث خطأ أثناء الاتصال بالخادم.");
        return;
      }

      if (data.retryAfterSeconds && data.retryAfterSeconds > 0) {
        localStorage.setItem("crypto_fail_count", "1");
        const until = Date.now() + data.retryAfterSeconds * 1000;
        try {
          localStorage.setItem("crypto_cooldown_until", String(until));
        } catch {}
        setRetryCooldown(data.retryAfterSeconds);
      }

      if (data.status === "failed_exhausted" || data.attemptsLeft === 0 || (!data.verified && currentClientFail >= 1)) {
        setIsFailedExhausted(true);
        setVerificationResult("exhausted");
        const cooldownSec = data.retryAfterSeconds || 60;
        setRetryCooldown(cooldownSec);
        try {
          localStorage.setItem("crypto_fail_count", "2");
          localStorage.setItem("crypto_cooldown_until", String(Date.now() + cooldownSec * 1000));
        } catch {}
        return;
      }

      const audit = data.actualAmount !== undefined ? {
        actualAmount: data.actualAmount,
        expectedAmount: data.expectedAmount,
        difference: data.difference,
        txHash: data.txHash,
      } : null;

      if (data.verified) {
        try {
          localStorage.removeItem("crypto_cooldown_until");
          localStorage.removeItem("crypto_fail_count");
        } catch {}
        setRetryCooldown(0);
        if (audit) setPaymentAudit(audit);
        setVerificationResult(data.paymentStatus === "overpaid" ? "overpaid" : "success");
      } else if (data.paymentStatus === "underpaid" && data.actualAmount !== undefined) {
        setPaymentAudit(audit);
        setVerificationResult("underpaid");
        setVerificationError(data.message || "المبلغ المدفوع أقل من المطلوب.");
      } else {
        setVerificationError(data.message || "لم يتم تأكيد التحويل بعد. قد يستغرق تأكيد الشبكة دقيقة واحدة.");
      }
    } catch (err) {
      setIsVerifying(false);
      setVerificationError("حدث خطأ أثناء الاتصال بمنصة بينانس. يرجى المحاولة بعد لحظات.");
    }
  }

  const floatingButtonStyle = {
    position: "fixed" as const, right: "20px", borderRadius: "50%", width: "65px", height: "65px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", zIndex: 50, boxShadow: "0px 15px 25px rgba(0,0,0,0.8), inset 0px 5px 10px rgba(255,255,255,0.4), inset 0px -5px 10px rgba(0,0,0,0.5)", transition: "transform 0.2s ease"
  };

  return (
    <main className="min-h-screen relative pb-20 bg-[#0a0c10] text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 rounded-2xl border border-[#E8A33D]/60 bg-[#161a25]/95 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-bounce">
          <span className="text-[#E8A33D]">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
      {/* هيدر */}
      <header className="relative overflow-hidden border-b border-white/10 flex flex-col items-center justify-center py-16 bg-gradient-to-b from-[#161a27] to-[#0a0c10] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 -z-10 opacity-[0.08]">
          <div className="h-full w-full" style={{ backgroundImage: "repeating-linear-gradient(-45deg, #E8A33D 0, #E8A33D 2px, transparent 2px, transparent 25px)" }} />
        </div>
        <div className="mx-auto max-w-5xl px-6 text-center flex flex-col items-center">
          <h2 className="mb-3 font-display text-3xl tracking-[0.2em] text-[#E8A33D] font-bold drop-shadow-[0_2px_10px_rgba(232,163,61,0.5)]">{settings.website_name || "AI STORE"}</h2>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)]">{settings.hero_title}</h1>
          <p className="mt-4 max-w-3xl text-base text-white/70">{settings.hero_description}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {settings.hero_button_text && (
              <a 
                href={(() => {
                  const target = (settings.hero_button_url || "").trim();
                  const msg = (settings.hero_button_message || "").trim();
                  if (!target && !msg) return "#";
                  const cleanNum = target.replace(/[\s\+\-\(\)]/g, "");
                  if (/^\d{9,15}$/.test(cleanNum) && !target.startsWith("http")) {
                    return msg ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}` : `https://wa.me/${cleanNum}`;
                  }
                  if (target.includes("wa.me") || target.includes("whatsapp.com")) {
                    if (msg) {
                      const base = target.split("?")[0];
                      return `${base}?text=${encodeURIComponent(msg)}`;
                    }
                    return target;
                  }
                  return target || (msg ? `https://wa.me/201040248751?text=${encodeURIComponent(msg)}` : "#");
                })()} 
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-3xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-7 py-4 text-sm font-extrabold text-[#10131A] transition hover:brightness-110 shadow-lg"
              >
                {settings.hero_button_text}
              </a>
            )}

            {settings.hero_button2_text ? (
              <a 
                href={(() => {
                  const target = (settings.hero_button2_url || "").trim();
                  const msg = (settings.hero_button2_message || "").trim();
                  if (!target && !msg) return settings.contact_whatsapp || "#";
                  const cleanNum = target.replace(/[\s\+\-\(\)]/g, "");
                  if (/^\d{9,15}$/.test(cleanNum) && !target.startsWith("http")) {
                    return msg ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}` : `https://wa.me/${cleanNum}`;
                  }
                  if (target.includes("wa.me") || target.includes("whatsapp.com")) {
                    if (msg) {
                      const base = target.split("?")[0];
                      return `${base}?text=${encodeURIComponent(msg)}`;
                    }
                    return target;
                  }
                  return target || (msg ? `https://wa.me/201040248751?text=${encodeURIComponent(msg)}` : settings.contact_whatsapp);
                })()} 
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-3xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10 shadow-lg"
              >
                {settings.hero_button2_text}
              </a>
            ) : (
              <a 
                href={settings.contact_whatsapp} 
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-3xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Contact WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* المنتجات */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const isOutOfStock = p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0;
            return (
              <article 
                key={p.id} 
                className="flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:scale-[1.02] hover:border-[#E8A33D]/60 hover:shadow-[0_20px_40px_rgba(232,163,61,0.2)]"
              >
                <Link href={`/products/${p.id}`} className="h-48 sm:h-52 w-full relative overflow-hidden bg-black flex items-center justify-center p-4 group">
                  {/* Top floating Sales Count indicator badge */}
                  <div className="absolute top-3.5 right-3.5 z-10 inline-flex items-center rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-3.5 py-1.5 sm:px-3 sm:py-1 text-xs font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,0.9)]">
                    <span dir="rtl">المبيعات <strong className="text-[#E8A33D] font-mono text-sm font-black">{(Number(p.fake_sales_count) || 0) + (Number(p.sales_count) || 0)}</strong></span>
                  </div>

                  {/* Out of stock badge */}
                  {isOutOfStock && (
                    <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center rounded-full bg-rose-600/90 backdrop-blur-md border border-rose-400/50 px-3 py-1 text-xs font-black text-white shadow-lg">
                      نفد من المخزون
                    </div>
                  )}

                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className={`h-full w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "opacity-60 grayscale-[30%]" : ""}`} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                </Link>
                <div className="flex flex-col items-center text-center gap-2 p-5 pb-3">
                  <Link href={`/products/${p.id}`} className="group hover:text-[#E8A33D] transition">
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white drop-shadow-md group-hover:text-[#E8A33D] transition">{p.name}</h2>
                  </Link>
                  <div className="font-display text-lg sm:text-xl font-extrabold text-[#E8A33D] drop-shadow-[0_2px_8px_rgba(232,163,61,0.4)]">
                    {formatPrice(p.price, settings.currency, Number(settings.usdt_rate))}
                  </div>
                  <p className="mt-1 text-sm sm:text-[15px] font-medium text-white/85 line-clamp-2 leading-relaxed">{p.detail}</p>
                  <Link
                    href={`/products/${p.id}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#E8A33D] hover:underline hover:text-[#ffcc70] transition"
                  >
                    <span>عرض التفاصيل الكاملة</span>
                    <span className="text-xs">←</span>
                  </Link>
                </div>
                {isOutOfStock ? (
                  <div className="mt-auto p-5 pt-2">
                    <button 
                      disabled 
                      className="w-full rounded-2xl bg-white/10 border border-white/10 py-3 font-display text-sm font-bold text-white/40 cursor-not-allowed text-center shadow-inner"
                    >
                      نفد من المخزون حالياً
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto grid grid-cols-2 gap-2.5 p-5 pt-2">
                    <button 
                      onClick={() => handleDirectBuy(p)} 
                      className="rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] py-3 font-display text-sm font-extrabold text-[#10131A] transition-all hover:brightness-110 active:scale-95 shadow-[0_5px_15px_rgba(232,163,61,0.4),inset_0_2px_3px_rgba(255,255,255,0.4)]"
                    >
                      شراء
                    </button>
                    <button 
                      onClick={() => addToCart(p.id)} 
                      className="rounded-2xl border border-[#E8A33D]/60 bg-[#161a25] py-3 font-display text-sm font-bold text-[#E8A33D] transition-all hover:bg-[#E8A33D]/20 active:scale-95 shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)]"
                    >
                      إضافة للسلة
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* سلة المشتريات (بعد تعديل الأسعار) */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overscroll-contain"
          onClick={() => setIsCartOpen(false)}
        >
          <div 
            className="bg-gradient-to-b from-[#181d2a] to-[#10131d] border border-white/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/30">
              <h3 className="text-2xl font-bold text-white drop-shadow">سلة المشتريات</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-white/60 hover:text-white transition p-2 bg-white/5 rounded-full"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain touch-pan-y">
              {cartCount === 0 ? <div className="text-center text-white/50 py-12 text-lg">السلة فارغة حالياً</div> : 
                <div className="flex flex-col gap-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = products.find(x => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex flex-col bg-white/[0.04] p-4 rounded-2xl border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-12 h-12 object-contain bg-black/60 rounded-xl p-1 border border-white/10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <div>
                              <h4 className="text-white font-bold text-base">{p.name}</h4>
                              <div className="text-[#E8A33D] text-xs font-semibold mt-1">
                                {formatPrice(p.price, settings.currency, Number(settings.usdt_rate))}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/10 shadow-inner">
                            <button onClick={() => decreaseQuantity(id)} className="w-9 h-9 text-white font-bold hover:text-[#E8A33D] transition">-</button>
                            <span className="w-10 text-center text-white font-extrabold">{qty}</span>
                            <button onClick={() => addToCart(id)} className="w-9 h-9 text-white font-bold hover:text-[#E8A33D] transition">+</button>
                          </div>
                          <div className="text-[#E8A33D] font-extrabold text-sm">
                             {formatPrice(typeof p.price === 'number' ? p.price * qty : 0, settings.currency, Number(settings.usdt_rate))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              }
            </div>

            {cartCount > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/40 shadow-lg">
                <div className="flex justify-between items-center mb-5">
                  <span className="font-bold text-xl text-white">الإجمالي الكلي:</span>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-extrabold text-2xl text-[#E8A33D] drop-shadow">
                      {formatPrice(cartTotal, settings.currency, Number(settings.usdt_rate))}
                    </span>
                  </div>
                </div>
                <button onClick={handleCartCheckoutClick} className="w-full rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] py-4 font-display text-base font-extrabold text-[#10131A] transition-all hover:brightness-110 shadow-[0_10px_25px_rgba(232,163,61,0.4),inset_0_2px_4px_rgba(255,255,255,0.5)]">اختيار طريقة الدفع وإتمام الشراء</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة اختيار طرق الدفع (بعد تعديل الأزرار للموبايل) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#191e2b] to-[#11141e] border-2 border-[#E8A33D]/40 rounded-3xl w-full max-w-md p-8 shadow-[0_30px_60px_rgba(0,0,0,0.95)] flex flex-col gap-5 text-center">
            <h3 className="text-3xl font-extrabold text-white drop-shadow-md mb-1">اختر طريقة الدفع</h3>
            <p className="text-white/70 text-sm mb-2">اختر الدفع الفوري عبر بينانس، أو التحويل اليدوي عبر فودافون كاش / إنستاباي</p>

            {/* زر Binance */}
            <button 
              onClick={payViaBinance} 
              className="w-full rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#c77e20] py-4 px-4 font-display text-base sm:text-lg font-extrabold text-[#10131A] transition-all hover:brightness-110 shadow-lg flex items-center justify-center gap-3 active:scale-95"
            >
              <svg className="shrink-0" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 24l-7.071-7.071 2.828-2.828L12 18.343l4.243-4.242 2.828 2.828L12 24zm0-24l7.071 7.071-2.828 2.828L12 5.657 7.757 9.899 4.929 7.071 12 0zm7.071 16.971l-2.828-2.828 2.828-2.828 2.828 2.828-2.828 2.828zM4.929 16.971L2.1 14.143l2.828-2.828 2.828 2.828-2.828 2.828zm7.071-2.828l-2.828-2.828 2.828-2.828 2.828 2.828-2.828 2.828z"/>
              </svg>
              <span className="text-center leading-snug">الدفع الفوري عبر Binance Pay</span>
            </button>

            {/* زر Vodafone/WhatsApp */}
            <button 
              onClick={openVodafoneModal} 
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-4 px-3 font-display text-base sm:text-lg font-extrabold text-white transition-all hover:brightness-110 shadow-lg flex items-center justify-center gap-3 active:scale-95"
            >
              <svg className="shrink-0" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span className="text-center leading-snug">فودافون كاش / إنستاباي<br className="sm:hidden" /> (عبر الواتساب)</span>
            </button>

            <button 
              onClick={() => setIsPaymentModalOpen(false)} 
              className="mt-2 text-white/50 hover:text-white text-base font-semibold transition py-2"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* نافذة فودافون كاش */}
      {isVodafoneModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-gradient-to-b from-[#17211e] to-[#101413] border-2 border-emerald-600/50 rounded-3xl w-full max-w-md p-8 shadow-[0_30px_60px_rgba(0,0,0,0.95)] flex flex-col gap-5 text-right" dir="rtl">
                <div className="flex justify-center">
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    Vodafone Cash & InstaPay
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-white text-center">تفاصيل التحويل</h3>
                
                <div className="bg-black/60 border border-white/15 rounded-2xl p-4 text-center shadow-inner">
                    <span className="text-xs text-white/60 block mb-1">الرقم المعتمد للتحويل (فودافون كاش / إنستاباي):</span>
                    <span className="text-2xl font-mono font-bold tracking-widest text-emerald-400">01158413075</span>
                </div>

                {/* اختيار طريقة التحويل المستخدمة */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/80 font-bold">طريقة التحويل التي استخدمتها:</label>
                  <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/15 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setTransferMethod("instapay")}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                        transferMethod === "instapay"
                          ? "bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white shadow-md font-extrabold scale-[1.02] border border-purple-400/40"
                          : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span>⚡ إنستاباي (InstaPay)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferMethod("vodafone")}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                        transferMethod === "vodafone"
                          ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md font-extrabold scale-[1.02] border border-rose-400/40"
                          : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span>🔴 فودافون كاش</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/80 font-bold">رقم هاتفك الذي حولت منه:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: 010xxxxxxxx" 
                    value={senderPhone} 
                    onChange={(e) => {
                      setSenderPhone(e.target.value);
                      if (phoneError) setPhoneError("");
                    }} 
                    className={`w-full bg-black/60 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition placeholder:text-white/30 text-center font-mono ${
                      phoneError ? "border-rose-500 ring-2 ring-rose-500/30" : "border-white/20 focus:border-emerald-500"
                    }`} 
                  />
                  {phoneError && (
                    <p className="text-xs font-bold text-rose-400 mt-1 text-center animate-pulse">{phoneError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/80 font-bold">اسكرين شوت إيصال التحويل:</label>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full rounded-xl bg-white/5 py-3.5 px-4 text-sm text-white/70 border border-dashed border-white/30 hover:bg-white/10 transition text-center truncate shadow-inner"
                  >
                    {fileName ? `✓ تم اختيار: ${fileName}` : "اضغط لرفع صورة الإيصال (Screenshot)"}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <button 
                    onClick={payViaWhatsApp} 
                    disabled={isUploadingImage}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-4 font-display text-base font-extrabold text-white transition-all hover:brightness-110 shadow-lg active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    {isUploadingImage ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري رفع الإيصال للواتساب...</span>
                      </>
                    ) : (
                      "تأكيد وفتح الواتساب أوتوماتيكياً"
                    )}
                  </button>
                  <button onClick={closeVodafoneModal} className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-3 transition text-sm">
                    إلغاء
                  </button>
                </div>
            </div>
        </div>
      )}

      {/* نافذة بينانس / USDT مع التحقق التلقائي */}
      {isBinanceModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) closeBinanceModal(); }}
        >
          <div className="bg-gradient-to-b from-[#1b2131] to-[#11141e] border-2 border-[#E8A33D]/50 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4 text-center relative overflow-hidden max-h-[92vh] overflow-y-auto">
            
            {isVerifying ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-[#E8A33D] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white font-bold text-lg">جاري التحقق من شبكة بينانس لحظياً...</p>
                <p className="text-white/50 text-xs">نتحقق من وصول إيداع مطابق في محفظتك على بينانس</p>
              </div>
            ) : verificationResult === "success" ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]">✓</div>
                <h3 className="text-2xl font-black text-emerald-400">تم تأكيد الدفع بنجاح!</h3>
                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 w-full text-right text-xs space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>رقم الطلب:</span>
                    <span className="font-mono text-emerald-400">{currentCryptoOrder?.orderId || "CRYPTO-PAID"}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-bold text-white">{paymentAudit?.actualAmount ?? binanceUsdAmount} USDT</span>
                  </div>
                  {paymentAudit?.txHash && (
                    <div className="flex justify-between text-white/70">
                      <span>TxID:</span>
                      <span className="font-mono text-emerald-400 truncate max-w-[160px]" dir="ltr">{paymentAudit.txHash.slice(0,10)}...{paymentAudit.txHash.slice(-6)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/70">
                    <span>الحالة:</span>
                    <span className="text-emerald-400 font-bold">مكتمل وموثق في بينانس ✓</span>
                  </div>
                </div>
                <p className="text-white/70 text-xs">تم تسجيل طلبك وتوثيق الدفع في النظام بنجاح. سيتم تفعيل حسابك مباشرة!</p>
                
                <a
                  href={`${settings.contact_whatsapp || "https://wa.me/201040248751?text="}${encodeURIComponent(`السلام عليكم، تم الدفع بنجاح عبر بينانس بقيمة ${paymentAudit?.actualAmount ?? binanceUsdAmount} USDT\nرقم الطلب: ${currentCryptoOrder?.orderId || ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  <span>مراسلة الدعم وتفعيل الحساب</span>
                </a>
                <button 
                  onClick={closeBinanceModal}
                  className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 transition text-xs"
                >
                  إغلاق النافذة
                </button>
              </div>
            ) : verificationResult === "overpaid" ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-amber-500/20 border border-amber-500 text-amber-400 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)]">⚠️</div>
                <h3 className="text-xl font-black text-amber-400">تم تأكيد الدفع بنجاح!</h3>
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-2xl text-xs text-center leading-relaxed">
                  ⚠️ <strong>تنبيه:</strong> تم تحويل مبلغ زائد ({paymentAudit ? Math.abs(paymentAudit.difference).toFixed(4) : "0"} USDT). تم توثيق طلبك وتعيين علامة استرداد للمبلغ الزائد بالإدارة.
                </div>
                <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-4 w-full text-right text-xs space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>رقم الطلب:</span>
                    <span className="font-mono text-amber-400">{currentCryptoOrder?.orderId || "CRYPTO-PAID"}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المطلوب:</span>
                    <span className="font-bold text-white">{paymentAudit?.expectedAmount} USDT</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-bold text-amber-400">{paymentAudit?.actualAmount} USDT</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ الزائد:</span>
                    <span className="font-bold text-amber-300 font-mono">+{paymentAudit ? Math.abs(paymentAudit.difference).toFixed(4) : "0"} USDT</span>
                  </div>
                  {paymentAudit?.txHash && (
                    <div className="flex justify-between text-white/70">
                      <span>TxID:</span>
                      <span className="font-mono text-amber-400 truncate max-w-[160px]" dir="ltr">{paymentAudit.txHash.slice(0,10)}...{paymentAudit.txHash.slice(-6)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/70">
                    <span>الحالة:</span>
                    <span className="text-emerald-400 font-bold">مكتمل وموثق في بينانس ✓</span>
                  </div>
                </div>
                <p className="text-white/70 text-xs">تم تسجيل طلبك وتوثيق الدفع في النظام بنجاح. سيتم تفعيل حسابك مباشرة!</p>
                <a
                  href={`${settings.contact_whatsapp || "https://wa.me/201040248751?text="}${encodeURIComponent(`السلام عليكم، تم الدفع بنجاح عبر بينانس بقيمة ${paymentAudit?.actualAmount ?? binanceUsdAmount} USDT\nرقم الطلب: ${currentCryptoOrder?.orderId || ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  <span>مراسلة الدعم وتفعيل الحساب</span>
                </a>
                <button onClick={closeBinanceModal} className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 transition text-xs">
                  إغلاق النافذة
                </button>
              </div>
            ) : verificationResult === "underpaid" ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)]">✗</div>
                <h3 className="text-xl font-black text-rose-400">المبلغ المحول أقل من المطلوب</h3>
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs text-center leading-relaxed">
                  لم يتم تأكيد الطلب لأن المبلغ المحول ناقص بمقدار ({paymentAudit ? Math.abs(paymentAudit.difference).toFixed(4) : "0"} USDT). يرجى تحويل المتبقي.
                </div>
                <div className="bg-black/60 border border-rose-500/30 rounded-2xl p-4 w-full text-right text-xs space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>رقم الطلب:</span>
                    <span className="font-mono text-rose-400">{currentCryptoOrder?.orderId || "CRYPTO-PENDING"}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المطلوب:</span>
                    <span className="font-bold text-white">{paymentAudit?.expectedAmount} USDT</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-bold text-rose-400">{paymentAudit?.actualAmount} USDT</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المتبقي:</span>
                    <span className="font-bold text-rose-300 font-mono">-{paymentAudit ? Math.abs(paymentAudit.difference).toFixed(4) : "0"} USDT</span>
                  </div>
                  {paymentAudit?.txHash && (
                    <div className="flex justify-between text-white/70">
                      <span>TxID:</span>
                      <span className="font-mono text-rose-400 truncate max-w-[160px]" dir="ltr">{paymentAudit.txHash.slice(0,10)}...{paymentAudit.txHash.slice(-6)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/70">
                    <span>الحالة:</span>
                    <span className="text-rose-400 font-bold">معلق (غير مكتمل) ✗</span>
                  </div>
                </div>
                <a
                  href={`${settings.contact_whatsapp || "https://wa.me/201040248751?text="}${encodeURIComponent(`السلام عليكم، قمت بتحويل ${paymentAudit?.actualAmount} USDT والمبلغ المطلوب هو ${paymentAudit?.expectedAmount} USDT (المتبقي: ${paymentAudit ? Math.abs(paymentAudit.difference).toFixed(4) : ""} USDT)\nرقم الطلب: ${currentCryptoOrder?.orderId || ""}\nTxID: ${paymentAudit?.txHash || ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 transition flex items-center justify-center gap-2 shadow-lg active:scale-95 text-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  <span>التحدث مع الدعم عبر الواتساب</span>
                </a>
                <button onClick={closeBinanceModal} className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 transition text-xs">
                  إغلاق النافذة
                </button>
              </div>
            ) : verificationResult === "exhausted" || isFailedExhausted ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)]">✕</div>
                <h3 className="text-xl font-black text-rose-400">تعذر التحقق من الدفع تلقائياً</h3>
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs text-center leading-relaxed">
                  لم يتم تأكيد رمز المعاملة بعد محاولتين. يمكنك التحدث مع الدعم الفني عبر الواتساب لتأكيد العملية وتفعيل حسابك، أو إعادة المحاولة بعد دقيقة.
                </div>
                <div className="bg-black/60 border border-rose-500/30 rounded-2xl p-4 w-full text-right text-xs space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>رقم الطلب:</span>
                    <span className="font-mono text-rose-400">{currentCryptoOrder?.orderId || "CRYPTO-SUPPORT"}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>المبلغ المطلوب:</span>
                    <span className="font-bold text-white">{binanceUsdAmount} USDT</span>
                  </div>
                  {txIdInput.trim() && (
                    <div className="flex justify-between text-white/70">
                      <span>TxID المدخل:</span>
                      <span className="font-mono text-rose-400 truncate max-w-[160px]" dir="ltr">{txIdInput.trim()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/70">
                    <span>حالة الطلب:</span>
                    <span className="text-amber-400 font-bold">بانتظار تأكيد الدعم اليدوي</span>
                  </div>
                </div>
                <a
                  href={`${settings.contact_whatsapp || "https://wa.me/201040248751?text="}${encodeURIComponent(
                    `السلام عليكم، قمت بتحويل ${binanceUsdAmount} USDT ولم يتأكد تلقائياً بعد محاولتين\nرقم الطلب: ${currentCryptoOrder?.orderId || ""}\nTxID: ${txIdInput.trim()}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 transition flex items-center justify-center gap-2 shadow-lg active:scale-95 text-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  <span>التحدث مع الدعم عبر الواتساب لتأكيد الطلب</span>
                </a>

                {retryCooldown > 0 ? (
                  <div className="w-full rounded-2xl bg-white/5 border border-white/10 text-white/60 py-2.5 text-xs text-center font-mono">
                    ⏳ يمكنك إعادة المحاولة بعد ({retryCooldown} ثانية)
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setVerificationResult(null);
                      setIsFailedExhausted(false);
                      setTxIdInput("");
                      try {
                        localStorage.removeItem("crypto_fail_count");
                        localStorage.removeItem("crypto_cooldown_until");
                      } catch {}
                    }}
                    className="w-full rounded-2xl bg-[#E8A33D]/20 border border-[#E8A33D]/40 hover:bg-[#E8A33D]/30 text-[#E8A33D] font-bold py-3 transition text-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>⚡ إعادة المحاولة وإدخال كود جديد</span>
                  </button>
                )}

                <button onClick={closeBinanceModal} className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 transition text-xs">
                  إغلاق النافذة
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="bg-[#E8A33D]/15 text-[#E8A33D] border border-[#E8A33D]/30 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    BINANCE & CRYPTO PAY
                  </span>
                </div>
                
                <h3 className="text-2xl font-extrabold text-white tracking-wide">الدفع الفوري بالكريبتو</h3>
                
                <div className="bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 shadow-inner">
                  <span className="text-xs text-white/60 block mb-0.5">المبلغ المطلوب تحويله:</span>
                  <span className="text-2xl font-black text-[#E8A33D] tracking-wide">{binanceUsdAmount} USDT</span>
                </div>

                {/* اختيار الشبكة */}
                <div className="flex flex-col gap-1.5 text-right">
                  <label className="text-xs text-white/80 font-bold">اختر طريقة التحويل:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Binance Pay ID — always first */}
                    <button
                      type="button"
                      onClick={() => setSelectedNetwork("PAY_ID")}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                        selectedNetwork === "PAY_ID" ? "bg-[#E8A33D] text-[#10131A] border-[#E8A33D] shadow-md font-black" : "bg-black/50 text-white/80 border-white/10 hover:border-white/30"
                      }`}
                    >
                      Binance Pay ID
                    </button>

                    {cryptoAddresses.length > 0 ? (
                      cryptoAddresses
                        .filter((net) => net.networkId !== "TRX")
                        .map((net) => (
                          <button
                            key={net.networkId}
                            type="button"
                            onClick={() => setSelectedNetwork(net.networkId)}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                              selectedNetwork === net.networkId
                                ? "bg-[#E8A33D] text-[#10131A] border-[#E8A33D] shadow-md font-black"
                                : "bg-black/50 text-white/80 border-white/10 hover:border-white/30"
                            }`}
                          >
                            {net.networkId === "BSC" ? "USDT (BEP20)" : net.networkId}
                          </button>
                        ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork("BSC")}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                            selectedNetwork === "BSC" ? "bg-[#E8A33D] text-[#10131A] border-[#E8A33D]" : "bg-black/50 text-white/80 border-white/10"
                          }`}
                        >
                          USDT (BEP20)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork("APT")}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                            selectedNetwork === "APT" ? "bg-[#E8A33D] text-[#10131A] border-[#E8A33D]" : "bg-black/50 text-white/80 border-white/10"
                          }`}
                        >
                          APT
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* عنوان المحفظة أو Pay ID مع QR Code */}
                {selectedNetwork === "PAY_ID" ? (
                  <div className="flex flex-col gap-3">
                    {/* Binance Pay ID display */}
                    <div className="bg-black/70 border border-[#E8A33D]/30 rounded-2xl p-4 flex items-center justify-between w-full shadow-inner">
                      <button 
                        onClick={copyBinanceId}
                        className="bg-[#E8A33D] hover:bg-[#d69230] text-[#10131A] font-bold text-xs px-3.5 py-2 rounded-xl transition shadow active:scale-95"
                      >
                        {copied ? "تم النسخ! ✓" : "نسخ الـ ID"}
                      </button>
                      <div className="text-right">
                        <span className="text-[10px] text-white/50 block">Binance Pay ID:</span>
                        <span className="font-mono text-xl font-black tracking-widest text-[#E8A33D]">{myBinancePayId}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="bg-white rounded-2xl p-2 flex items-center justify-center mx-auto w-32 h-32 shadow-lg">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(activeCryptoAddress)}`}
                        alt="USDT QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-black/70 border border-white/15 rounded-2xl p-3 flex items-center justify-between shadow-inner gap-2">
                      <div className="text-right truncate flex-1">
                        <span className="text-[10px] text-white/50 block">عنوان المحفظة ({selectedNetwork === "BSC" ? "BEP20" : selectedNetwork}):</span>
                        <span className="font-mono text-[11px] font-bold tracking-tight text-[#E8A33D] truncate block">{activeCryptoAddress}</span>
                      </div>
                      <button 
                        onClick={copyWalletAddress}
                        className="bg-[#E8A33D] hover:bg-[#d69230] text-[#10131A] font-bold text-xs px-3 py-2 rounded-xl transition shadow active:scale-95 shrink-0"
                      >
                        {copiedAddress ? "تم النسخ! ✓" : "نسخ العنوان"}
                      </button>
                    </div>
                  </div>
                )}

                {/* حقل TXID الاختياري للتسريع */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[11px] text-white/70">رقم المعاملة / TxID (اختياري لتسريع التحقق الفوري):</label>
                  <input 
                    type="text" 
                    value={txIdInput}
                    onChange={(e) => setTxIdInput(e.target.value)}
                    placeholder="مثال: 0x94f3ef... أو معرّف التحويل" 
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#E8A33D] transition placeholder:text-white/30 text-center font-mono"
                  />
                </div>

                {verificationError && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-2.5 rounded-xl text-xs text-center leading-relaxed">
                    {verificationError}
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-1">
                  <button 
                    onClick={verifyBinancePayment}
                    disabled={retryCooldown > 0}
                    className={`w-full rounded-2xl py-3.5 font-display text-sm font-extrabold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                      retryCooldown > 0
                        ? "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#E8A33D] to-[#d69230] text-[#10131A] hover:brightness-110"
                    }`}
                  >
                    {retryCooldown > 0 ? (
                      <span>⏳ انتظر ({retryCooldown} ثانية) لإعادة الفحص...</span>
                    ) : (
                      <span>⚡ تحقق من الدفع تلقائياً</span>
                    )}
                  </button>

                  <button 
                    onClick={closeBinanceModal}
                    className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 transition text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* زر السلة العائم */}
      <button onClick={() => setIsCartOpen(true)} style={{ ...floatingButtonStyle, bottom: "24px", background: "linear-gradient(135deg, #E8A33D 0%, #b87a20 100%)", color: "#10131A" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs text-white font-black border-2 border-[#10131A] shadow-lg animate-pulse">{cartCount}</span>}
      </button>
    </main>
  );
}
