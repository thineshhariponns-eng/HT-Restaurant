import { Injectable, computed, signal } from '@angular/core';
import type { OrderType } from '../shared/order-type-selector/order-type-selector';

export interface CartLine {
  slug: string;
  name: string;
  price: number;
  quantity: number;
}

export const TAX_RATE = 0.05;
export const DELIVERY_FEE = 40;

/** In-memory cart store — no backend yet. Seeded with mock lines for demo purposes. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSignal = signal<CartLine[]>([
    { slug: 'erode-special-biryani', name: 'Erode Special Biryani', price: 260, quantity: 2 },
    { slug: 'butter-chicken', name: 'Butter Chicken', price: 280, quantity: 1 }
  ]);

  readonly lines = this.linesSignal.asReadonly();

  private readonly orderTypeSignal = signal<OrderType>('delivery');
  readonly orderType = this.orderTypeSignal.asReadonly();

  readonly itemCount = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));

  readonly subtotal = computed(() => this.lines().reduce((sum, line) => sum + line.price * line.quantity, 0));

  readonly tax = computed(() => Math.round(this.subtotal() * TAX_RATE));

  readonly deliveryFee = computed(() =>
    this.lines().length === 0 || this.orderType() === 'pickup' ? 0 : DELIVERY_FEE
  );

  readonly total = computed(() => this.subtotal() + this.tax() + this.deliveryFee());

  addItem(dish: { slug: string; name: string; price: number }, quantity = 1): void {
    this.linesSignal.update((lines) => {
      const existing = lines.find((line) => line.slug === dish.slug);
      if (existing) {
        return lines.map((line) =>
          line.slug === dish.slug ? { ...line, quantity: line.quantity + quantity } : line
        );
      }
      return [...lines, { slug: dish.slug, name: dish.name, price: dish.price, quantity }];
    });
  }

  incrementQuantity(slug: string): void {
    this.linesSignal.update((lines) =>
      lines.map((line) => (line.slug === slug ? { ...line, quantity: line.quantity + 1 } : line))
    );
  }

  decrementQuantity(slug: string): void {
    this.linesSignal.update((lines) =>
      lines.map((line) => (line.slug === slug ? { ...line, quantity: Math.max(1, line.quantity - 1) } : line))
    );
  }

  removeItem(slug: string): void {
    this.linesSignal.update((lines) => lines.filter((line) => line.slug !== slug));
  }

  setOrderType(type: OrderType): void {
    this.orderTypeSignal.set(type);
  }

  clearCart(): void {
    this.linesSignal.set([]);
  }
}
