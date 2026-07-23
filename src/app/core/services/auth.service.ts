import { Injectable, inject, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { AUTH } from '../firebase.providers';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(AUTH);
  private readonly authReadyPromise: Promise<User | null>;

  readonly currentUser = signal<User | null>(null);

  constructor() {
    let resolveReady: (user: User | null) => void;
    this.authReadyPromise = new Promise<User | null>((resolve) => {
      resolveReady = resolve;
    });

    let resolved = false;
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      if (!resolved) {
        resolved = true;
        resolveReady(user);
      }
    });
  }

  /** Firebaseの初期認証状態の解決を待つ。ガードでのリダイレクト判定に使う。 */
  waitForAuthReady(): Promise<User | null> {
    return this.authReadyPromise;
  }

  async signUp(email: string, password: string): Promise<string> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return credential.user.uid;
  }

  async signIn(email: string, password: string): Promise<string> {
    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return credential.user.uid;
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }
}
