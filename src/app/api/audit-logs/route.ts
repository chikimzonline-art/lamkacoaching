import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/audit-logs — Paginated, searchable & filtered audit logs (Admin only)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const action = searchParams.get('action') || '';
    const entityType = searchParams.get('entityType') || '';
    const userRole = searchParams.get('userRole') || '';
    const userName = searchParams.get('userName') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10) || 30, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (action && action !== 'all') {
      where.action = action;
    }

    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }

    if (userRole && userRole !== 'all') {
      where.userRole = userRole;
    }

    if (userName && userName !== 'all') {
      where.userName = userName;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { userName: { contains: search } },
        { action: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const [logs, totalCount, actionAggregates, distinctUsers] = await db.$transaction([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
      db.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      }),
      db.auditLog.findMany({
        select: { userName: true, userRole: true },
        distinct: ['userName'],
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      logs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
      stats: {
        totalLogs: totalCount,
        byAction: actionAggregates.reduce((acc, curr) => {
          const countVal = typeof curr._count === 'object' && curr._count !== null ? (curr._count as any).action : (curr._count || 0);
          acc[curr.action] = Number(countVal) || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      distinctUsers: distinctUsers.filter(u => Boolean(u.userName)),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
