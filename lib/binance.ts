import crypto from "crypto";

const BINANCE_BASE_URL = "https://api.binance.com";

let serverTimeOffset = 0;
let lastTimeSync = 0;

export async function getSyncedTimestamp(): Promise<number> {
  const now = Date.now();
  if (now - lastTimeSync > 60 * 1000 || serverTimeOffset === 0) {
    try {
      const res = await fetch(`${BINANCE_BASE_URL}/api/v3/time`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.serverTime === "number") {
          serverTimeOffset = data.serverTime - Date.now();
          lastTimeSync = now;
        }
      }
    } catch {
      // fallback to system time if network blips
    }
  }
  return Date.now() + serverTimeOffset;
}

function getApiKey(): string {
  return (process.env.BINANCE_API_KEY || "").trim();
}

function getSecretKey(): string {
  return (process.env.BINANCE_SECRET_KEY || "").trim();
}

function generateSignature(queryString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

export interface UnifiedDeposit {
  id: string;
  txId: string;
  amount: string;
  coin: string;
  network: string;
  status: number; // 1 = success
  completeTime: number;
  payerBinanceId?: string;
  receiverBinanceId?: string;
  address?: string;
  raw?: any;
}

export async function getDepositAddress(
  coin = "USDT",
  network?: string
): Promise<{ address: string; coin: string; tag: string; url: string }> {
  const apiKey = getApiKey();
  const secretKey = getSecretKey();

  if (apiKey && secretKey) {
    try {
      const timestamp = await getSyncedTimestamp();
      const queryParams: Record<string, string> = {
        coin,
        timestamp: timestamp.toString(),
        recvWindow: "60000",
      };
      if (network) queryParams.network = network;

      const queryString = new URLSearchParams(queryParams).toString();
      const signature = generateSignature(queryString, secretKey);
      const fullUrl = `${BINANCE_BASE_URL}/sapi/v1/capital/deposit/address?${queryString}&signature=${signature}`;

      const res = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": apiKey,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch deposit address from Binance live API, falling back to static config:", e);
    }
  }

  // Fallback to static addresses from environment
  let address = "";
  if (network === "TRX") address = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "TN9kZMYS53JbuHQbsGPGDvJXD4gUhPVZi7";
  else if (network === "BSC") address = process.env.NEXT_PUBLIC_USDT_BEP20_ADDRESS || "0xfa90bd46019435b0aa3d0bc69ee2bf5a432e2806";
  else if (network === "APT") address = process.env.NEXT_PUBLIC_USDT_APT_ADDRESS || "0xa236707d87a33bed07e75aed59471c605c22846ddd1f464e9ee9910383dbf528";
  else address = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "TN9kZMYS53JbuHQbsGPGDvJXD4gUhPVZi7";

  return { address, coin, tag: "", url: "" };
}

/**
 * Fetch on-chain blockchain deposits (APT, BSC, TRC20, etc.)
 */
export async function getDepositHistory(params: {
  coin?: string;
  status?: number;
  startTime?: number;
  endTime?: number;
  offset?: number;
  limit?: number;
  txId?: string;
}): Promise<UnifiedDeposit[]> {
  const apiKey = getApiKey();
  const secretKey = getSecretKey();

  if (!apiKey || !secretKey) {
    throw new Error("Binance API credentials (BINANCE_API_KEY, BINANCE_SECRET_KEY) are missing in environment.");
  }

  const timestamp = await getSyncedTimestamp();
  const queryParams: Record<string, string> = {
    timestamp: timestamp.toString(),
    recvWindow: "60000",
  };

  if (params.coin) queryParams.coin = params.coin;
  if (params.status !== undefined) queryParams.status = params.status.toString();
  if (params.startTime) queryParams.startTime = params.startTime.toString();
  if (params.endTime) queryParams.endTime = params.endTime.toString();
  if (params.offset !== undefined) queryParams.offset = params.offset.toString();
  if (params.limit !== undefined) queryParams.limit = params.limit.toString();
  if (params.txId) queryParams.txId = params.txId;

  const queryString = new URLSearchParams(queryParams).toString();
  const signature = generateSignature(queryString, secretKey);
  const fullUrl = `${BINANCE_BASE_URL}/sapi/v1/capital/deposit/hisrec?${queryString}&signature=${signature}`;

  const res = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "X-MBX-APIKEY": apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Binance on-chain API error: ${errorText}`);
  }

  const rawDeposits = await res.json();
  if (!Array.isArray(rawDeposits)) return [];

  return rawDeposits.map((d: any) => ({
    id: d.id ? String(d.id) : "",
    txId: d.txId || "",
    amount: d.amount || "0",
    coin: d.coin || "USDT",
    network: d.network || "",
    status: d.status ?? 1,
    completeTime: d.completeTime || d.insertTime || 0,
    address: d.address || "",
    raw: d,
  }));
}

/**
 * Fetch Binance Pay internal / C2C / Pay ID transactions
 */
export async function getPayTransactions(limit = 50): Promise<UnifiedDeposit[]> {
  const apiKey = getApiKey();
  const secretKey = getSecretKey();

  if (!apiKey || !secretKey) {
    return [];
  }

  try {
    const timestamp = await getSyncedTimestamp();
    const queryParams: Record<string, string> = {
      timestamp: timestamp.toString(),
      recvWindow: "60000",
      limit: limit.toString(),
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = generateSignature(queryString, secretKey);
    const fullUrl = `${BINANCE_BASE_URL}/sapi/v1/pay/transactions?${queryString}&signature=${signature}`;

    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[Binance Pay] Pay API request non-ok:", await res.text());
      return [];
    }

    const json = await res.json();
    if (!json || !Array.isArray(json.data)) return [];

    const myPayId = (process.env.NEXT_PUBLIC_BINANCE_PAY_ID || "1082962624").trim();

    return json.data.map((tx: any) => {
      const payerId = String(tx.payerInfo?.binanceId || "");
      const receiverId = String(tx.receiverInfo?.binanceId || "");
      const isReceived = receiverId === myPayId || parseFloat(tx.amount || "0") > 0;

      return {
        id: String(tx.orderId || ""),
        txId: String(tx.transactionId || tx.orderId || ""),
        amount: Math.abs(parseFloat(tx.amount || "0")).toString(),
        coin: tx.currency || "USDT",
        network: "BINANCE_PAY",
        status: isReceived ? 1 : 0, // Only incoming transfers count as valid receipts
        completeTime: Number(tx.transactionTime || 0),
        payerBinanceId: payerId,
        receiverBinanceId: receiverId,
        raw: tx,
      };
    });
  } catch (err) {
    console.warn("[Binance Pay] Error fetching pay transactions:", err);
    return [];
  }
}

export type PaymentStatus = "exact" | "underpaid" | "overpaid";

const AMOUNT_TOLERANCE = 0.001; // USDT floating-point tolerance

export async function checkPaymentDeposit(options: {
  expectedAmount: number;
  coin?: string;
  txHash?: string;
  createdAtTimestamp: number;
  usedTxHashes?: string[];
  usedDepositIds?: string[];
}) {
  const {
    expectedAmount,
    coin = "USDT",
    txHash,
    createdAtTimestamp,
    usedTxHashes = [],
    usedDepositIds = [],
  } = options;

  // Search window: If user provided TxHash, search last 24h; otherwise search from order creation - 15m
  const isHashProvided = Boolean(txHash && txHash.trim().length > 0);
  const startTime = isHashProvided
    ? Math.max(0, Date.now() - 24 * 60 * 60 * 1000)
    : Math.max(0, createdAtTimestamp - 15 * 60 * 1000);
  const endTime = Date.now() + 5 * 60 * 1000;

  // Fetch both On-Chain deposits and Binance Pay transactions concurrently
  const [onChainDeposits, payTransactions] = await Promise.all([
    getDepositHistory({
      coin,
      status: 1, // Only successful deposits
      startTime,
      endTime,
      limit: 50,
    }).catch((err) => {
      console.error("[Binance] On-chain deposit fetch error:", err.message);
      return [] as UnifiedDeposit[];
    }),
    getPayTransactions(50).catch(() => [] as UnifiedDeposit[]),
  ]);

  const allDeposits: UnifiedDeposit[] = [...onChainDeposits, ...payTransactions];

  // Filter out any deposits already claimed/used by other orders
  const availableDeposits = allDeposits.filter((d) => {
    const isUsedHash = usedTxHashes.some((h) => {
      if (!h) return false;
      const cleanH = h.toLowerCase().replace(/^0x/, "");
      const cleanD = (d.txId || "").toLowerCase().replace(/^0x/, "");
      return cleanH === cleanD;
    });
    const isUsedId = usedDepositIds.some((id) => id && id.toString() === d.id.toString());
    return !isUsedHash && !isUsedId;
  });

  /** Classify an actual amount vs expected */
  function classifyAmount(actualAmount: number, expected: number): PaymentStatus {
    const diff = actualAmount - expected;
    if (Math.abs(diff) <= AMOUNT_TOLERANCE) return "exact";
    if (diff < 0) return "underpaid";
    return "overpaid";
  }

  // CASE 1: User explicitly provided a TxHash / TxID / Binance Order ID / Payer Pay ID
  if (txHash && txHash.trim().length > 0) {
    const cleanHash = txHash.trim().toLowerCase();
    const cleanWithout0x = cleanHash.replace(/^0x/, "");

    // Check if the provided hash matches an unused deposit or Binance Pay record
    const matchByHash = availableDeposits.find((d) => {
      const depTxId = (d.txId || "").toLowerCase();
      const depId = (d.id || "").toLowerCase();
      const payerId = (d.payerBinanceId || "").toLowerCase();

      return (
        depTxId === cleanHash ||
        depTxId.replace(/^0x/, "") === cleanWithout0x ||
        depId === cleanHash ||
        (payerId && payerId === cleanHash)
      );
    });

    if (matchByHash) {
      const actualAmount = parseFloat(matchByHash.amount);
      const paymentStatus = classifyAmount(actualAmount, expectedAmount);
      const difference = Number((actualAmount - expectedAmount).toFixed(6));

      if (paymentStatus === "underpaid") {
        return {
          verified: false,
          paymentStatus,
          deposit: matchByHash,
          actualAmount,
          expectedAmount,
          difference,
          matchType: "txHash",
          error: `المبلغ المحول (${actualAmount} USDT) أقل من المطلوب (${expectedAmount} USDT). الفرق: ${Math.abs(difference).toFixed(6)} USDT.`,
          depositsFound: availableDeposits.length,
        };
      }

      // exact or overpaid — verified
      return {
        verified: true,
        paymentStatus,
        deposit: matchByHash,
        actualAmount,
        expectedAmount,
        difference,
        matchType: "txHash",
      };
    }

    // Check if it was already used by another order
    const wasAlreadyUsed = allDeposits.some((d) => {
      const depTxId = (d.txId || "").toLowerCase();
      const depId = (d.id || "").toLowerCase();
      const matchGiven =
        depTxId === cleanHash ||
        depTxId.replace(/^0x/, "") === cleanWithout0x ||
        depId === cleanHash;
      const isKnownUsed =
        usedTxHashes.some((h) => h && h.toLowerCase().replace(/^0x/, "") === depTxId.replace(/^0x/, "")) ||
        usedDepositIds.some((id) => id && id.toString() === d.id.toString());
      return matchGiven && isKnownUsed;
    });

    if (wasAlreadyUsed) {
      return {
        verified: false,
        error: "رمز المعاملة (TxID) هذا تم استخدامه مسبقاً في طلب آخر ولا يمكن استخدامه مجدداً.",
        depositsFound: availableDeposits.length,
      };
    }

    return {
      verified: false,
      error: "رمز المعاملة (TxID) المدخل غير مطابق لأي إيداع وصل إلى حساب بينانس بعد. يرجى التأكد من الرمز أو الانتظار لحظات لتأكيد الشبكة.",
      depositsFound: availableDeposits.length,
    };
  }

  // CASE 2: No TxHash provided -> Auto-match by amount and timestamp
  const matchByAmount = availableDeposits.find((d) => {
    const depAmount = parseFloat(d.amount);
    const amountMatches = Math.abs(depAmount - expectedAmount) <= AMOUNT_TOLERANCE;
    // Must have arrived around or after order creation (within 30 mins window)
    const timeValid = d.completeTime >= (createdAtTimestamp - 2 * 60 * 1000);
    return amountMatches && timeValid;
  });

  if (matchByAmount) {
    const actualAmount = parseFloat(matchByAmount.amount);
    const paymentStatus = classifyAmount(actualAmount, expectedAmount);
    const difference = Number((actualAmount - expectedAmount).toFixed(6));
    return {
      verified: true,
      paymentStatus,
      deposit: matchByAmount,
      actualAmount,
      expectedAmount,
      difference,
      matchType: "amount_and_time",
    };
  }

  return {
    verified: false,
    depositsFound: availableDeposits.length,
    recentDeposits: availableDeposits.slice(0, 3),
  };
}
