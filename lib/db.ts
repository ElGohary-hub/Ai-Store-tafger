import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbFile = join(dataDir, "cms.db");
const db = new Database(dbFile);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'super-admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  original_price REAL DEFAULT 0,
  discount_enabled INTEGER NOT NULL DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  best_seller INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  stock INTEGER DEFAULT 0,
  category_id INTEGER,
  image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total REAL NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  orders_count INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  last_order_at DATETIME
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  button_text TEXT,
  button_url TEXT,
  image TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata TEXT
);
`);

function getCount(query: string) {
  return Number(db.prepare(query).pluck().get());
}

export function getAdminByEmail(email: string) {
  return db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
}

export function createAdmin(email: string, password: string, role = "super-admin") {
  return db.prepare("INSERT INTO admins (email, password, role) VALUES (?, ?, ?)").run(email, password, role);
}

function insertSetting(key: string, value: string) {
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

function seedDefaultData() {
  const existingProducts = getCount("SELECT COUNT(*) FROM products");
  const existingSettings = getCount("SELECT COUNT(*) FROM settings");
  const existingCategories = getCount("SELECT COUNT(*) FROM categories");

  if (existingCategories === 0) {
    const categoryStmt = db.prepare("INSERT INTO categories (name, slug, image, visible, sort_order) VALUES (?, ?, ?, ?, ?)");
    categoryStmt.run("اشتراكات AI", "ai-subscriptions", "/p3.png", 1, 0);
  }

  if (existingProducts === 0) {
    const category = db.prepare("SELECT id FROM categories WHERE slug = ?").get("ai-subscriptions");
    const categoryId = category?.id ?? null;
    const productStmt = db.prepare(`INSERT INTO products (sku, name, description, price, original_price, discount_enabled, discount_percentage, featured, best_seller, is_new, visible, stock, category_id, image, sort_order, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const products = [
      ["canva", "Canva Pro", "اشتراك Canva Pro مدى الحياة والدفع بعد التفعيل. يتم التفعيل على حسابك الشخصي وبشكل رسمي من كانفا!", 70, 140, 1, 50, 1, 1, 1, 1, 999, categoryId, "/p3.png", 0, "canva,design"],
      ["google", "Google Plan", "تشمل: Gemini Pro, Antigravity, Nano Banana, NotebookLM, 5TB تخزين سحابي, Google Flow 1000 Credit/M", 70, 140, 1, 50, 1, 1, 1, 1, 999, categoryId, "/p4.png", 1, "google,ai"],
      ["capcut", "CapCut", "التفعيل لمدة شهر فقط، تستلم حساب خاص فيك متفعل جاهز", 70, 0, 0, 0, 0, 1, 0, 1, 50, categoryId, "/p10.png", 2, "capcut,video"],
      ["coursera", "Coursera", "باقة البلص، كل الكورسات مفتوحة، يتم ارسال حساب خاص فيك متفعل جاهز", 70, 0, 0, 0, 0, 0, 1, 1, 50, categoryId, "/p6.png", 3, "coursera,education"],
      ["office", "Microsoft Office 365", "باقة البلص، 5 أجهزة، 100 جيجابايت ون درايف، تفعيل 12 شهر (ويندوز فقط)", 70, 0, 0, 0, 0, 0, 1, 1, 50, categoryId, "/p5.png", 4, "office,productivity"],
      ["leonardo", "Leonardo Ai", "شهر واحد وصول كامل، 8500 رصيد، حساب خاص بك، تفعيل مباشر", 70, 0, 0, 0, 0, 1, 1, 1, 50, categoryId, "/p16.png", 5, "leonardo,ai"],
      ["notion", "Notion", "باقة البلص، باقي التفاصيل كلمني", 70, 0, 0, 0, 0, 0, 1, 0, 50, categoryId, "/p13.png", 6, "notion,productivity"],
      ["adobe", "Adobe Express", "عضوية مميزة لمدة 12 شهر، لا حاجة لـ VPN أو VISA، تفعيل مباشر", 70, 0, 0, 0, 0, 0, 1, 0, 50, categoryId, "/p14.png", 7, "adobe,design"],
      ["gamma", "Gamma Ai", "حسب الباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 1, 0, 50, categoryId, "/p11.png", 8, "gamma,ai"],
      ["youtube", "YouTube", "حسب المدة والباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 0, 0, 50, categoryId, "/p12.png", 9, "youtube,subscription"],
      ["chatgpt", "ChatGPT", "حسب المدة والباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 1, 1, 50, categoryId, "/p15.png", 10, "chatgpt,ai"],
      ["claude", "Claude", "حسب الباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 0, 0, 50, categoryId, "/p7.png", 11, "claude,ai"],
      ["manus", "Manus", "حسب الباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 0, 0, 50, categoryId, "/p1.png", 12, "manus,writing"],
      ["higgsfield", "Higgsfield", "حسب الباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 0, 0, 50, categoryId, "/p2.png", 13, "higgsfield,ai"],
      ["grok", "Grok", "حسب الباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 0, 0, 50, categoryId, "/p8.png", 14, "grok,ai"],
      ["figma", "Figma", "حسب الباقة، تواصل معي للتفاصيل", 70, 0, 0, 0, 0, 0, 0, 0, 50, categoryId, "/p9.png", 15, "figma,design"],
    ];
    for (const product of products) {
      productStmt.run(...product);
    }
  }

  if (existingSettings === 0) {
    insertSetting("website_name", "AI STORE");
    insertSetting("hero_title", "اختر الباقة المناسبة لك");
    insertSetting("hero_description", "اشتراكات مدعومة بتفعيل احترافي وخدمة عملاء سريعة.");
    insertSetting("hero_image", "/p3.png");
    insertSetting("hero_button_text", "اطلب الآن");
    insertSetting("hero_button_url", "https://wa.me/201158413075?text=مرحباً");
    insertSetting("contact_whatsapp", "https://wa.me/201158413075?text=مرحباً");
    insertSetting("contact_phone", "01158413075");
    insertSetting("contact_email", "info@aistore.com");
    insertSetting("facebook_url", "#");
    insertSetting("instagram_url", "#");
    insertSetting("telegram_url", "#");
    insertSetting("currency", "ج.م");
    insertSetting("footer_text", "© 2026 AI STORE. جميع الحقوق محفوظة.");
    insertSetting("seo_title", "AI STORE - اشتراكات الذكاء الاصطناعي");
    insertSetting("seo_description", "أفضل باقات AI STORE مع تفعيل فوري وخدمة عملاء محترفة.");
  }

  const existingHomepage = getCount("SELECT COUNT(*) FROM homepage_sections");
  if (existingHomepage === 0) {
    const sectionStmt = db.prepare(`INSERT INTO homepage_sections (section_key, title, description, button_text, button_url, image, visible, sort_order, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    sectionStmt.run("hero", "اختر الباقة المناسبة لك", "جميع الاشتراكات المميزة من أفضل الخدمات التقنية المتاحة الآن.", "اطلب الآن", "https://wa.me/201158413075?text=مرحباً", "/p3.png", 1, 0, NULL);
    sectionStmt.run("featured", "منتجات مميزة", "تابع أفضل المنتجات وأسهل العروض في متجر AI STORE.", "عرض المنتجات", "/#products", NULL, 1, 1, NULL);
  }
}

export function ensureDefaultAdmin() {
  const admin = getAdminByEmail("admin@aistore.com");
  if (!admin) {
    const { hashPassword } = require("./security");
    const password = hashPassword("Admin1234!");
    createAdmin("admin@aistore.com", password, "super-admin");
  }
}

ensureDefaultAdmin();
seedDefaultData();

export default db;
