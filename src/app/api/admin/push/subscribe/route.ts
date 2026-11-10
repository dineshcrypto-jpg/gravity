import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription, removePushSubscription, getAllPushSubscriptions } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET() {
  const subs = await getAllPushSubscriptions();
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BBhOWcAk-M9wOAyN4UsmVm7PSDrGdl4bO6810nxNghx8UJKOFrSTBCfw1bPRygvxuCa2BTDmb68hcEYcbtg6Mr0";

  return NextResponse.json({
    success: true,
    publicKey,
    activeDevices: subs.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    await savePushSubscription(subscription);

    return NextResponse.json({
      success: true,
      message: "Subscription registered successfully",
    });
  } catch (err: any) {
    console.error("Subscription registration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) {
      await removePushSubscription(endpoint);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
