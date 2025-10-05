"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SalesOverTimeChartProps {
    data: { date: string; total: number }[];
}

export const SalesOverTimeChart: React.FC<SalesOverTimeChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                    contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ fontWeight: "bold" }}
                    formatter={(value) => formatCurrency(value as number)}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};