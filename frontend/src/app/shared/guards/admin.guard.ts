import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUserInfo();

  if (user && user.ruolo === 'admin') {
    return true;
  } else {
    return router.parseUrl('/login'); // o una pagina di accesso negato
  }
};
