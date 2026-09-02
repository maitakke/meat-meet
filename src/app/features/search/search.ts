import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Channel, Video } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
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
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly allChannels = signal<Channel[]>([]);
  protected readonly allVideos = signal<Video[]>([]);
  protected readonly subscribedChannelIds = signal<Set<string>>(new Set());
  protected readonly isLoading = signal(true);

  protected readonly normalizedQuery = computed(() => this.query().trim().toLowerCase());

  protected readonly filteredChannels = computed(() => {
    const q = this.normalizedQuery();
    if (!q) {
      return this.allChannels();
    }
    return this.allChannels().filter((channel) =>
      channel.channelName.toLowerCase().includes(q)
    );
  });

  protected readonly filteredVideos = computed(() => {
    const q = this.normalizedQuery();
    if (!q) {
      return [];
    }
    return this.allVideos().filter(
      (video) =>
        video.title.toLowerCase().includes(q) ||
        video.registeredByName.toLowerCase().includes(q)
    );
  });

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

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
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

  private async load(): Promise<void> {
    const user = this.sessionService.selectedUser();
    const familyId = this.sessionService.family()?.id;
    this.isLoading.set(true);

    const [channels, videos, subscribedChannelIds] = await Promise.all([
      this.channelService.listChannels(),
      familyId ? this.videoService.listVisibleVideos(familyId) : Promise.resolve([]),
      user && familyId
        ? this.channelService.listSubscribedChannelIds(user.id, familyId)
        : Promise.resolve([]),
    ]);

    this.allChannels.set(channels);
    this.allVideos.set(videos);
    this.subscribedChannelIds.set(new Set(subscribedChannelIds));
    this.isLoading.set(false);
  }
}
