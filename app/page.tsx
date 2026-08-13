"use client";

import { useEffect, useMemo, useState, useRef } from "react";

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
};

type SettingsState = {
  website_name?: string;
  hero_title: string;
  hero_description: string;
  hero_image: string;
  hero_button_text: string;
  hero_button_url: string;
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
  hero_button_url: "https://wa.me/201158413075?text=مرحباً",
  contact_whatsapp: "https://wa.me/201158413075?text=مرحباً",
  contact_phone: "01158413075",
  contact_email: "info@aistore.com",
  currency: "ج.م",
  usdt_rate: "50",
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: "canva", name: "Canva Pro", detail: "اشتراك Canva Pro مدي الحياه والدفع بعد التفعيل. يتم التفعيل علي حسابك الشخصي وبشكل رسمي من كانفا!", price: 70, image: "/p3.png" },
  { id: "google", name: "Google Plan", detail: "تشمل: Gemini Pro, Antigravity, Nano Banana, NotebookLM, 5TB تخزين سحابي, Google Flow 1000 Credit/M", price: 70, image: "/p4.png" },
  { id: "capcut", name: "CapCut", detail: "التفعيل لمدة شهر فقط، تستلم حساب خاص فيك متفعل جاهز", price: 70, image: "/p10.png" },
  { id: "coursera", name: "Coursera", detail: "باقة البلص، كل الكورسات مفتوحة، يتم ارسال حساب خاص فيك متفعل جاهز", price: 70, image: "/p6.png" },
  { id: "office", name: "Microsoft Office 365", detail: "باقة البلص، 5 أجهزة، 100 جيجابايت ون درايف، تفعيل 12 شهر (ويندوز فقط)", price: 70, image: "/p5.png" },
  { id: "leonardo", name: "Leonardo Ai", detail: "شهر واحد وصول كامل، 8500 رصيد، حساب خاص بك، تفعيل مباشر", price: 70, image: "/p16.png" },
  { id: "notion", name: "Notion", detail: "باقة البلص، باقي التفاصيل كلمني", price: 70, image: "/p13.png" },
  { id: "adobe", name: "Adobe Express", detail: "عضوية مميزة لمدة 12 شهر، لا حاجة لـ VPN أو VISA، تفعيل مباشر", price: 70, image: "/p14.png" },
  { id: "gamma", name: "Gamma Ai", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p11.png" },
  { id: "youtube", name: "YouTube", detail: "حسب المدة والباقة، تواصل معي للتفاصيل", price: 70, image: "/p12.png" },
  { id: "chatgpt", name: "ChatGPT", detail: "حسب المدة والباقة، تواصل معي للتفاصيل", price: 70, image: "/p15.png" },
  { id: "claude", name: "Claude", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p7.png" },
  { id: "manus", name: "Manus", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p1.png" },
  { id: "higgsfield", name: "Higgsfield", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p2.png" },
  { id: "grok", name: "Grok", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p8.png" },
  { id: "figma", name: "Figma", detail: "حسب الباقة، تواصل معي للتفاصيل", price: 70, image: "/p9.png" },
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
  
  const [copied, setCopied] = useState(false);
  const [txIdInput, setTxIdInput] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"success" | "error" | null>(null);

  const [selectedProductForBuy, setSelectedProductForBuy] = useState<Product | null>(null);
  const [isCheckoutFromCart, setIsCheckoutFromCart] = useState(false);

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

  function addToCart(id: string) { setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })); }
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
      alert("يرجى إدخال رقم هاتفك المحول منه أولاً!"); 
      return; 
    }
    
    let orderText = "السلام عليكم ورحمة الله وبركاتة\nأرغب في تأكيد طلب شراء:\n";
    
    if (isCheckoutFromCart) {
        Object.entries(cart).forEach(([id, qty]) => {
            const p = products.find(x => x.id === id);
            if (p) orderText += `- ${p.name} x${qty}\n`;
        });
        orderText += `\nالإجمالي الكلي:${cartTotal} ${settings.currency || "ج.م"}\n\nرقم الهاتف المحول منه:${senderPhone}`;
    } else if (selectedProductForBuy) {
        orderText += `-${selectedProductForBuy.name}\nالسعر:${selectedProductForBuy.price} ${settings.currency || "ج.م"}\nرقم الهاتف المحول منه:${senderPhone}`;
    }

    if (receiptFile) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("reqtype", "fileupload");
        formData.append("fileToUpload", receiptFile);

        const response = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: formData,
        });
        const imageUrl = await response.text();
        if (imageUrl && imageUrl.startsWith("http")) {
          orderText += `\n\nرابط إيصال التحويل المرفق:\n${imageUrl}`;
        }
      } catch (err) {
        console.error("Upload error", err);
      }
      setIsUploadingImage(false);
    }

    window.open(`${settings.contact_whatsapp || "https://wa.me/201158413075?text="}${encodeURIComponent(orderText)}`, "_blank");
    setIsVodafoneModalOpen(false);
    setIsPaymentModalOpen(false);
  }

  const [cryptoAddresses, setCryptoAddresses] = useState<Array<{ networkId: string; networkName: string; address: string; tag: string; isPopular?: boolean }>>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("TRX");
  const [currentCryptoOrder, setCurrentCryptoOrder] = useState<any>(null);
  const [verificationError, setVerificationError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    async function fetchCryptoAddresses() {
      try {
        const res = await fetch("/api/public/crypto/addresses");
        if (res.ok) {
          const data = await res.json();
          if (data.addresses && data.addresses.length > 0) {
            setCryptoAddresses(data.addresses);
            setSelectedNetwork(data.addresses[0].networkId);
          }
        }
      } catch (err) {
        console.error("Failed to load crypto addresses", err);
      }
    }
    fetchCryptoAddresses();
  }, []);

  const activeCryptoAddress = useMemo(() => {
    return cryptoAddresses.find(a => a.networkId === selectedNetwork)?.address || "TN9kZMYS53JbuHQbsGPGDvJXD4gUhPVZi7";
  }, [cryptoAddresses, selectedNetwork]);

  function openVodafoneModal() {
    setIsPaymentModalOpen(false);
    setIsVodafoneModalOpen(true);
  }

  async function payViaBinance() {
    setIsPaymentModalOpen(false);
    setIsBinanceModalOpen(true);
    setVerificationResult(null);
    setVerificationError("");

    // Create a pending crypto order in backend
    try {
      const productName = isCheckoutFromCart
        ? `سلة مشتريات (${cartCount} منتجات)`
        : (selectedProductForBuy?.name || "اشتراك AI");
      const prodId = isCheckoutFromCart ? "cart" : (selectedProductForBuy?.id || "product");

      const res = await fetch("/api/public/crypto/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "عميل المتجر",
          customerPhone: senderPhone || "",
          productId: prodId,
          productName,
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
    setIsVerifying(true);
    setVerificationError("");
    setVerificationResult(null);

    const orderId = currentCryptoOrder?.orderId;
    if (!orderId) {
      // Create order first if not yet created
      setVerificationError("يرجى إعادة المحاولة");
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch("/api/public/crypto/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          txHash: txIdInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      setIsVerifying(false);

      if (data.verified) {
        setVerificationResult("success");
      } else {
        setVerificationError(data.message || "لم يتم تأكيد التحويل بعد. قد يستغرق تأكيد الشبكة 1-2 دقيقة.");
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
            <a href={settings.hero_button_url} className="rounded-3xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-7 py-4 text-sm font-extrabold text-[#10131A] transition hover:brightness-110">{settings.hero_button_text}</a>
            <a href={settings.contact_whatsapp} className="rounded-3xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10">Contact WhatsApp</a>
          </div>
        </div>
      </header>

      {/* المنتجات */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article 
              key={p.id} 
              className="flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:scale-[1.03] hover:border-[#E8A33D]/60 hover:shadow-[0_20px_40px_rgba(232,163,61,0.2)]"
            >
              <div className="h-56 w-full relative overflow-hidden bg-black flex items-center justify-center p-4">
                 <img src={p.image} alt={p.name} className="h-full w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] transition-transform duration-500 hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-6 pb-3">
                <h2 className="font-display text-2xl font-bold text-white drop-shadow-md">{p.name}</h2>
                <div className="font-display text-xl font-extrabold text-[#E8A33D] drop-shadow-[0_2px_8px_rgba(232,163,61,0.4)]">
                  {formatPrice(p.price, settings.currency, Number(settings.usdt_rate))}
                </div>
                <p className="mt-1 text-sm text-white/70 line-clamp-3 leading-relaxed">{p.detail}</p>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3 p-6 pt-2">
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
            </article>
          ))}
        </div>
      </section>

      {/* سلة المشتريات (بعد تعديل الأسعار) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#181d2a] to-[#10131d] border border-white/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/30">
              <h3 className="text-2xl font-bold text-white drop-shadow">سلة المشتريات</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-white/60 hover:text-white transition p-2 bg-white/5 rounded-full"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
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
                    <span className="text-xs text-white/60 block mb-1">الرقم المعتمد للتحويل:</span>
                    <span className="text-2xl font-mono font-bold tracking-widest text-emerald-400">01158413075</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/80 font-bold">رقم هاتفك الذي حولت منه:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: 010xxxxxxxx" 
                    value={senderPhone} 
                    onChange={(e) => setSenderPhone(e.target.value)} 
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-white/30 text-center font-mono" 
                  />
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
                  <button onClick={() => setIsVodafoneModalOpen(false)} className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-3 transition text-sm">
                    إلغاء
                  </button>
                </div>
            </div>
        </div>
      )}

      {/* نافذة بينانس / USDT مع التحقق التلقائي */}
      {isBinanceModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
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
                    <span>المبلغ المستلم:</span>
                    <span className="font-bold text-white">{binanceUsdAmount} USDT</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>الحالة:</span>
                    <span className="text-emerald-400 font-bold">مكتمل وموثق في بينانس ✓</span>
                  </div>
                </div>
                <p className="text-white/70 text-xs">تم تسجيل طلبك وتوثيق الدفع في النظام بنجاح. سيتم تفعيل حسابك مباشرة!</p>
                
                <a
                  href={`${settings.contact_whatsapp || "https://wa.me/201158413075?text="}${encodeURIComponent(`السلام عليكم، تم الدفع بنجاح عبر بينانس بقيمة ${binanceUsdAmount} USDT\nرقم الطلب: ${currentCryptoOrder?.orderId || ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>مراسلة الدعم وتفعيل الحساب</span>
                </a>

                <button 
                  onClick={() => setIsBinanceModalOpen(false)}
                  className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 transition text-xs"
                >
                  إلغاء النافذة
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
                  <label className="text-xs text-white/80 font-bold">اختر شبكة التحويل:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {cryptoAddresses.length > 0 ? (
                      cryptoAddresses.map((net) => (
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
                          {net.networkId === "TRX" ? "USDT (TRC20)" : net.networkId === "BSC" ? "USDT (BEP20)" : net.networkId}
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork("TRX")}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                            selectedNetwork === "TRX" ? "bg-[#E8A33D] text-[#10131A] border-[#E8A33D]" : "bg-black/50 text-white/80 border-white/10"
                          }`}
                        >
                          USDT (TRC20)
                        </button>
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
                          onClick={() => setSelectedNetwork("PAY_ID")}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                            selectedNetwork === "PAY_ID" ? "bg-[#E8A33D] text-[#10131A] border-[#E8A33D]" : "bg-black/50 text-white/80 border-white/10"
                          }`}
                        >
                          Binance Pay ID
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* عنوان المحفظة أو Pay ID مع QR Code */}
                {selectedNetwork === "PAY_ID" ? (
                  <div className="bg-black/70 border border-white/15 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
                    <div className="text-right">
                      <span className="text-[10px] text-white/50 block">Binance Pay ID:</span>
                      <span className="font-mono text-base font-bold tracking-wider text-[#E8A33D]">{myBinancePayId}</span>
                    </div>
                    <button 
                      onClick={copyBinanceId}
                      className="bg-[#E8A33D] hover:bg-[#d69230] text-[#10131A] font-bold text-xs px-3.5 py-2 rounded-xl transition shadow active:scale-95"
                    >
                      {copied ? "تم النسخ! ✓" : "نسخ الـ ID"}
                    </button>
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
                        <span className="text-[10px] text-white/50 block">عنوان المحفظة ({selectedNetwork === 'TRX' ? 'TRC20' : selectedNetwork === 'BSC' ? 'BEP20' : selectedNetwork}):</span>
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
                    className="w-full rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] py-3.5 font-display text-sm font-extrabold text-[#10131A] transition-all hover:brightness-110 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>⚡ تحقق من الدفع تلقائياً</span>
                  </button>

                  <button 
                    onClick={() => setIsBinanceModalOpen(false)}
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
      <button onClick={() => setIsCartOpen(true)} style={{ ...floatingButtonStyle, bottom: "100px", background: "linear-gradient(135deg, #E8A33D 0%, #b87a20 100%)", color: "#10131A" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs text-white font-black border-2 border-[#10131A] shadow-lg animate-pulse">{cartCount}</span>}
      </button>

      {/* زر الواتساب العائم */}
      <a href={settings.contact_whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...floatingButtonStyle, bottom: "20px", background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      </a>
    </main>
  );
}
