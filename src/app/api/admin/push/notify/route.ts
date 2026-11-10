import { NextRequest, NextResponse } from "next/server";
import { notifyAllAdmins } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: messageBody, url } = body;

    const result = await notifyAllAdmins({
      title: title || "🛍️ New Order Received!",
      body: messageBody || "A new customer order has been placed. Tap to open orders.",
      url: url || "/admin/orders",
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      total: result.total,
    });
  } catch (err: any) {
    console.error("Push notify error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
