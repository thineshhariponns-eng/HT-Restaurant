import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
  exact: boolean;
}

@Component({
  selector: 'app-customer-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './customer-nav.html',
  styleUrl: './customer-nav.css'
})
export class CustomerNav {
  readonly variant = input<'horizontal' | 'stacked'>('horizontal');

  readonly linkClick = output<void>();

  protected readonly links: NavLink[] = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Menu', path: '/menu', exact: false },
    { label: 'My Orders', path: '/orders', exact: false },
    { label: 'About', path: '/about', exact: false },
    { label: 'Contact', path: '/contact', exact: false }
  ];

  protected onLinkClick(): void {
    this.linkClick.emit();
  }
}
