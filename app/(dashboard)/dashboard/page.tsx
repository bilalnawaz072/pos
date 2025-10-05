import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { formatCurrency } from '@/lib/utils';
import { addDays, format, differenceInDays } from 'date-fns';
import { SalesOverTimeChart } from './components/sales-over-time-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LowStockAlert } from './components/low-stock-alert';
import { DollarSign, CreditCard, ArrowDownRight, TrendingUp, Percent, ShoppingCart, PackagePlus, Box, Sandwich } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from "next/link";

type DashboardPageProps = {
  searchParams: { from?: string; to?: string };
};

const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // --- DATE RANGE SETUP ---
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const from = searchParams.from ? new Date(searchParams.from) : addDays(to, -7);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  const periodDuration = differenceInDays(to, from);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -periodDuration);

  // --- ALL DATA FETCHING QUERIES ---
  const [currentPeriodTx, previousPeriodTx, latestTransactions, itemsSold] = await Promise.all([
    prisma.transaction.findMany({ where: { createdAt: { gte: from, lte: to } }, include: { items: true } }),
    prisma.transaction.findMany({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
    prisma.transaction.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { customer: true, items: true } }),
    prisma.transactionItem.findMany({
      where: { transaction: { createdAt: { gte: from, lte: to }, total: { gt: 0 } } }
    }),
  ]);

  // --- KPI CALCULATIONS ---
  const currentSales = currentPeriodTx.filter(tx => tx.total > 0);
  const currentRefunds = currentPeriodTx.filter(tx => tx.total < 0);
  const prevSales = previousPeriodTx.filter(tx => tx.total > 0);

  const grossRevenue = currentSales.reduce((sum, tx) => sum + tx.total, 0);
  const previousRevenue = prevSales.reduce((sum, tx) => sum + tx.total, 0);

  const totalDiscounts = currentPeriodTx.flatMap(tx => tx.items).reduce((sum, item) => sum + item.discountAmount, 0);
  const netRevenue = grossRevenue - totalDiscounts;
  const totalRefunds = Math.abs(currentRefunds.reduce((sum, tx) => sum + tx.total, 0));

  const totalCOGS = itemsSold.reduce((sum, item) => {
    return sum + (item.cost * (item.weight ?? item.quantity));
  }, 0);
  const totalProfit = netRevenue - totalCOGS;
  const profitMargin = netRevenue > 0 ? (totalProfit / netRevenue) * 100 : 0;

  const revenueChange = calculatePercentageChange(netRevenue, previousRevenue);
  const salesCountChange = calculatePercentageChange(currentSales.length, prevSales.length);

  // --- CHART DATA ---
  const dailyRevenue: { [key: string]: number } = {};
  for (const sale of currentSales) {
    const date = format(sale.createdAt, "MMM d");
    const netSaleTotal = sale.total - sale.items.reduce((s, i) => s + i.discountAmount, 0)
    dailyRevenue[date] = (dailyRevenue[date] ?? 0) + netSaleTotal;
  }
  const chartData = Object.entries(dailyRevenue).map(([date, total]) => ({ date, total }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="Dashboard" description="Overview of your store's performance." />
          <DateRangePicker />
        </div>
        <Separator />
        {/* NEW "QUICK ACTIONS" SECTION */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/checkout">
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">New Sale</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><CardDescription>Go to the checkout screen to process a new transaction.</CardDescription></CardContent>
              </Card>
            </Link>
            <Link href="/inventory/receive">
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receive Stock</CardTitle><PackagePlus className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><CardDescription>Log new inventory lots and track expiration dates.</CardDescription></CardContent>
              </Card>
            </Link>
            <Link href="/inventory">
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Manage Products</CardTitle><Box className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><CardDescription>Add, edit, or delete products from your catalog.</CardDescription></CardContent>
              </Card>
            </Link>
            <Link href="/deli">
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Deli Kiosk</CardTitle><Sandwich className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><CardDescription>Create custom-weighed items and print price stickers.</CardDescription></CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <Separator />
        <LowStockAlert />

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(netRevenue)}</div><p className={cn("text-xs", revenueChange >= 0 ? "text-emerald-500" : "text-destructive")}>{revenueChange.toFixed(1)}% from last period</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Profit</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div><p className="text-xs text-muted-foreground">Profit Margin: {profitMargin.toFixed(1)}%</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sales</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">+{currentSales.length}</div><p className={cn("text-xs", salesCountChange >= 0 ? "text-emerald-500" : "text-destructive")}>{salesCountChange.toFixed(1)}% from last period</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Refunds</CardTitle><ArrowDownRight className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">-{formatCurrency(totalRefunds)}</div><p className="text-xs text-muted-foreground">{currentRefunds.length} transactions</p></CardContent></Card>
        </div>

        <div className="grid gap-4 grid-cols-1">
          <Card className="col-span-4">
            <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
            <CardContent className="pl-2">
              <SalesOverTimeChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Latest Transactions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Type</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {latestTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell><div className="font-medium">{tx.customer ? `${tx.customer.firstName} ${tx.customer.lastName}` : 'Walk-in'}</div></TableCell>
                    <TableCell>{tx.items.length} items</TableCell>
                    <TableCell><Badge variant={tx.total > 0 ? 'secondary' : 'destructive'}>{tx.total > 0 ? 'Sale' : 'Refund'}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{tx.tenderType}</Badge></TableCell>
                    <TableCell>{format(tx.createdAt, "LLL dd, y, hh:mm a")}</TableCell>
                    <TableCell className={cn("text-right font-medium", tx.total > 0 ? "" : "text-destructive")}>{formatCurrency(tx.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}