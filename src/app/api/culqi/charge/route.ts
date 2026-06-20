export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { procesarCheckoutCulqi } from '@/lib/services/payments/payment-culqi-checkout.handler';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return procesarCheckoutCulqi(body);
}
