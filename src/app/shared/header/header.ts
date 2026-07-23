import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

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

  protected onToggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  protected onSwitchUser(): void {
    this.isMenuOpen.set(false);
    this.sessionService.deselectUser();
    this.router.navigateByUrl('/select-user');
  }

  protected async onLogout(): Promise<void> {
    this.isMenuOpen.set(false);
    await this.authService.signOutUser();
    this.sessionService.clear();
    await this.router.navigateByUrl('/login');
  }
}
