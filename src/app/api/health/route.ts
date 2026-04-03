import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  try {
    // DB ping
    await prisma.$queryRaw`SELECT 1`;

    const latency = Date.now() - start;

    logger.info({ latency }, 'health check ok');

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'ok',
      latencyMs: latency,
    });
  } catch (err) {
    logger.error({ err }, 'health check failed — db unreachable');

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        db: 'unreachable',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
