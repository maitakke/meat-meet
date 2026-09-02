import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Channel, Video } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
import { LikeService } from '../../core/services/like.service';
import { SessionService } from '../../core/services/session.service';
import { VideoService } from '../../core/services/video.service';

@Component({
  selector: 'app-library',
  imports: [],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library {
  private readonly videoService = inject(VideoService);
  private readonly channelService = inject(ChannelService);
  private readonly likeService = inject(LikeService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly subscribedChannels = signal<Channel[]>([]);
  protected readonly likedVideos = signal<Video[]>([]);
  protected readonly isLoading = signal(true);

  constructor() {
    void this.load();
  }

  protected thumbnailUrl(video: Video): string {
    return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  }

  protected onOpenVideo(video: Video): void {
    this.router.navigate(['/watch', video.id]);
  }

  protected onOpenChannel(channel: Channel): void {
    this.router.navigate(['/channel', channel.id]);
  }

  protected async onUnsubscribe(channel: Channel): Promise<void> {
    const user = this.sessionService.selectedUser();
    if (!user) {
      return;
    }
    this.subscribedChannels.update((channels) =>
      channels.filter((c) => c.id !== channel.id)
    );
    await this.channelService.unsubscribe(channel.id, user.id);
  }

  private async load(): Promise<void> {
    const user = this.sessionService.selectedUser();
    const familyId = this.sessionService.family()?.id;
    this.isLoading.set(true);

    const [subscribedChannelIds, likedVideoIds] = await Promise.all([
      user && familyId
        ? this.channelService.listSubscribedChannelIds(user.id, familyId)
        : Promise.resolve([]),
      user ? this.likeService.listLikedVideoIds(user.id) : Promise.resolve([]),
    ]);
    const [subscribedChannels, likedVideos] = await Promise.all([
      this.channelService.listChannelsByIds(subscribedChannelIds),
      this.videoService.listVideosByIds(likedVideoIds),
    ]);

    this.subscribedChannels.set(subscribedChannels);
    this.likedVideos.set(likedVideos);
    this.isLoading.set(false);
  }
}
