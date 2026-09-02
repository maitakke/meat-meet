import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Channel, Video } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
import { SessionService } from '../../core/services/session.service';
import { VideoService } from '../../core/services/video.service';

@Component({
  selector: 'app-video-list',
  imports: [],
  templateUrl: './video-list.html',
  styleUrl: './video-list.css',
})
export class VideoList {
  private readonly videoService = inject(VideoService);
  private readonly channelService = inject(ChannelService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly videos = signal<Video[]>([]);
  protected readonly myChannels = signal<Channel[]>([]);
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

  private async load(): Promise<void> {
    const familyId = this.sessionService.family()?.id;
    if (!familyId) {
      this.isLoading.set(false);
      return;
    }
    this.isLoading.set(true);
    const [videos, myChannels] = await Promise.all([
      this.videoService.listVisibleVideos(familyId),
      this.channelService.listChannelsByFamily(familyId),
    ]);
    this.videos.set(videos);
    this.myChannels.set(myChannels);
    this.isLoading.set(false);
  }
}
