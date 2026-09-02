import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { Channel, Video } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
import { SessionService } from '../../core/services/session.service';
import { VideoService } from '../../core/services/video.service';

@Component({
  selector: 'app-channel-list',
  imports: [],
  templateUrl: './channel-list.html',
  styleUrl: './channel-list.css',
})
export class ChannelList {
  private readonly channelService = inject(ChannelService);
  private readonly videoService = inject(VideoService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  protected readonly channel = signal<Channel | null>(null);
  protected readonly videos = signal<Video[]>([]);
  protected readonly isSubscribed = signal(false);
  protected readonly isLoading = signal(true);

  constructor() {
    const channelId = this.route.snapshot.paramMap.get('id');
    if (channelId) {
      void this.load(channelId);
    } else {
      this.isLoading.set(false);
    }
  }

  protected thumbnailUrl(video: Video): string {
    return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  }

  protected onOpenVideo(video: Video): void {
    this.router.navigate(['/watch', video.id]);
  }

  protected onBack(): void {
    this.location.back();
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

  private async load(channelId: string): Promise<void> {
    this.isLoading.set(true);
    const channel = await this.channelService.getChannel(channelId);
    this.channel.set(channel);

    const user = this.sessionService.selectedUser();
    const [videos, subscribed] = await Promise.all([
      channel ? this.videoService.listVideosByIds(channel.videoIds) : Promise.resolve([]),
      channel && user
        ? this.channelService.isSubscribed(channel.id, user.id)
        : Promise.resolve(false),
    ]);
    this.videos.set(videos);
    this.isSubscribed.set(subscribed);
    this.isLoading.set(false);
  }
}
