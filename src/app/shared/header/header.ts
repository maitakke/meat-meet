import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

/** メニューを開いてから操作がないまま自動で閉じるまでの時間(ミリ秒)。 */
const MENU_AUTO_CLOSE_MS = 3000;

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly selectedUser = this.sessionService.selectedUser;
  protected readonly isMenuOpen = signal(false);

  private menuCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearMenuCloseTimer());
  }

  protected onToggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
    if (this.isMenuOpen()) {
      this.scheduleMenuClose();
    } else {
      this.clearMenuCloseTimer();
    }
  }

  protected onSwitchUser(): void {
    this.closeMenu();
    this.sessionService.deselectUser();
    this.router.navigateByUrl('/select-user');
  }

  protected async onLogout(): Promise<void> {
    this.closeMenu();
    await this.authService.signOutUser();
    this.sessionService.clear();
    await this.router.navigateByUrl('/login');
  }

  private closeMenu(): void {
    this.clearMenuCloseTimer();
    this.isMenuOpen.set(false);
  }

  /** 一定時間後にメニューを自動で閉じるタイマーを仕込む(既存タイマーは張り直す)。 */
  private scheduleMenuClose(): void {
    this.clearMenuCloseTimer();
    this.menuCloseTimer = setTimeout(() => {
      this.menuCloseTimer = null;
      this.isMenuOpen.set(false);
    }, MENU_AUTO_CLOSE_MS);
  }

  private clearMenuCloseTimer(): void {
    if (this.menuCloseTimer !== null) {
      clearTimeout(this.menuCloseTimer);
      this.menuCloseTimer = null;
    }
  }
}
