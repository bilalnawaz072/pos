"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { PurchaseOrder, Vendor, PurchaseOrderItem, Product } from "@/lib/generated/prisma";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FullPO = PurchaseOrder & { vendor: Vendor; items: (PurchaseOrderItem & { product: Product })[] };
type ReceiveItemState = { id: string; productId: string; quantityReceivedNow: number; expirationDate?: Date };

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseOrderId = params.purchaseOrderId as string;

  const [po, setPo] = useState<FullPO | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [itemsToReceive, setItemsToReceive] = useState<ReceiveItemState[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPO = async () => {
      // In a real app, you would fetch a single PO by ID here
      const response = await fetch('/api/purchase-orders');
      const allPOs: FullPO[] = await response.json();
      const specificPO = allPOs.find(p => p.id === purchaseOrderId);
      setPo(specificPO || null);
      if (specificPO) {
        // Initialize the state for items to receive
        setItemsToReceive(specificPO.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantityReceivedNow: 0,
          expirationDate: undefined
        })));
      }
    };
    if (purchaseOrderId) {
      fetchPO();
    }
  }, [purchaseOrderId]);

  const handleReceiveItemChange = (itemId: string, field: 'quantity' | 'date', value: any) => {
    setItemsToReceive(itemsToReceive.map(item => {
      if (item.id === itemId) {
        return field === 'quantity' ? { ...item, quantityReceivedNow: parseInt(value, 10) || 0 } : { ...item, expirationDate: value };
      }
      return item;
    }));
  };
  
  const handleSubmitReceive = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/purchase-orders/${purchaseOrderId}/receive`, {
        itemsToReceive: itemsToReceive.filter(item => item.quantityReceivedNow > 0)
      });
      toast.success("Stock successfully updated!");
      setIsReceiveModalOpen(false);
      router.refresh(); // Refresh server component data
    } catch(error) {
      toast.error("Failed to update stock.");
    } finally {
      setLoading(false);
    }
  };

  if (!po) return <div>Loading...</div>;

  const totalCost = po.items.reduce((sum, item) => sum + item.costPerItem * item.quantityOrdered, 0);

  return (
    <>
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Receive Stock for PO</DialogTitle><DialogDescription>Enter the quantities of items received in this shipment.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
            {po.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-3 gap-4 items-center">
                <Label>{item.product.name}</Label>
                <Input type="number" placeholder={`Qty Received (Max: ${item.quantityOrdered - item.quantityReceived})`} value={itemsToReceive[index]?.quantityReceivedNow || ''} onChange={e => handleReceiveItemChange(item.id, 'quantity', e.target.value)} />
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline">{itemsToReceive[index]?.expirationDate ? format(itemsToReceive[index].expirationDate!, "PPP") : "Exp. Date"}<CalendarIcon className="ml-2 h-4 w-4" /></Button></PopoverTrigger>
                  <PopoverContent><Calendar mode="single" selected={itemsToReceive[index]?.expirationDate} onSelect={date => handleReceiveItemChange(item.id, 'date', date)} /></PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button><Button onClick={handleSubmitReceive} disabled={loading}>Confirm & Add to Inventory</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <Heading title={`Purchase Order`} description={`From ${po.vendor.name} on ${new Date(po.createdAt).toLocaleDateString()}`} />
            <Button onClick={() => setIsReceiveModalOpen(true)} disabled={po.status === 'RECEIVED'}>Receive Stock</Button>
          </div>
          <Separator />
          <Card>
            <CardHeader><CardTitle className="flex justify-between">Items Ordered <Badge>{po.status}</Badge></CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Qty Ordered</TableHead><TableHead>Qty Received</TableHead><TableHead>Cost/Item</TableHead><TableHead className="text-right">Line Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {po.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>{item.quantityOrdered}</TableCell>
                      <TableCell>{item.quantityReceived}</TableCell>
                      <TableCell>{formatCurrency(item.costPerItem)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.costPerItem * item.quantityOrdered)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right font-bold text-lg mt-4">Total Cost: {formatCurrency(totalCost)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}