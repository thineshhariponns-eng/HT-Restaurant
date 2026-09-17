import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartItem } from '../../shared/cart-item/cart-item';
import { OrderSummary } from '../../shared/order-summary/order-summary';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CartItem, OrderSummary],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected onCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
