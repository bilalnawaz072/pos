import { create } from 'zustand';
import { toast } from 'sonner';
import { Product, Promotion } from '@/lib/generated/prisma';

export type CartItem = {
  product: Product;
  quantity: number;
  weight?: number;
  discountApplied: number;
};

type PromotionWithProductIds = Promotion & { products: { id: string }[] };

type CartState = {
  items: CartItem[];
  mode: 'sale' | 'return';
  activePromotions: PromotionWithProductIds[];
  weighedItem: Product | null;
  ageRestrictedItem: Product | null;
  totalItems: number;
  subtotal: number;
  discounts: number;
  setPromotions: (promotions: PromotionWithProductIds[]) => void;
  setMode: (mode: 'sale' | 'return') => void;
  setWeighedItem: (product: Product | null) => void;
  setAgeRestrictedItem: (product: Product | null) => void;
  loadReturnItems: (items: CartItem[]) => void;
  addItem: (product: Product) => void;
  addWeighedItem: (product: Product, weight: number) => void;
  addVerifiedItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const calculateTotals = (items: CartItem[], promotions: PromotionWithProductIds[], mode: 'sale' | 'return') => {
  let totalItems = 0;
  let subtotal = 0;
  let totalDiscounts = 0;

  const processedItems = items.map(item => {
    totalItems += item.quantity;
    const lineSubtotal = item.weight ? item.product.price * item.weight * Math.sign(item.quantity) : item.product.price * item.quantity;
    subtotal += lineSubtotal;

    let discountApplied = 0;
    if (mode === 'sale') {
      const applicablePromotion = promotions.find(promo =>
        promo.type === 'PERCENTAGE_OFF_PRODUCT' &&
        promo.products.some(p => p.id === item.product.id)
      );

      if (applicablePromotion) {
        discountApplied = lineSubtotal * (applicablePromotion.discountValue / 100);
        totalDiscounts += discountApplied;
      }
    }
    return { ...item, discountApplied };
  });

  return { items: processedItems, totalItems, subtotal, discounts: totalDiscounts };
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  mode: 'sale',
  activePromotions: [],
  weighedItem: null,
  ageRestrictedItem: null,
  totalItems: 0,
  subtotal: 0,
  discounts: 0,

  setPromotions: (promotions) => {
    set({ activePromotions: promotions });
    const { items, mode } = get();
    set(calculateTotals(items, promotions, mode));
  },

  setMode: (mode) => set({ mode, ...calculateTotals([], get().activePromotions, mode) }),
  setWeighedItem: (product) => set({ weighedItem: product }),
  setAgeRestrictedItem: (product) => set({ ageRestrictedItem: product }),

  loadReturnItems: (items) => {
    set(calculateTotals(items, get().activePromotions, 'return'));
  },

  addItem: (product) => {
    if (get().mode === 'return') { toast.error("Cannot add products in Return Mode."); return; }
    if (product.isAgeRestricted) { set({ ageRestrictedItem: product }); return; }
    // if (product.isWeighed) { set({ weighedItem: product }); return; }
    if (product.isWeighed) {
      // If it's a "real" weighed item from the main product list
      if (product.unit !== 'each') {
        set({ weighedItem: product });
        return;
      }
    }
    const { items, activePromotions, mode } = get();
    const existingItem = items.find((item) => item.product.id === product.id);
    const quantityInCart = existingItem ? existingItem.quantity : 0;
    if (quantityInCart >= product.stockQuantity) { toast.error("Maximum stock reached."); return; }

    const updatedItems = existingItem
      ? items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { product, quantity: 1, discountApplied: 0 }];

    set(calculateTotals(updatedItems, activePromotions, mode));
    toast.success(`${product.name} added to cart.`);
  },

  addVerifiedItem: (product) => {
    const { items, activePromotions, mode } = get();
    const existingItem = items.find((item) => item.product.id === product.id);
    const quantityInCart = existingItem ? existingItem.quantity : 0;
    if (quantityInCart >= product.stockQuantity) { toast.error("Maximum stock reached."); return; }

    const updatedItems = existingItem
      ? items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { product, quantity: 1, discountApplied: 0 }];

    set(calculateTotals(updatedItems, activePromotions, mode));
    toast.success(`${product.name} added to cart.`);
  },

  addWeighedItem: (product, weight) => {
    if (weight <= 0) { toast.error("Weight must be greater than zero."); return; }
    const { items, activePromotions, mode } = get();
    const updatedItems = [...items, { product, quantity: 1, weight, discountApplied: 0 }];
    set(calculateTotals(updatedItems, activePromotions, mode));
    toast.success(`${product.name} (${weight} lbs) added to cart.`);
  },

  removeItem: (productId) => {
    const { items, activePromotions, mode } = get();
    const itemToRemove = items.find(item => item.product.id === productId);
    const updatedItems = items.filter(item => item.product.id !== productId);
    set(calculateTotals(updatedItems, activePromotions, mode));
    if (itemToRemove) toast.info(`${itemToRemove.product.name} removed from cart.`);
  },

  updateQuantity: (productId, quantity) => {
    const { items, activePromotions, mode } = get();
    const itemToUpdate = items.find(item => item.product.id === productId);
    if (!itemToUpdate) return;
    if (itemToUpdate.product.isWeighed || get().mode === 'return') { toast.error("Cannot change quantity."); return; }

    if (quantity > itemToUpdate.product.stockQuantity) {
      toast.error("Maximum stock reached.");
      const updatedItems = items.map((item) => item.product.id === productId ? { ...item, quantity: itemToUpdate.product.stockQuantity } : item);
      set(calculateTotals(updatedItems, activePromotions, mode));
      return;
    }

    const updatedItems = (quantity < 1)
      ? items.filter((item) => item.product.id !== productId)
      : items.map((item) => item.product.id === productId ? { ...item, quantity } : item);
    set(calculateTotals(updatedItems, activePromotions, mode));
  },

  clearCart: () => {
    set({ items: [], totalItems: 0, subtotal: 0, discounts: 0, weighedItem: null, ageRestrictedItem: null, mode: 'sale' });
  },
}));