import { Injectable, signal } from '@angular/core';

/** Existing login page, served by the .NET app. */
export const LOGIN_URL = 'http://localhost:8090/Account/Login';

/** In-memory customer session — no backend yet. Starts signed out. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loggedInSignal = signal(false);
  readonly isLoggedIn = this.loggedInSignal.asReadonly();

  private readonly promptOpenSignal = signal(false);
  readonly loginPromptOpen = this.promptOpenSignal.asReadonly();

  login(): void {
    this.loggedInSignal.set(true);
  }

  logout(): void {
    this.loggedInSignal.set(false);
  }

  /** True when the customer may go ahead; otherwise opens the log-in prompt and returns false. */
  requireLogin(): boolean {
    if (this.loggedInSignal()) return true;
    this.promptOpenSignal.set(true);
    return false;
  }

  closeLoginPrompt(): void {
    this.promptOpenSignal.set(false);
  }
}
