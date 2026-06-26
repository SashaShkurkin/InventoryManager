import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Allows only authenticated investors; redirects others to the investor portal. */
export const investorGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isInvestor()) return true;

  router.navigate(['/investor']);
  return false;
};
