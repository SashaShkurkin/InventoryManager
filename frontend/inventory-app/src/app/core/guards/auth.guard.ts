import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Redirects non-owners (including unauthenticated visitors) to the public overview page. */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isOwner()) return true;

  router.navigate(['/overview']);
  return false;
};
