import { Injectable, computed, inject, signal } from '@angular/core';

import { Family, FamilyUser } from '../models';
import { FamilyService } from './family.service';

const SELECTED_USER_KEY = 'meat-meet:selectedUserId';

/** ログイン後の「家族の情報」と「選択中のファミリーユーザー」を保持するアプリ全体の状態。 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly familyService = inject(FamilyService);

  private loadedFamilyId: string | null = null;

  readonly family = signal<Family | null>(null);
  readonly familyUsers = signal<FamilyUser[]>([]);
  readonly selectedUser = signal<FamilyUser | null>(null);

  readonly role = computed(() => this.selectedUser()?.role ?? null);
  readonly isChild = computed(() => this.role() === 'child');

  /** すでに同じ家族分の情報を読み込んでいれば何もしない。初回のみFirestoreへ問い合わせる。 */
  async ensureFamilyLoaded(familyId: string): Promise<void> {
    if (this.loadedFamilyId === familyId) {
      return;
    }

    const [family, users] = await Promise.all([
      this.familyService.getFamily(familyId),
      this.familyService.listFamilyUsers(familyId),
    ]);
    this.family.set(family);
    this.familyUsers.set(users);
    this.loadedFamilyId = familyId;

    const storedUserId = sessionStorage.getItem(SELECTED_USER_KEY);
    const restoredUser = users.find((user) => user.id === storedUserId);
    if (restoredUser) {
      this.selectedUser.set(restoredUser);
    } else if (users.length === 1) {
      this.selectUser(users[0]);
    } else {
      this.selectedUser.set(null);
    }
  }

  selectUser(user: FamilyUser): void {
    this.selectedUser.set(user);
    sessionStorage.setItem(SELECTED_USER_KEY, user.id);
  }

  /** ユーザー選択に戻る(ユーザー切り替え)。家族の情報自体は再取得しない。 */
  deselectUser(): void {
    this.selectedUser.set(null);
    sessionStorage.removeItem(SELECTED_USER_KEY);
  }

  /** ログアウト時に全状態を破棄する。 */
  clear(): void {
    this.family.set(null);
    this.familyUsers.set([]);
    this.selectedUser.set(null);
    this.loadedFamilyId = null;
    sessionStorage.removeItem(SELECTED_USER_KEY);
  }
}
