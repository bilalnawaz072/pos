"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  LayoutDashboard,
  Users,
  Box,
  Ticket,
  PackageOpen,
  CalendarClock,
  Settings,
  ChevronLeft,
  Truck,
  Sandwich,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "../../app/hooks/use-sidebar";

const navGroups = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/checkout", label: "Checkout", icon: ShoppingCart },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/inventory", label: "Products", icon: Box },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/promotions", label: "Promotions", icon: Ticket },
      { href: '/admin/audit-log', label: 'Audit Log', icon: ShieldCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/inventory/receive", label: "Receive Stock", icon: Truck },
      { href: "/inventory/break-case", label: "Break Case", icon: PackageOpen },
      { href: "/deli", label: "Deli Kiosk", icon: Sandwich },
      { href: "/inventory/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/inventory/reports/expiration", label: "Expiration", icon: CalendarClock },
    ],
  },
];

export function SidebarWrap() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex h-full flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b px-4 lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-6 w-6" />
          {!isCollapsed && <span>GrocerPoint</span>}
        </Link>
      </div>
      <nav className="flex flex-col gap-4 px-2 sm:py-5 flex-1">
        <TooltipProvider>
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h2 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider">
                  {group.title}
                </h2>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return isCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link href={item.href} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8", { "bg-accent text-accent-foreground": pathname === item.href })}>
                        <Icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link key={item.href} href={item.href} className={cn("group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground", { "bg-accent text-accent-foreground": pathname === item.href })}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </TooltipProvider>
      </nav>
      <div className="mt-auto p-4">
        <Button variant="ghost" size="icon" onClick={toggle} className="w-full justify-start">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>
    </aside>
  );
}