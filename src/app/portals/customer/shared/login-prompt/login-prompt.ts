import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { AuthService, LOGIN_URL } from '../../services/auth';

/** Modal shown when a signed-out customer tries to add to the cart. Driven by AuthService. */
@Component({
  selector: 'app-login-prompt',
  templateUrl: './login-prompt.html',
  styleUrl: './login-prompt.css'
})
export class LoginPrompt {
  private readonly auth = inject(AuthService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** A drag that starts inside the sheet and ends on the backdrop must not close it. */
  private pressStartedOnBackdrop = false;

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      const shouldBeOpen = this.auth.loginPromptOpen() && !this.auth.isLoggedIn();
      if (shouldBeOpen && !el.open) el.showModal();
      if (!shouldBeOpen && el.open) el.close();
    });
  }

  protected close(): void {
    this.auth.closeLoginPrompt();
  }

  protected goToLogin(): void {
    this.auth.closeLoginPrompt();
    window.location.href = LOGIN_URL;
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pressStartedOnBackdrop = event.target === this.dialog().nativeElement;
  }

  protected onClick(event: MouseEvent): void {
    if (this.pressStartedOnBackdrop && event.target === this.dialog().nativeElement) this.close();
    this.pressStartedOnBackdrop = false;
  }
}
