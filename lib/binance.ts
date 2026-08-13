import crypto from "crypto";

const BINANCE_BASE_URL = "https://api.binance.com";

function getApiKey(): string {
  return process.env.BINANCE_API_KEY || "";
}

function getSecretKey(): string {
  return process.env.BINANCE_SECRET_KEY || "";
}

function generateSignature(queryString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

export interface BinanceDeposit {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: number; // 1 = success, 0 = pending, 6 = credited but cannot withdraw
  address: string;
  addressTag: string;
  txId: string;
  insertTime: number;
  transferType: number;
  unlockConfirm: string;
  confirmTimes: string;
  completeTime: number;
}

export async function getDepositAddress(
  coin = "USDT",
  network?: string
): Promise<{ address: string; coin: string; tag: string; url: string }> {
  const apiKey = getApiKey();
  const secretKey = getSecretKey();

  if (apiKey && secretKey) {
    try {
      const timestamp = Date.now();
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
  else address = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "TN9kZMYS53JbuHQbsGPGDvJXD4gUhPVZi7";

  return { address, coin, tag: "", url: "" };
}

export async function getDepositHistory(params: {
  coin?: string;
  status?: number;
  startTime?: number;
  endTime?: number;
  offset?: number;
  limit?: number;
  txId?: string;
}): Promise<BinanceDeposit[]> {
  const apiKey = getApiKey();
  const secretKey = getSecretKey();

  if (!apiKey || !secretKey) {
    throw new Error("Binance API credentials (BINANCE_API_KEY, BINANCE_SECRET_KEY) are missing in environment.");
  }

  const timestamp = Date.now();
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
    throw new Error(`Binance API error: ${errorText}`);
  }

  return await res.json();
}

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

  // Search window: from 10 minutes before order creation until now + 5 mins
  const startTime = Math.max(0, createdAtTimestamp - 10 * 60 * 1000);
  const endTime = Date.now() + 5 * 60 * 1000;

  const deposits = await getDepositHistory({
    coin,
    status: 1, // Only successful deposits
    startTime,
    endTime,
    limit: 50,
  });

  // Filter out any deposits already claimed/used by other orders
  const availableDeposits = deposits.filter((d) => {
    const isUsedHash = usedTxHashes.some(
      (h) => h && h.toLowerCase() === d.txId.toLowerCase()
    );
    const isUsedId = usedDepositIds.includes(d.id);
    return !isUsedHash && !isUsedId;
  });

  // CASE 1: User explicitly provided a TxHash / TxID
  if (txHash && txHash.trim().length > 0) {
    const cleanHash = txHash.trim().toLowerCase();

    // Check if the provided hash matches an unused deposit
    const matchByHash = availableDeposits.find((d) => {
      const depTxId = d.txId.toLowerCase();
      return depTxId === cleanHash || depTxId.replace(/^0x/, "") === cleanHash.replace(/^0x/, "");
    });

    if (matchByHash) {
      // Also verify that the deposit amount is at least the expected amount
      const depAmount = parseFloat(matchByHash.amount);
      if (depAmount >= expectedAmount - 0.001) {
        return {
          verified: true,
          deposit: matchByHash,
          matchType: "txHash",
        };
      } else {
        return {
          verified: false,
          error: `المبلغ المحول (${depAmount} USDT) أقل من المطلوب (${expectedAmount} USDT).`,
          depositsFound: availableDeposits.length,
        };
      }
    }

    // If user provided a TxHash and it didn't match any unused deposit on Binance,
    // FAIL STRICTLY! Do NOT silently fall back to guessing by amount.
    const wasAlreadyUsed = deposits.some((d) => {
      const depTxId = d.txId.toLowerCase();
      return (depTxId === cleanHash || depTxId.replace(/^0x/, "") === cleanHash.replace(/^0x/, "")) &&
        (usedTxHashes.includes(d.txId) || usedDepositIds.includes(d.id));
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
  // Must match exact expected amount (tolerance: 0.001) and arrived after order creation
  const matchByAmount = availableDeposits.find((d) => {
    const depAmount = parseFloat(d.amount);
    const amountMatches = Math.abs(depAmount - expectedAmount) <= 0.001;
    // Must have arrived around or after order creation (within 30 mins window)
    const timeValid = d.completeTime >= (createdAtTimestamp - 2 * 60 * 1000);
    return amountMatches && timeValid;
  });

  if (matchByAmount) {
    return {
      verified: true,
      deposit: matchByAmount,
      matchType: "amount_and_time",
    };
  }

  return {
    verified: false,
    depositsFound: availableDeposits.length,
    recentDeposits: availableDeposits.slice(0, 3),
  };
}
