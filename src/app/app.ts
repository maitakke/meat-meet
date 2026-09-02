import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

import { BottomNav } from './shared/bottom-nav/bottom-nav';
import { Header } from './shared/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, BottomNav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('meat-meet');

  private readonly swUpdate = inject(SwUpdate);

  constructor() {
    // 新しいバージョンが用意できたら、確認のうえリロードして反映する。
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (
          event.type === 'VERSION_READY' &&
          confirm('あたらしい バージョンが あります。さいよみこみ しますか？')
        ) {
          document.location.reload();
        }
      });
    }
  }
}
