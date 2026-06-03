import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'async_hooks';

export const auditUserStore = new AsyncLocalStorage<{ userId: bigint }>();

type PrismaMaybeUnavailable = PrismaClient & { __prisma_unavailable?: boolean };

declare global {
  var prismaGlobal: PrismaMaybeUnavailable | undefined;
}

function buildClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString === 'undefined') {
    const makeUnavailable = () => {
      const thrower = () => {
        throw new Error('Prisma client unavailable: DATABASE_URL is not set');
      };

      const proxy = new Proxy(thrower as unknown as PrismaMaybeUnavailable, {
        get(_target, prop) {
          if (prop === '__prisma_unavailable') {
            return true;
          }
          return proxy;
        },
        apply() {
          throw new Error('Prisma client unavailable: DATABASE_URL is not set');
        },
      });

      return proxy;
    };

    return makeUnavailable();
  }


  const cleanConnectionString = connectionString
    .replace('?pgbouncer=true', '')
    .replace('&pgbouncer=true', '');

  const pool = new Pool({ connectionString: cleanConnectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : [],
  }) as PrismaMaybeUnavailable;
}

function getClient(): PrismaClient {
  if (typeof window !== 'undefined') {
    throw new Error('Prisma cannot be used on the client side.');
  }

  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = buildClient();
  }

  return globalThis.prismaGlobal;
}

export const prisma = getClient();

function checkAvailability(): boolean {
  const client = prisma as PrismaMaybeUnavailable;
  return client.__prisma_unavailable !== true;
}

export const prismaAvailable = checkAvailability();