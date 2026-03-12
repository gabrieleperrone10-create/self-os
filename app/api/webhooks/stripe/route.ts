import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@supabase/ssr';
import type Stripe from 'stripe';
import type { UserPlan } from '@/types';

// Webhook needs raw body — disable Next.js body parsing
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[stripe/webhook] Invalid signature', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Supabase with service role for webhook (no user session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan as UserPlan;

      if (userId && plan) {
        await supabase
          .from('profiles')
          .update({ plan, stripe_customer_id: session.customer as string })
          .eq('id', userId);

        // Non-blocking: send upgrade confirmation email
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/upgrade-confirmed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, plan }),
        }).catch(err => console.error('[webhook] upgrade email failed', err));
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status;

      if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
