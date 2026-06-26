import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Declared globally by the Google Identity Services script in index.html
declare const google: any;

/** Which GSI flow is currently being initiated — controls which backend endpoint to call. */
type LoginMode = 'owner' | 'investor' | 'scout' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'inv_jwt';

  /** Role extracted from the stored JWT: 'owner' | 'investor' | null */
  private _role = signal<string | null>(null);

  isAuthenticated = computed(() => this._role() !== null);
  isOwner         = computed(() => this._role() === 'owner');
  isInvestor      = computed(() => this._role() === 'investor');
  isScout         = computed(() => this._role() === 'scout');

  private googleClientId = '';
  private googleReady    = false;
  private loginMode: LoginMode = null;

  constructor(private http: HttpClient) {}

  /**
   * Called once on app startup (via APP_INITIALIZER).
   * Restores an existing session and pre-loads the Google client ID.
   */
  async initialize(): Promise<void> {
    const stored = localStorage.getItem(this.TOKEN_KEY);
    if (stored && !this.isExpired(stored)) {
      this._role.set(this.extractRole(stored));
    }

    try {
      const cfg = await firstValueFrom(
        this.http.get<{ googleClientId: string }>('/api/auth/config')
      );
      if (cfg.googleClientId) {
        this.googleClientId = cfg.googleClientId;
        this.waitForGoogleThenInit();
      }
    } catch {
      // Config unavailable — sign-in button will not appear
    }
  }

  /**
   * Renders a real Google Sign-In button into `element`.
   * Works on mobile (popup triggered by user gesture) unlike One Tap prompt().
   */
  renderButton(element: HTMLElement, mode: 'owner' | 'investor' | 'scout'): void {
    const doRender = () => {
      google.accounts.id.renderButton(element, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'sign_in_with',
        size: 'large',
        click_listener: () => { this.loginMode = mode; }
      });
    };

    if (this.googleReady) {
      doRender();
    } else {
      const poll = setInterval(() => {
        if (this.googleReady) { clearInterval(poll); doRender(); }
      }, 100);
    }
  }

  signOut(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._role.set(null);
    this.loginMode = null;
    window.location.href = '/overview';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private waitForGoogleThenInit(): void {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback:  (r: { credential: string }) => this.handleCredential(r),
        });
        this.googleReady = true;
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
  }

  private async handleCredential(response: { credential: string }): Promise<void> {
    const endpoint =
      this.loginMode === 'investor' ? '/api/auth/investor/google' :
      this.loginMode === 'scout'    ? '/api/auth/scout/google'    :
                                      '/api/auth/google';

    try {
      const result = await firstValueFrom(
        this.http.post<{ token: string }>(endpoint, { idToken: response.credential })
      );
      localStorage.setItem(this.TOKEN_KEY, result.token);
      this._role.set(this.extractRole(result.token));

      const redirect =
        this.loginMode === 'investor' ? '/investor/dashboard' :
        this.loginMode === 'scout'    ? '/scout/dashboard'    :
                                        '/overview';
      window.location.href = redirect;
    } catch (err: any) {
      console.error('Sign-in failed:', err?.error?.error ?? err);
    }
  }

  private extractRole(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['role'] ?? null;
    } catch {
      return null;
    }
  }

  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
