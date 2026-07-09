import { InjectionToken } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import { environment } from '../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');
export const AUTH = new InjectionToken<Auth>('AUTH');

export const firebaseProviders = [
  {
    provide: FIREBASE_APP,
    useFactory: () => initializeApp(environment.firebaseConfig),
  },
  {
    provide: FIRESTORE,
    useFactory: (app: FirebaseApp) => getFirestore(app),
    deps: [FIREBASE_APP],
  },
  {
    provide: AUTH,
    useFactory: (app: FirebaseApp) => getAuth(app),
    deps: [FIREBASE_APP],
  },
];
