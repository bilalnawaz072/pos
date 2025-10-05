"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Department, Category, Vendor } from "@/lib/generated/prisma";
import { createDepartment, deleteDepartment, createCategory, deleteCategory, createVendor, deleteVendor } from "@/app/actions/settings";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingsClientProps {
  departments: Department[];
  categories: (Category & { department: Department })[];
  vendors: Vendor[];
}

// A generic component for managing simple lists
const DataManager = ({ title, items, createAction, deleteAction, children }: any) => {
  const [name, setName] = useState("");
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAction(name);
    setName("");
    toast.success(`${title} created.`);
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="flex items-center gap-2 mb-4">
        {children}
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={`New ${title} Name...`} />
        <Button type="submit">Add</Button>
      </form>
      <div className="border rounded-md">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-2 border-b">
            <span>{item.name} {item.department ? `(${item.department.name})` : ''}</span>
            <Button variant="ghost" size="icon" onClick={async () => { await deleteAction(item.id); toast.error(`${title} deleted.`); }}>
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};


export const SettingsClient: React.FC<SettingsClientProps> = ({ departments, categories, vendors }) => {
  const [departmentId, setDepartmentId] = useState("");

  return (
    <Tabs defaultValue="departments" className="max-w-2xl">
      <TabsList>
        <TabsTrigger value="departments">Departments</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="vendors">Vendors</TabsTrigger>
      </TabsList>
      <TabsContent value="departments">
        <DataManager title="Department" items={departments} createAction={createDepartment} deleteAction={deleteDepartment} />
      </TabsContent>
      <TabsContent value="categories">
        <DataManager title="Category" items={categories} createAction={(name: string) => createCategory(name, departmentId)} deleteAction={deleteCategory}>
          <Select onValueChange={setDepartmentId} required>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Department" /></SelectTrigger>
            <SelectContent>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </DataManager>
      </TabsContent>
      <TabsContent value="vendors">
        <DataManager title="Vendor" items={vendors} createAction={createVendor} deleteAction={deleteVendor} />
      </TabsContent>
    </Tabs>
  );
};