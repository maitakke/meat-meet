import { Routes } from '@angular/router';

import {
  authGuard,
  guestGuard,
  selectUserPageGuard,
  userSelectedGuard,
} from './core/guards/session.guards';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { SelectUser } from './features/auth/select-user/select-user';
import { VideoWatch } from './features/video-watch/video-watch';

export const routes: Routes = [
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  {
    path: 'select-user',
    component: SelectUser,
    canActivate: [selectUserPageGuard],
  },
  {
    path: '',
    component: VideoWatch,
    canActivate: [authGuard, userSelectedGuard],
  },
];
