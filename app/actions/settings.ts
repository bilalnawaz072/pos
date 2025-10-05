"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Department Actions ---
export async function createDepartment(name: string) {
    if (!name) return { error: "Name is required." };
    await prisma.department.create({ data: { name } });
    revalidatePath("/settings");
}
export async function deleteDepartment(id: string) {
    await prisma.department.delete({ where: { id } });
    revalidatePath("/settings");
}

// --- Category Actions ---
export async function createCategory(name: string, departmentId: string) {
    if (!name || !departmentId) return { error: "Name and department are required." };
    await prisma.category.create({ data: { name, departmentId } });
    revalidatePath("/settings");
}
export async function deleteCategory(id: string) {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/settings");
}

// --- Vendor Actions ---
export async function createVendor(name: string) {
    if (!name) return { error: "Name is required." };
    await prisma.vendor.create({ data: { name } });
    revalidatePath("/settings");
}
export async function deleteVendor(id: string) {
    await prisma.vendor.delete({ where: { id } });
    revalidatePath("/settings");
}