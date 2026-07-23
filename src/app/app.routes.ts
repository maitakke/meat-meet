import { Routes } from '@angular/router';

import {
  authGuard,
  guestGuard,
  parentGuard,
  selectUserPageGuard,
  userSelectedGuard,
} from './core/guards/session.guards';

export const routes: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'select-user',
    loadComponent: () =>
      import('./features/auth/select-user/select-user').then((m) => m.SelectUser),
    canActivate: [selectUserPageGuard],
  },
  {
    path: '',
    canActivate: [authGuard, userSelectedGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/video-list/video-list').then((m) => m.VideoList),
      },
      {
        path: 'watch/:id',
        loadComponent: () =>
          import('./features/video-watch/video-watch').then((m) => m.VideoWatch),
      },
      {
        path: 'search',
        loadComponent: () => import('./features/search/search').then((m) => m.Search),
      },
      {
        path: 'mypage',
        loadComponent: () =>
          import('./features/my-page/my-page').then((m) => m.MyPage),
        canActivate: [parentGuard],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/account-settings/account-settings').then(
            (m) => m.AccountSettings
          ),
        canActivate: [parentGuard],
      },
    ],
  },
];
