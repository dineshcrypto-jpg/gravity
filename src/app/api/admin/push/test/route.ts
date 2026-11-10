import { NextRequest, NextResponse } from "next/server";
import { notifyAllAdmins } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const result = await notifyAllAdmins({
      title: "🔔 KSN Store - Alert Test!",
      body: "Mobile lockscreen alerts are active! You will receive order notifications even when your browser is closed.",
      url: "/admin/orders",
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      total: result.total,
    });
  } catch (err: any) {
    console.error("Push test error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send test push" },
      { status: 500 }
    );
  }
}
