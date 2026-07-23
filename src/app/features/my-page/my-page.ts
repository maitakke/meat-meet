import { Component, inject, signal } from '@angular/core';

import { extractYoutubeId } from '../../core/youtube.util';
import { Channel, Family, Video } from '../../core/models';
import { ChannelService } from '../../core/services/channel.service';
import { FamilyService } from '../../core/services/family.service';
import { SessionService } from '../../core/services/session.service';
import { VideoService } from '../../core/services/video.service';

@Component({
  selector: 'app-my-page',
  imports: [],
  templateUrl: './my-page.html',
  styleUrl: './my-page.css',
})
export class MyPage {
  private readonly videoService = inject(VideoService);
  private readonly channelService = inject(ChannelService);
  private readonly familyService = inject(FamilyService);
  private readonly sessionService = inject(SessionService);

  protected readonly myVideos = signal<Video[]>([]);
  protected readonly otherFamilies = signal<Family[]>([]);
  protected readonly myChannels = signal<Channel[]>([]);
  protected readonly addingToChannelVideoId = signal<string | null>(null);
  protected readonly isLoading = signal(true);

  protected readonly youtubeInput = signal('');
  protected readonly title = signal('');
  protected readonly isPrivate = signal(false);
  protected readonly allowedFamilyIds = signal<Set<string>>(new Set());
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);

  constructor() {
    void this.load();
  }

  protected thumbnailUrl(video: Video): string {
    return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  }

  protected onYoutubeInput(event: Event): void {
    this.youtubeInput.set((event.target as HTMLInputElement).value);
  }

  protected onTitleInput(event: Event): void {
    this.title.set((event.target as HTMLInputElement).value);
  }

  protected onSetPrivate(isPrivate: boolean): void {
    this.isPrivate.set(isPrivate);
  }

  protected isAllowedFamily(familyId: string): boolean {
    return this.allowedFamilyIds().has(familyId);
  }

  protected onToggleAllowedFamily(familyId: string): void {
    this.allowedFamilyIds.update((ids) => {
      const next = new Set(ids);
      next.has(familyId) ? next.delete(familyId) : next.add(familyId);
      return next;
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    const youtubeId = extractYoutubeId(this.youtubeInput());
    const title = this.title().trim();
    const family = this.sessionService.family();
    const user = this.sessionService.selectedUser();

    if (!youtubeId) {
      this.errorMessage.set(
        'YouTubeの URLか どうがIDを ただしく にゅうりょくしてね。'
      );
      return;
    }
    if (!title || !family || !user) {
      this.errorMessage.set('タイトルを にゅうりょくしてね。');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    try {
      await this.videoService.createVideo({
        youtubeId,
        title,
        familyId: family.id,
        familyName: family.familyName,
        registeredBy: user.id,
        isPrivate: this.isPrivate(),
        allowedFamilyIds: this.isPrivate() ? [...this.allowedFamilyIds()] : [],
      });
      this.youtubeInput.set('');
      this.title.set('');
      this.isPrivate.set(false);
      this.allowedFamilyIds.set(new Set());
      this.myVideos.set(await this.videoService.listVideosByFamily(family.id));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected async onDelete(video: Video): Promise<void> {
    await this.videoService.deleteVideo(video.id);
    this.myVideos.update((videos) => videos.filter((v) => v.id !== video.id));
  }

  protected onStartAddToChannel(video: Video): void {
    this.addingToChannelVideoId.set(video.id);
  }

  protected onCancelAddToChannel(): void {
    this.addingToChannelVideoId.set(null);
  }

  protected async onAddToChannel(video: Video, channel: Channel): Promise<void> {
    await this.channelService.addVideoToChannel(channel.id, video.id);
    this.addingToChannelVideoId.set(null);
  }

  private async load(): Promise<void> {
    const familyId = this.sessionService.family()?.id;
    this.isLoading.set(true);

    const [myVideos, allFamilies, myChannels] = await Promise.all([
      familyId ? this.videoService.listVideosByFamily(familyId) : Promise.resolve([]),
      this.familyService.listAllFamilies(),
      familyId ? this.channelService.listChannelsByFamily(familyId) : Promise.resolve([]),
    ]);
    this.myVideos.set(myVideos);
    this.otherFamilies.set(allFamilies.filter((f) => f.id !== familyId));
    this.myChannels.set(myChannels);
    this.isLoading.set(false);
  }
}
