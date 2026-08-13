import { NextResponse } from "next/server";
import { getDepositAddress } from "@/lib/binance";

export async function GET() {
  try {
    const networks = [
      { id: "TRX", name: "TRON (TRC20)", isPopular: true },
      { id: "BSC", name: "BNB Smart Chain (BEP20)", isPopular: true },
      { id: "APT", name: "Aptos (APT)", isPopular: false },
    ];

    const results = await Promise.allSettled(
      networks.map(async (n) => {
        const data = await getDepositAddress("USDT", n.id);
        return {
          networkId: n.id,
          networkName: n.name,
          coin: "USDT",
          address: data.address,
          tag: data.tag || "",
          url: data.url || "",
          isPopular: n.isPopular,
        };
      })
    );

    const addresses = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({
      success: true,
      addresses,
      binancePayId: process.env.NEXT_PUBLIC_BINANCE_PAY_ID || "",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch crypto addresses" },
      { status: 500 }
    );
  }
}
