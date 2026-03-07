import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.supabase_uid;
    if (uid) {
      await supabase
        .from("profiles")
        .update({ tier: "pro", tier_updated_at: new Date().toISOString() })
        .eq("id", uid);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(sub.customer as string);
    const uid = (customer as Stripe.Customer).metadata?.supabase_uid;
    if (uid) {
      await supabase
        .from("profiles")
        .update({ tier: "free", tier_updated_at: new Date().toISOString() })
        .eq("id", uid);
    }
  }

  return NextResponse.json({ received: true });
}
