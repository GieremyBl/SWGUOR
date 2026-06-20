export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { procesarStripeConfirm } from '@/lib/services/payments/payment-stripe-confirm.handler';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return procesarStripeConfirm(body);
}
