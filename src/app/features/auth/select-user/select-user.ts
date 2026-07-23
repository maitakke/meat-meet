import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { FamilyUser } from '../../../core/models';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-select-user',
  imports: [],
  templateUrl: './select-user.html',
  styleUrl: './select-user.css',
})
export class SelectUser {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly familyUsers = this.sessionService.familyUsers;
  protected readonly familyName = computed(
    () => this.sessionService.family()?.familyName ?? ''
  );

  protected onSelect(user: FamilyUser): void {
    this.sessionService.selectUser(user);
    this.router.navigateByUrl('/');
  }
}
