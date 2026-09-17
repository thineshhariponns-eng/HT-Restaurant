import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-item-card',
  imports: [RouterLink],
  templateUrl: './menu-item-card.html',
  styleUrl: './menu-item-card.css'
})
export class MenuItemCard {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly description = input<string>('');
  readonly price = input.required<number>();
  readonly isVeg = input<boolean>(false);
  readonly isAvailable = input<boolean>(true);

  readonly addToCart = output<void>();

  protected onAddToCart(): void {
    this.addToCart.emit();
  }
}
