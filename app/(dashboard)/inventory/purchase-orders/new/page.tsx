"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Product, Vendor } from "@/lib/generated/prisma";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface POItem {
  productId: string;
  productName: string;
  quantityOrdered: number;
  costPerItem: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [vendorRes, productRes] = await Promise.all([
        fetch('/api/vendors'), // We need to create this simple API
        fetch('/api/products'),
      ]);
      setVendors(await vendorRes.json());
      setProducts(await productRes.json());
    };
    fetchData();
  }, []);

  const handleAddProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && !items.find(item => item.productId === productId)) {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantityOrdered: 1,
        costPerItem: product.cost,
      }]);
    }
  };

  const handleItemChange = (productId: string, field: 'quantityOrdered' | 'costPerItem', value: number) => {
    setItems(items.map(item => item.productId === productId ? { ...item, [field]: value } : item));
  };
  
  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/api/purchase-orders', {
        vendorId: selectedVendorId,
        items,
        status: 'PENDING',
      });
      toast.success("Purchase Order created.");
      router.push('/inventory/purchase-orders');
    } catch (error) {
      toast.error("Failed to create Purchase Order.");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = items.reduce((sum, item) => sum + (item.costPerItem * item.quantityOrdered), 0);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="New Purchase Order" description="Select a vendor and add products to order." />
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Select onValueChange={setSelectedVendorId} disabled={items.length > 0}>
              <SelectTrigger><SelectValue placeholder="1. Select a Vendor" /></SelectTrigger>
              <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between" disabled={!selectedVendorId}>2. Add Products...<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command><CommandInput placeholder="Search product..." /><CommandEmpty>No product found.</CommandEmpty><CommandGroup>
                  {products.map((product) => (
                    <CommandItem key={product.id} onSelect={() => handleAddProduct(product.id)}>
                      {product.name}
                    </CommandItem>
                  ))}
                </CommandGroup></Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Cost/Item</TableHead><TableHead>Subtotal</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell><Input type="number" value={item.quantityOrdered} onChange={e => handleItemChange(item.productId, 'quantityOrdered', parseInt(e.target.value))} className="w-20" /></TableCell>
                        <TableCell><Input type="number" value={item.costPerItem} step="0.01" onChange={e => handleItemChange(item.productId, 'costPerItem', parseFloat(e.target.value))} className="w-24" /></TableCell>
                        <TableCell>{formatCurrency(item.quantityOrdered * item.costPerItem)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}><Trash className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right font-bold mt-4">Total: {formatCurrency(totalCost)}</div>
              </CardContent>
            </Card>
            <Button onClick={handleSubmit} disabled={loading || items.length === 0} className="mt-4">
              Create Purchase Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}