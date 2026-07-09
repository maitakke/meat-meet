import { Component, input, signal } from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import type * as YT from 'youtube';

// YT.PlayerState.ENDED の値。YT名前空間はUMDグローバルのため
// モジュール内では列挙値を直接参照できず、数値で保持する。
const PLAYER_STATE_ENDED = 0;

@Component({
  selector: 'app-video-watch',
  imports: [YouTubePlayer],
  templateUrl: './video-watch.html',
  styleUrl: './video-watch.css',
})
export class VideoWatch {
  readonly videoId = input<string>('jNQXAC9IVRw');

  protected readonly showEndScreen = signal(false);

  protected readonly playerVars: YT.PlayerVars = {
    rel: 0,
    playsinline: 1,
    modestbranding: 1,
  };

  protected onStateChange(event: YT.OnStateChangeEvent): void {
    if (event.data === PLAYER_STATE_ENDED) {
      this.showEndScreen.set(true);
    }
  }

  protected onReplay(): void {
    this.showEndScreen.set(false);
  }

  protected onBackToList(): void {
    // TODO: 一覧画面のルーティング実装後に、実際の画面遷移に置き換える
    this.showEndScreen.set(false);
  }
}
