import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenuItemCard } from '../../shared/menu-item-card/menu-item-card';
import { QuantitySelector } from '../../shared/quantity-selector/quantity-selector';
import { MENU_DISHES } from '../../data/menu-data';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-menu-item-detail',
  imports: [RouterLink, MenuItemCard, QuantitySelector],
  templateUrl: './menu-item-detail.html',
  styleUrl: './menu-item-detail.css'
})
export class MenuItemDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartService);
  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });

  protected readonly dish = computed(() => {
    const slug = this.paramMap().get('slug');
    return MENU_DISHES.find((d) => d.slug === slug);
  });

  protected readonly relatedDishes = computed(() => {
    const current = this.dish();
    if (!current) return [];
    return MENU_DISHES.filter((d) => d.category === current.category && d.slug !== current.slug).slice(0, 3);
  });

  protected readonly quantity = signal(1);

  constructor() {
    // Reset quantity whenever the viewed dish changes (e.g. via a related-dish link).
    effect(() => {
      this.dish();
      this.quantity.set(1);
    });
  }

  protected decrementQuantity(): void {
    this.quantity.update((qty) => Math.max(1, qty - 1));
  }

  protected incrementQuantity(): void {
    this.quantity.update((qty) => qty + 1);
  }

  protected onAddToCart(): void {
    const current = this.dish();
    if (!current) return;
    this.cart.addItem(current, this.quantity());
  }

  protected onRelatedAddToCart(slug: string): void {
    const related = MENU_DISHES.find((d) => d.slug === slug);
    if (related) {
      this.cart.addItem(related);
    }
  }
}
