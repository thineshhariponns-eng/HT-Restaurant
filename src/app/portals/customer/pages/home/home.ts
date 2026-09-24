import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DishCard } from '../../shared/dish-card/dish-card';
import { CategoryTile } from '../../shared/category-tile/category-tile';
import { CATEGORY_ORDER, MENU_DISHES, MenuDish, categorySlug } from '../../data/menu-data';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';

interface DayHours {
  /** Minutes after midnight. */
  open: number;
  close: number;
}

const WEEKDAY_HOURS: DayHours = { open: 11 * 60, close: 22 * 60 + 30 };
const WEEKEND_HOURS: DayHours = { open: 10 * 60 + 30, close: 23 * 60 };

function hoursForDay(day: number): DayHours {
  return day === 0 || day === 6 ? WEEKEND_HOURS : WEEKDAY_HOURS;
}

function formatMinutes(minutes: number): string {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, DishCard, CategoryTile],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);

  protected readonly dishes = MENU_DISHES;

  protected readonly categories = CATEGORY_ORDER.map((label) => ({
    label,
    slug: categorySlug(label),
    count: this.dishes.filter((dish) => dish.category === label).length
  }));

  protected readonly menuByCategory = CATEGORY_ORDER.map((label) => ({
    label,
    dishes: this.dishes.filter((dish) => dish.category === label)
  }));

  protected readonly flagshipDish = this.dishes[0];

  protected readonly favoriteRows = this.dishes.filter((dish) =>
    ['Butter Chicken', 'Paneer Tikka Masala', 'Erode Karuveppilai Sadam'].includes(dish.name)
  );

  /** Live open/closed state — re-evaluated every 30s against the hours below. */
  private readonly now = signal(new Date());

  protected readonly isOpen = computed(() => {
    const d = this.now();
    const minutes = d.getHours() * 60 + d.getMinutes();
    const { open, close } = hoursForDay(d.getDay());
    return minutes >= open && minutes < close;
  });

  protected readonly todayHoursLabel = computed(() => {
    const { open, close } = hoursForDay(this.now().getDay());
    return `${formatMinutes(open)} – ${formatMinutes(close)}`;
  });

  protected readonly statusLabel = computed(() => {
    const d = this.now();
    const minutes = d.getHours() * 60 + d.getMinutes();
    const today = hoursForDay(d.getDay());

    if (this.isOpen()) {
      return `Kitchen closes at ${formatMinutes(today.close)} tonight`;
    }
    if (minutes < today.open) {
      return `Opens today at ${formatMinutes(today.open)}`;
    }
    const tomorrow = hoursForDay((d.getDay() + 1) % 7);
    return `Opens tomorrow at ${formatMinutes(tomorrow.open)}`;
  });

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 30_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected onAddToCart(dish: MenuDish): void {
    if (!this.auth.requireLogin()) return;
    this.cart.addItem(dish);
  }
}
