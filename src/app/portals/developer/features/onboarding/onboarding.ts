import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClientsStore } from '../../core/services/clients-store';
import { adminHost } from '../../core/utils/domain';

const HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

@Component({
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding.html',
})
export class Onboarding {
  private readonly store = inject(ClientsStore);
  private readonly router = inject(Router);

  /** True once Create is pressed, so errors stay hidden while typing. */
  protected readonly submitted = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    city: [''],
    contact: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    domain: ['', [Validators.required, Validators.pattern(HOSTNAME)]],
    adminDomain: ['', [Validators.required, Validators.pattern(HOSTNAME)]],
  });

  constructor() {
    /** The admin host follows the customer host until it is edited by hand. */
    this.form.controls.domain.valueChanges.subscribe((domain) => {
      const admin = this.form.controls.adminDomain;
      if (admin.pristine) admin.setValue(domain ? adminHost(domain) : '', { emitEvent: false });
    });
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && (this.submitted() || field.touched);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const client = this.store.add(this.form.getRawValue());
    this.router.navigate(['/clients', client.id]);
  }
}
