import { Routes } from '@angular/router';

import { AccountSettings } from './features/account-settings/account-settings';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { SelectUser } from './features/auth/select-user/select-user';
import { MyPage } from './features/my-page/my-page';
import { Search } from './features/search/search';
import { VideoList } from './features/video-list/video-list';
import { VideoWatch } from './features/video-watch/video-watch';
import {
  authGuard,
  guestGuard,
  parentGuard,
  selectUserPageGuard,
  userSelectedGuard,
} from './core/guards/session.guards';

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
    canActivate: [authGuard, userSelectedGuard],
    children: [
      { path: '', component: VideoList },
      { path: 'watch/:id', component: VideoWatch },
      { path: 'search', component: Search },
      { path: 'mypage', component: MyPage, canActivate: [parentGuard] },
      {
        path: 'settings',
        component: AccountSettings,
        canActivate: [parentGuard],
      },
    ],
  },
];
