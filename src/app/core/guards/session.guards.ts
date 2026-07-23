import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

/** 未ログインならログイン画面へリダイレクト。 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForAuthReady();
  return user ? true : router.createUrlTree(['/login']);
};

/** ログイン済みかつユーザー選択済みでなければユーザー選択画面へリダイレクト。 */
export const userSelectedGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const user = await authService.waitForAuthReady();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  await sessionService.ensureFamilyLoaded(user.uid);
  return sessionService.selectedUser()
    ? true
    : router.createUrlTree(['/select-user']);
};

/** ユーザー選択画面用。すでに選択済みならメイン画面へ、未ログインならログイン画面へ。 */
export const selectUserPageGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const user = await authService.waitForAuthReady();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  await sessionService.ensureFamilyLoaded(user.uid);
  return sessionService.selectedUser() ? router.createUrlTree(['/']) : true;
};

/** 保護者専用画面用。子どもロールの場合はホームへリダイレクト。 */
export const parentGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  return sessionService.role() === 'parent' ? true : router.createUrlTree(['/']);
};

/** ログイン・登録画面用。ログイン済みならメイン画面へリダイレクト。 */
export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForAuthReady();
  return user ? router.createUrlTree(['/']) : true;
};
