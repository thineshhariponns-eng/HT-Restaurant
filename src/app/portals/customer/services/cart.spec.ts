import { TestBed } from '@angular/core/testing';
import { CartService } from './cart';

describe('CartService delivery fee', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('charges delivery by default', () => {
    const cart = TestBed.inject(CartService);
    expect(cart.deliveryFee()).toBe(40);
    expect(cart.total()).toBe(cart.subtotal() + cart.tax() + 40);
  });

  it('charges no delivery fee for pickup', () => {
    const cart = TestBed.inject(CartService);
    cart.setOrderType('pickup');
    expect(cart.deliveryFee()).toBe(0);
    expect(cart.total()).toBe(cart.subtotal() + cart.tax());
  });

  it('charges no delivery fee for an empty cart', () => {
    const cart = TestBed.inject(CartService);
    cart.clearCart();
    expect(cart.deliveryFee()).toBe(0);
  });
});
