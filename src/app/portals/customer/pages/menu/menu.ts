import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuItemCard } from '../../shared/menu-item-card/menu-item-card';
import { CATEGORY_ORDER, CategoryName, MENU_DISHES, MenuDish, categorySlug } from '../../data/menu-data';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';

type CategoryFilter = 'All' | CategoryName;

@Component({
  selector: 'app-menu',
  imports: [MenuItemCard],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);

  protected readonly filters: CategoryFilter[] = ['All', ...CATEGORY_ORDER];

  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<CategoryFilter>('All');

  protected readonly filteredDishes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.selectedCategory();

    return MENU_DISHES.filter((dish) => {
      const matchesCategory = category === 'All' || dish.category === category;
      const matchesQuery =
        query.length === 0 ||
        dish.name.toLowerCase().includes(query) ||
        dish.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  constructor(route: ActivatedRoute) {
    const initialCategory = route.snapshot.queryParamMap.get('category');
    const matched = CATEGORY_ORDER.find((label) => categorySlug(label) === initialCategory);
    if (matched) {
      this.selectedCategory.set(matched);
    }
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected selectCategory(category: CategoryFilter): void {
    this.selectedCategory.set(category);
  }

  protected onAddToCart(dish: MenuDish): void {
    if (!this.auth.requireLogin()) return;
    this.cart.addItem(dish);
  }
}
