import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { formatCurrency } from '@/lib/utils'; // We'll create this helper

type ReportsPageProps = {
    searchParams: { from?: string, to?: string }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
    const from = searchParams.from ? new Date(searchParams.from) : new Date(0);
    const to = searchParams.to ? new Date(searchParams.to) : new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const salesData = await prisma.transaction.aggregate({
        where: { createdAt: { gte: from, lte: to }, total: { gt: 0 } },
        _sum: { total: true }, _count: { id: true },
    });

    const refundData = await prisma.transaction.aggregate({
        where: { createdAt: { gte: from, lte: to }, total: { lt: 0 } },
        _sum: { total: true }, _count: { id: true },
    });

    const discountData = await prisma.transactionItem.aggregate({
        where: { transaction: { createdAt: { gte: from, lte: to } } },
        _sum: { discountAmount: true }
    });

    const tenderData = await prisma.transaction.groupBy({
        by: ['tenderType'],
        where: { createdAt: { gte: from, lte: to } },
        _sum: { total: true }
    });

    const grossSales = salesData._sum.total ?? 0;
    const totalDiscounts = discountData._sum.discountAmount ?? 0;
    const netSales = grossSales - totalDiscounts;
    const totalRefunds = Math.abs(refundData._sum.total ?? 0);

    const cashTotal = tenderData.find(t => t.tenderType === 'CASH')?._sum.total ?? 0;
    const cardTotal = tenderData.find(t => t.tenderType === 'CARD')?._sum.total ?? 0;

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <Heading title="Sales Report" description="View a summary of your sales activity." />
                    <DateRangePicker />
                </div>
                <Separator />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardHeader><CardTitle>Net Sales</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(netSales - totalRefunds)}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Gross Sales</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(grossSales)}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Discounts</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">-{formatCurrency(totalDiscounts)}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Refunds</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">-{formatCurrency(totalRefunds)}</p><p className="text-xs text-muted-foreground">{refundData._count.id} refunds</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total from Cash</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(cashTotal)}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total from Card</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(cardTotal)}</p></CardContent></Card>
                </div>
            </div>
        </div>
    );
}