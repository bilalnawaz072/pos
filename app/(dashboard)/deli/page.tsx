"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Product, DeliOrder } from "@/lib/generated/prisma";
import { toast } from "sonner";

import { createDeliOrder } from "@/app/actions/createDeliOrder";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export default function DeliPage() {
    const [deliProducts, setDeliProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [weightInput, setWeightInput] = useState("");
    const [printedSticker, setPrintedSticker] = useState<(DeliOrder & { baseProduct: Product }) | null>(null);
    const [isPending, startTransition] = useTransition();
    const weightInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Fetch products that are sold by weight to display on the deli screen
        const fetchDeliProducts = async () => {
            const response = await fetch('/api/products');
            const allProducts: Product[] = await response.json();
            setDeliProducts(allProducts.filter(p => p.isWeighed));
        };
        fetchDeliProducts();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            setTimeout(() => weightInputRef.current?.focus(), 100);
        }
    }, [selectedProduct]);

    const handlePrintSticker = () => {
        if (!selectedProduct || !weightInput) return;
        const weight = parseFloat(weightInput);

        startTransition(async () => {
            const result = await createDeliOrder(selectedProduct.id, weight);
            if (result.order) {
                setPrintedSticker(result.order as any);
                handleCloseWeightModal();
            } else {
                toast.error(result.error || "Failed to create order.");
            }
        });
    };

    const handleCloseWeightModal = () => {
        setSelectedProduct(null);
        setWeightInput("");
    };

    return (
        <>
            {/* "Enter Weight" Modal */}
            <Dialog open={selectedProduct !== null} onOpenChange={(isOpen) => !isOpen && handleCloseWeightModal()}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Weigh Item: {selectedProduct?.name}</DialogTitle><DialogDescription>Enter the weight from the scale.</DialogDescription></DialogHeader>
                    <div className="py-4"><Label htmlFor="weight">Weight (lbs)</Label><Input id="weight" ref={weightInputRef} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePrintSticker()} type="number" step="0.01" /></div>
                    <DialogFooter><Button variant="outline" onClick={handleCloseWeightModal}>Cancel</Button><Button onClick={handlePrintSticker} disabled={isPending}>{isPending ? "Generating..." : "Generate Sticker"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* "Printed Sticker" Modal */}
            <Dialog open={printedSticker !== null} onOpenChange={() => setPrintedSticker(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Sticker Generated</DialogTitle><DialogDescription>This represents the printed sticker. Scan this barcode at the main checkout.</DialogDescription></DialogHeader>
                    <div className="bg-slate-100 p-4 rounded-lg my-4 text-center">
                        <p className="font-bold text-lg">{printedSticker?.baseProduct.name}</p>
                        <p>Weight: {printedSticker?.weight.toFixed(2)} lbs</p>
                        <p className="font-bold text-2xl">{formatCurrency(printedSticker?.totalPrice || 0)}</p>
                        <p className="font-mono bg-white p-2 mt-2 break-all">{printedSticker?.id}</p>
                    </div>
                    <DialogFooter><Button onClick={() => setPrintedSticker(null)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main UI */}
            <div className="flex-col">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Heading title="Deli & Bakery Kiosk" description="Create orders for weighed items." />
                    <Separator />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {deliProducts.map(product => (
                            <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedProduct(product)}>
                                <CardContent className="flex flex-col items-center justify-center p-4 h-32">
                                    <p className="text-lg font-semibold text-center">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}/lb</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}