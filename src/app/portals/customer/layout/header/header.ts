import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerNav } from '../customer-nav/customer-nav';
import { CartButton } from '../../shared/cart-button/cart-button';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CustomerNav, CartButton],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private readonly cart = inject(CartService);

  protected readonly mobileMenuOpen = signal(false);
  protected readonly cartItemCount = this.cart.itemCount;

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
