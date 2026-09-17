import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dish-card',
  imports: [RouterLink],
  templateUrl: './dish-card.html',
  styleUrl: './dish-card.css'
})
export class DishCard {
  /** When provided, the dish name links through to its detail page. */
  readonly slug = input<string>('');
  readonly name = input.required<string>();
  readonly description = input<string>('');
  readonly price = input.required<number>();
  readonly isVeg = input<boolean>(false);
  readonly isAvailable = input<boolean>(true);
  /** 'hero' is the one flagship dish per section; everything else is a dense ruled row. */
  readonly size = input<'default' | 'hero'>('default');

  readonly addToCart = output<void>();

  protected onAddToCart(): void {
    this.addToCart.emit();
  }
}
