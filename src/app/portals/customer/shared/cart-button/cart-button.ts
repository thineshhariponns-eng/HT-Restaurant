import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart-button',
  imports: [RouterLink],
  templateUrl: './cart-button.html',
  styleUrl: './cart-button.css'
})
export class CartButton {
  readonly itemCount = input<number>(0);

  protected readonly hasItems = computed(() => this.itemCount() > 0);
  protected readonly displayCount = computed(() => (this.itemCount() > 99 ? '99+' : `${this.itemCount()}`));
}
