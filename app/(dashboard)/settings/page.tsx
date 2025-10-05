import { prisma } from "@/lib/prisma";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { SettingsClient } from "./components/settings-client";

export default async function SettingsPage() {
    const [departments, categories, vendors] = await Promise.all([
        prisma.department.findMany({ orderBy: { name: 'asc' } }),
        prisma.category.findMany({ include: { department: true }, orderBy: { name: 'asc' } }),
        prisma.vendor.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <Heading title="Settings" description="Manage your store's configuration." />
                <Separator />
                <SettingsClient
                    departments={departments}
                    categories={categories}
                    vendors={vendors}
                />
            </div>
        </div>
    );
}