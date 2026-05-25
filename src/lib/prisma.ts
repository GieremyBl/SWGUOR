import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'async_hooks';

export const auditUserStore = new AsyncLocalStorage<{ userId: bigint }>();

// Allow attaching an availability marker without polluting Prisma types everywhere
type PrismaMaybeUnavailable = PrismaClient & { __prisma_unavailable?: true };

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaMaybeUnavailable | undefined;
}

function buildClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString === 'undefined') {

    const makeUnavailable = () => {
      const thrower = () => {
        throw new Error('Prisma client unavailable: DATABASE_URL is not set');
      };

      const proxy = new Proxy(thrower as any, {
        get(_target, prop) {
          if (prop === '__prisma_unavailable') {
            return true;
          }

          return proxy;
        },
        apply() {
          throw new Error('Prisma client unavailable: DATABASE_URL is not set');
        },
      }) as unknown as PrismaMaybeUnavailable;

      // Mark proxy so callers can detect availability without invoking it
      proxy.__prisma_unavailable = true;

      return proxy as unknown as PrismaMaybeUnavailable;
    };

    return makeUnavailable();
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  // Cast real client to PrismaMaybeUnavailable so callers can check the marker safely
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : [],
  }) as PrismaMaybeUnavailable;
}

function getClient(): PrismaClient {
  if (typeof window !== 'undefined') {
    throw new Error('Prisma cannot be used on the client side.');
  }

  globalThis.prismaGlobal ??= buildClient();

  return globalThis.prismaGlobal!;
}

export const prisma = getClient();

// Safely check if prisma client is available (i.e., DATABASE_URL was set)
function checkAvailability(): boolean {
  const client = prisma as unknown as PrismaClient & { __prisma_unavailable?: true };
  return !(client.__prisma_unavailable === true);
}

export const prismaAvailable = checkAvailability();
