"use client";
import { Category, Product, Vendor } from "@/lib/generated/prisma";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProductWithRelations } from "./columns";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


interface ProductFormProps {
  initialData: ProductWithRelations | null;
  categories: Category[];
  vendors: Vendor[];
  allProducts: Product[];
  onCancel: () => void;
  onSuccess: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  vendors,
  allProducts,
  onCancel,
  onSuccess
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit product" : "Add new product";
  const toastMessage = initialData ? "Product updated." : "Product created.";
  const actionLabel = initialData ? "Save changes" : "Create";
  const [isCaseProduct, setIsCaseProduct] = useState(!!initialData?.containsProductId);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductWithRelations>({
    defaultValues: initialData || {
      name: "",
      sku: "",
      barcode: "",
      price: 0,
      cost: 0,
      stockQuantity: 0,
      unit: "each",
      isWeighed: false,
      isAgeRestricted: false,
      categoryId: "",
      vendorId: null,
      caseUnitCount: undefined,
      containsProductId: undefined,
    },
  });

  const onSubmit = async (data: ProductWithRelations) => {
    try {
      setLoading(true);

      const { category, vendor, ...productData } = data;

      const submissionData = {
        ...productData,
        price: parseFloat(String(productData.price) || "0"),
        cost: parseFloat(String(productData.cost) || "0"),
        stockQuantity: parseInt(String(productData.stockQuantity) || "0", 10),
      };

      // THIS IS THE FIX:
      // We clean the data to avoid sending 'null' or empty values for optional fields,
      // which can cause issues with Prisma's create/update operations on unique constraints.
      if (!submissionData.containsProductId) {
        delete (submissionData as any).containsProductId;
      }
      if (!submissionData.caseUnitCount || submissionData.caseUnitCount <= 0) {
        delete (submissionData as any).caseUnitCount;
      }
      if (!submissionData.vendorId) {
        delete (submissionData as any).vendorId;
      }

      if (initialData) {
        await axios.patch(`/api/products/${initialData.id}`, submissionData);
      } else {
        await axios.post("/api/products", submissionData);
      }

      router.refresh();
      toast.success(toastMessage);
      onCancel();
    } catch (error: any) {
      toast.error(error.response?.data || "Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseToggle = (checked: boolean) => {
    setIsCaseProduct(checked);
    if (!checked) {
      // Clear case-related fields when toggled off
      setValue("containsProductId", null);
      setValue("caseUnitCount", null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
      <Input {...register("name", { required: true })} placeholder="Product Name" />
      <Input {...register("sku", { required: true })} placeholder="SKU" />
      </div>
      {/* ADD THIS NEW INPUT FIELD */}
      <Input {...register("barcode")} placeholder="Barcode (UPC, EAN, etc.)" disabled={loading} />

      <div className="grid grid-cols-3 gap-4">
        <Input {...register("price", { required: true, valueAsNumber: true })} type="number" step="0.01" placeholder="Price" disabled={loading} />
        <Input {...register("cost", { required: true, valueAsNumber: true })} type="number" step="0.01" placeholder="Cost" disabled={loading} />
        <Input {...register("stockQuantity", { required: true, valueAsNumber: true })} type="number" placeholder="Stock" disabled={loading} />
      </div>

       {/* NEW REORDER THRESHOLD FIELD */}
       <div>
        <Label>Reorder Threshold (Optional)</Label>
        <Input 
          type="number" 
          {...register("reorderThreshold", { 
            valueAsNumber: true,
            validate: v => !v || v >= 0 || "Must be a positive number"
          })} 
          placeholder="e.g., 10" 
        />
         <p className="text-xs text-muted-foreground">
            When stock falls to this level, an alert will be shown on the dashboard.
          </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="categoryId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          name="vendorId"
          control={control}
          render={({ field }) => (
            <Select disabled={loading} onValueChange={field.onChange} value={field.value ?? undefined}>
              <SelectTrigger><SelectValue placeholder="Select a vendor (optional)" /></SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Controller name="isWeighed" control={control} render={({ field }) => (
            <Switch id="isWeighed" checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
          )} />
          <Label htmlFor="isWeighed">Sold by Weight</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller name="isAgeRestricted" control={control} render={({ field }) => (
            <Switch id="isAgeRestricted" checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
          )} />
          <Label htmlFor="isAgeRestricted">Age Restricted</Label>
        </div>
      </div>
      <div className="pt-6 space-x-2 flex items-center justify-end w-full">
        <Button disabled={loading} variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button disabled={loading} type="submit">{actionLabel}</Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is-case-product"
            checked={isCaseProduct}
            onCheckedChange={handleCaseToggle}
          />
          <Label htmlFor="is-case-product">This product is a Case</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent><p>Enable this if the product is a bulk item (e.g., a case of 24 cans) <br /> that contains a smaller, sellable product.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* This section is now conditionally rendered */}
        {isCaseProduct && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-medium mb-2">Case Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="containsProductId"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between">{field.value ? allProducts.find((p) => p.id === field.value)?.name : "Select contained 'each' product..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command><CommandInput placeholder="Search product..." /><CommandEmpty>No product found.</CommandEmpty><CommandGroup>
                        {allProducts.map((product) => (
                          <CommandItem key={product.id} value={product.id} onSelect={(currentValue) => { field.onChange(currentValue === field.value ? null : currentValue); }}>
                            <Check className={cn("mr-2 h-4 w-4", field.value === product.id ? "opacity-100" : "opacity-0")} />
                            {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup></Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              <Input type="number" {...register("caseUnitCount", { valueAsNumber: true })} placeholder="Units per Case (e.g., 12)" />
            </div>
          </div>
        )}
      </div>


      <div className="pt-6 space-x-2 flex items-center justify-end w-full">
        <Button disabled={loading} variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button disabled={loading} type="submit">{initialData ? "Save changes" : "Create"}</Button>
      </div>

    </form>
  );
};