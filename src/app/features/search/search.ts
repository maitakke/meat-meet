import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Channel, Video } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
import { LikeService } from '../../core/services/like.service';
import { SessionService } from '../../core/services/session.service';
import { VideoService } from '../../core/services/video.service';

@Component({
  selector: 'app-search',
  imports: [],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  private readonly videoService = inject(VideoService);
  private readonly channelService = inject(ChannelService);
  private readonly likeService = inject(LikeService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly likedVideos = signal<Video[]>([]);
  protected readonly channels = signal<Channel[]>([]);
  protected readonly subscribedChannelIds = signal<Set<string>>(new Set());
  protected readonly newChannelName = signal('');
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

  protected isSubscribed(channel: Channel): boolean {
    return this.subscribedChannelIds().has(channel.id);
  }

  protected async onToggleSubscribe(channel: Channel): Promise<void> {
    const user = this.sessionService.selectedUser();
    const familyId = this.sessionService.family()?.id;
    if (!user || !familyId) {
      return;
    }

    const subscribed = this.isSubscribed(channel);
    this.subscribedChannelIds.update((ids) => {
      const next = new Set(ids);
      subscribed ? next.delete(channel.id) : next.add(channel.id);
      return next;
    });
    if (subscribed) {
      await this.channelService.unsubscribe(channel.id, user.id);
    } else {
      await this.channelService.subscribe(channel.id, user.id, familyId);
    }
  }

  protected onNewChannelNameInput(event: Event): void {
    this.newChannelName.set((event.target as HTMLInputElement).value);
  }

  protected async onCreateChannel(): Promise<void> {
    const channelName = this.newChannelName().trim();
    const user = this.sessionService.selectedUser();
    const family = this.sessionService.family();
    if (!channelName || !user || !family) {
      return;
    }

    this.newChannelName.set('');
    await this.channelService.createChannel({
      familyId: family.id,
      familyName: family.familyName,
      channelName,
      createdBy: user.id,
    });
    this.channels.set(await this.channelService.listChannels());
  }

  private async load(): Promise<void> {
    const user = this.sessionService.selectedUser();
    this.isLoading.set(true);

    const [likedVideoIds, channels] = await Promise.all([
      user ? this.likeService.listLikedVideoIds(user.id) : Promise.resolve([]),
      this.channelService.listChannels(),
    ]);
    const [likedVideos, subscribedChannelIds] = await Promise.all([
      this.videoService.listVideosByIds(likedVideoIds),
      user
        ? this.channelService.listSubscribedChannelIds(user.id)
        : Promise.resolve([]),
    ]);

    this.likedVideos.set(likedVideos);
    this.channels.set(channels);
    this.subscribedChannelIds.set(new Set(subscribedChannelIds));
    this.isLoading.set(false);
  }
}
