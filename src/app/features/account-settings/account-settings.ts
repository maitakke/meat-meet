import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AVATAR_PRESETS } from '../../core/avatar-presets';
import { FamilyUser, FamilyUserRole } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { FamilyService } from '../../core/services/family.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-account-settings',
  imports: [],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettings {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly avatarPresets = AVATAR_PRESETS;
  protected readonly family = this.sessionService.family;
  protected readonly familyUsers = this.sessionService.familyUsers;

  protected readonly newName = signal('');
  protected readonly newRole = signal<FamilyUserRole>('child');
  protected readonly newAvatar = signal(AVATAR_PRESETS[0]);
  protected readonly isAdding = signal(false);

  protected readonly editingUserId = signal<string | null>(null);
  protected readonly editName = signal('');
  protected readonly editRole = signal<FamilyUserRole>('child');
  protected readonly editAvatar = signal(AVATAR_PRESETS[0]);

  protected readonly isDeletingAccount = signal(false);

  protected onNewNameInput(event: Event): void {
    this.newName.set((event.target as HTMLInputElement).value);
  }

  protected onEditNameInput(event: Event): void {
    this.editName.set((event.target as HTMLInputElement).value);
  }

  protected async onAddUser(): Promise<void> {
    const name = this.newName().trim();
    const familyId = this.sessionService.family()?.id;
    if (!name || !familyId || this.isAdding()) {
      return;
    }

    this.isAdding.set(true);
    try {
      await this.familyService.addFamilyUser(familyId, {
        name,
        role: this.newRole(),
        avatarUrl: this.newAvatar(),
      });
      this.newName.set('');
      this.newRole.set('child');
      this.newAvatar.set(AVATAR_PRESETS[0]);
      await this.sessionService.refreshFamilyUsers();
    } finally {
      this.isAdding.set(false);
    }
  }

  protected onStartEdit(user: FamilyUser): void {
    this.editingUserId.set(user.id);
    this.editName.set(user.name);
    this.editRole.set(user.role);
    this.editAvatar.set(user.avatarUrl);
  }

  protected onCancelEdit(): void {
    this.editingUserId.set(null);
  }

  protected async onSaveEdit(): Promise<void> {
    const userId = this.editingUserId();
    const familyId = this.sessionService.family()?.id;
    const name = this.editName().trim();
    if (!userId || !familyId || !name) {
      return;
    }

    await this.familyService.updateFamilyUser(familyId, userId, {
      name,
      role: this.editRole(),
      avatarUrl: this.editAvatar(),
    });
    this.editingUserId.set(null);
    await this.sessionService.refreshFamilyUsers();
  }

  protected async onDeleteUser(user: FamilyUser): Promise<void> {
    const familyId = this.sessionService.family()?.id;
    if (!familyId) {
      return;
    }
    if (!confirm(`「${user.name}」を さくじょ しますか？`)) {
      return;
    }
    await this.familyService.deleteFamilyUser(familyId, user.id);
    await this.sessionService.refreshFamilyUsers();
  }

  protected async onDeleteAccount(): Promise<void> {
    const familyId = this.sessionService.family()?.id;
    if (!familyId) {
      return;
    }
    if (
      !confirm(
        'ほんとうに たいかいしますか？かぞくの データは すべて きえて もとに もどせません。'
      )
    ) {
      return;
    }

    this.isDeletingAccount.set(true);
    try {
      const users = this.sessionService.familyUsers();
      await Promise.all(
        users.map((user) => this.familyService.deleteFamilyUser(familyId, user.id))
      );
      await this.familyService.deleteFamily(familyId);
      await this.authService.deleteCurrentAccount();
      this.sessionService.clear();
      await this.router.navigateByUrl('/login');
    } finally {
      this.isDeletingAccount.set(false);
    }
  }
}
