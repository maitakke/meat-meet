import { Component, computed, input, signal } from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import type * as YT from 'youtube';

// YT.PlayerState.ENDED の値。YT名前空間はUMDグローバルのため
// モジュール内では列挙値を直接参照できず、数値で保持する。
const PLAYER_STATE_ENDED = 0;

interface Comment {
  author: string;
  text: string;
}

@Component({
  selector: 'app-video-watch',
  imports: [YouTubePlayer],
  templateUrl: './video-watch.html',
  styleUrl: './video-watch.css',
})
export class VideoWatch {
  readonly videoId = input<string>('jNQXAC9IVRw');
  readonly channelName = input<string>('ぶーぶーチャンネル');

  protected readonly showEndScreen = signal(false);

  protected readonly playerVars: YT.PlayerVars = {
    rel: 0,
    playsinline: 1,
    modestbranding: 1,
  };

  protected readonly isSubscribed = signal(false);

  protected readonly isLiked = signal(false);
  protected readonly baseLikeCount = signal(12);
  protected readonly likeCount = computed(
    () => this.baseLikeCount() + (this.isLiked() ? 1 : 0)
  );

  protected readonly comments = signal<Comment[]>([
    { author: 'まま', text: 'たのしいね〜' },
    { author: 'ぱぱ', text: 'また みようね' },
  ]);
  protected readonly newComment = signal('');

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

  protected onToggleSubscribe(): void {
    this.isSubscribed.update((subscribed) => !subscribed);
  }

  protected onToggleLike(): void {
    this.isLiked.update((liked) => !liked);
  }

  protected onCommentInput(event: Event): void {
    this.newComment.set((event.target as HTMLInputElement).value);
  }

  protected onAddComment(): void {
    const text = this.newComment().trim();
    if (!text) {
      return;
    }
    this.comments.update((list) => [...list, { author: 'あなた', text }]);
    this.newComment.set('');
  }
}
