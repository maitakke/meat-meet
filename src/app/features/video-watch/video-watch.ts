import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { YouTubePlayer } from '@angular/youtube-player';
import type * as YT from 'youtube';

import { Channel, FamilyUser, Like, Video, VideoComment } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
import { FamilyService } from '../../core/services/family.service';
import { LikeService } from '../../core/services/like.service';
import { SessionService } from '../../core/services/session.service';
import { VideoService } from '../../core/services/video.service';

/** いいね欄に名前を並べて見せる人数。これを超えた分は「ほか N人」にまとめる。 */
const LIKER_PREVIEW_COUNT = 3;

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
  /** ルートパラメータ ':id' (Firestoreの videos/{id}) にバインドされる。 */
  readonly id = input<string>('');

  private readonly videoService = inject(VideoService);
  private readonly likeService = inject(LikeService);
  private readonly channelService = inject(ChannelService);
  private readonly familyService = inject(FamilyService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly video = signal<Video | null>(null);
  protected readonly channel = signal<Channel | null>(null);
  protected readonly comments = signal<VideoComment[]>([]);
  protected readonly isLoading = signal(true);

  protected readonly showEndScreen = signal(false);

  protected readonly playerVars: YT.PlayerVars = {
    rel: 0,
    playsinline: 1,
    modestbranding: 1,
  };

  protected readonly isSubscribed = signal(false);
  protected readonly isLiked = signal(false);
  protected readonly likeCount = signal(0);
  /** いいねした人(押された順)。退会などで見つからない人は含まない。 */
  protected readonly likers = signal<FamilyUser[]>([]);
  protected readonly likerPreview = computed(() =>
    this.likers().slice(0, LIKER_PREVIEW_COUNT)
  );
  /** 名前を出していない残りの人数(見つからない人も含めて数える)。 */
  protected readonly hiddenLikerCount = computed(() =>
    Math.max(0, this.likeCount() - this.likerPreview().length)
  );
  /** スマホ向け: 「ほか N人」を押して全員の名前を広げているか。 */
  protected readonly isLikerListOpen = signal(false);

  protected readonly newComment = signal('');

  /** コメントを けす 操作は「ほごしゃ」ロールのみに見せる。 */
  protected readonly canModerateComments = computed(
    () => this.sessionService.role() === 'parent'
  );

  constructor() {
    effect(() => {
      const videoId = this.id();
      if (videoId) {
        void this.load(videoId);
      }
    });
  }

  private async load(videoId: string): Promise<void> {
    this.isLoading.set(true);
    this.showEndScreen.set(false);
    this.isLikerListOpen.set(false);

    const [video, comments, channel] = await Promise.all([
      this.videoService.getVideo(videoId),
      this.videoService.listComments(videoId),
      this.channelService.findChannelForVideo(videoId),
    ]);
    this.video.set(video);
    this.comments.set(comments);
    this.channel.set(channel);

    const user = this.sessionService.selectedUser();
    const [liked, likes, subscribed] = await Promise.all([
      user ? this.likeService.isLiked(videoId, user.id) : Promise.resolve(false),
      this.likeService.listLikes(videoId),
      user && channel
        ? this.channelService.isSubscribed(channel.id, user.id)
        : Promise.resolve(false),
    ]);
    this.isLiked.set(liked);
    this.likeCount.set(likes.length);
    this.isSubscribed.set(subscribed);

    this.isLoading.set(false);

    // 名前の取得は動画の表示を待たせないよう、読み込み完了後に行う。
    this.likers.set(await this.resolveLikers(likes));
  }

  /** いいねの userId を、各家族のユーザー情報(名前・アイコン)に置き換える。 */
  private async resolveLikers(likes: Like[]): Promise<FamilyUser[]> {
    const familyIds = [...new Set(likes.map((like) => like.familyId))];
    const usersByFamily = await Promise.all(
      familyIds.map((familyId) =>
        this.familyService.listFamilyUsers(familyId).catch(() => [])
      )
    );
    const usersById = new Map(usersByFamily.flat().map((u) => [u.id, u]));
    return likes
      .map((like) => usersById.get(like.userId))
      .filter((u): u is FamilyUser => u !== undefined);
  }

  protected onToggleLikerList(): void {
    this.isLikerListOpen.update((open) => !open);
  }

  protected onStateChange(event: YT.OnStateChangeEvent): void {
    if (event.data === PLAYER_STATE_ENDED) {
      this.showEndScreen.set(true);
    }
  }

  protected onReplay(): void {
    this.showEndScreen.set(false);
  }

  protected onBackToList(): void {
    this.showEndScreen.set(false);
    void this.router.navigateByUrl('/');
  }

  protected async onToggleSubscribe(): Promise<void> {
    const channel = this.channel();
    const user = this.sessionService.selectedUser();
    const familyId = this.sessionService.family()?.id;
    if (!channel || !user || !familyId) {
      return;
    }

    const wasSubscribed = this.isSubscribed();
    this.isSubscribed.set(!wasSubscribed);
    try {
      if (wasSubscribed) {
        await this.channelService.unsubscribe(channel.id, user.id);
      } else {
        await this.channelService.subscribe(channel.id, user.id, familyId);
      }
    } catch {
      this.isSubscribed.set(wasSubscribed);
    }
  }

  protected async onToggleLike(): Promise<void> {
    const video = this.video();
    const user = this.sessionService.selectedUser();
    const familyId = this.sessionService.family()?.id;
    if (!video || !user || !familyId) {
      return;
    }

    const wasLiked = this.isLiked();
    const previousLikers = this.likers();
    this.isLiked.set(!wasLiked);
    this.likeCount.update((count) => count + (wasLiked ? -1 : 1));
    this.likers.set(
      wasLiked
        ? previousLikers.filter((u) => u.id !== user.id)
        : [...previousLikers, user]
    );
    try {
      if (wasLiked) {
        await this.likeService.unlike(video.id, user.id);
      } else {
        await this.likeService.like(video.id, user.id, familyId);
      }
    } catch {
      this.isLiked.set(wasLiked);
      this.likeCount.update((count) => count + (wasLiked ? 1 : -1));
      this.likers.set(previousLikers);
    }
  }

  protected async onDeleteComment(comment: VideoComment): Promise<void> {
    const video = this.video();
    if (!video || !this.canModerateComments()) {
      return;
    }
    if (!confirm(`「${comment.userName}」の コメントを けしますか？`)) {
      return;
    }

    const previous = this.comments();
    this.comments.set(previous.filter((c) => c.id !== comment.id));
    try {
      await this.videoService.deleteComment(video.id, comment.id);
    } catch {
      this.comments.set(previous);
    }
  }

  protected onCommentInput(event: Event): void {
    this.newComment.set((event.target as HTMLInputElement).value);
  }

  protected async onAddComment(): Promise<void> {
    const content = this.newComment().trim();
    const video = this.video();
    const user = this.sessionService.selectedUser();
    const family = this.sessionService.family();
    if (!content || !video || !user || !family) {
      return;
    }

    this.newComment.set('');
    await this.videoService.addComment(video.id, {
      familyId: family.id,
      familyName: family.familyName,
      userId: user.id,
      userName: user.name,
      content,
    });
    this.comments.set(await this.videoService.listComments(video.id));
  }
}
