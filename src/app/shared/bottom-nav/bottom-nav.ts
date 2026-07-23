import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
})
export class BottomNav {
  private readonly sessionService = inject(SessionService);

  protected readonly selectedUser = this.sessionService.selectedUser;
  protected readonly isChild = this.sessionService.isChild;
}
