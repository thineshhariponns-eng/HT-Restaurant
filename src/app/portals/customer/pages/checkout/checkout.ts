import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../services/cart';
import { FormField } from '../../shared/form-field/form-field';
import { FormTextarea } from '../../shared/form-textarea/form-textarea';
import { OrderType, OrderTypeSelector } from '../../shared/order-type-selector/order-type-selector';
import { CheckoutSummary } from '../../shared/checkout-summary/checkout-summary';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, ReactiveFormsModule, FormField, FormTextarea, OrderTypeSelector, CheckoutSummary],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {
  protected readonly cart = inject(CartService);
  private readonly fb = inject(FormBuilder);

  protected readonly orderPlaced = signal(false);
  protected readonly orderReference = signal('');
  protected readonly orderType = signal<OrderType>('delivery');

  protected readonly checkoutForm = this.fb.nonNullable.group({
    fullName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    phone: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    orderType: this.fb.nonNullable.control<OrderType>('delivery', [Validators.required]),
    delivery: this.fb.nonNullable.group({
      address: this.fb.nonNullable.control(''),
      city: this.fb.nonNullable.control(''),
      postalCode: this.fb.nonNullable.control('')
    }),
    notes: this.fb.nonNullable.control('', [Validators.maxLength(300)])
  });

  protected readonly fullNameErrors = {
    required: 'Please enter your name.',
    minlength: 'Name must be at least 2 characters.'
  };
  protected readonly phoneErrors = {
    required: 'Please enter your phone number.',
    pattern: 'Enter a valid 10-digit phone number.'
  };
  protected readonly emailErrors = {
    required: 'Please enter your email.',
    email: 'Enter a valid email address.'
  };
  protected readonly addressErrors = { required: 'Please enter your delivery address.' };
  protected readonly cityErrors = { required: 'Please enter your city.' };
  protected readonly postalCodeErrors = {
    required: 'Please enter your postal code.',
    pattern: 'Enter a valid 6-digit postal code.'
  };
  protected readonly notesErrors = { maxlength: 'Notes must be under 300 characters.' };

  constructor() {
    this.applyDeliveryValidators('delivery');
    this.cart.setOrderType('delivery');
    this.checkoutForm.controls.orderType.valueChanges.subscribe((value) => {
      this.orderType.set(value);
      this.cart.setOrderType(value);
      this.applyDeliveryValidators(value);
    });
  }

  private applyDeliveryValidators(type: OrderType): void {
    const delivery = this.checkoutForm.controls.delivery.controls;
    if (type === 'delivery') {
      delivery.address.setValidators([Validators.required]);
      delivery.city.setValidators([Validators.required]);
      delivery.postalCode.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
    } else {
      delivery.address.clearValidators();
      delivery.city.clearValidators();
      delivery.postalCode.clearValidators();
    }
    delivery.address.updateValueAndValidity();
    delivery.city.updateValueAndValidity();
    delivery.postalCode.updateValueAndValidity();
  }

  protected onPlaceOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    console.log('Mock order placed', {
      customer: this.checkoutForm.getRawValue(),
      lines: this.cart.lines(),
      total: this.cart.total()
    });

    this.orderReference.set(`HT-${Date.now().toString().slice(-6)}`);
    this.orderPlaced.set(true);
    this.cart.clearCart();
  }
}
