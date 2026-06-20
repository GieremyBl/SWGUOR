export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { procesarStripeIntent } from '@/lib/services/payments/payment-stripe-intent.handler';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return procesarStripeIntent(body);
}
