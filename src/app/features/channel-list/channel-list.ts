import { Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { CHANNEL_ICONS } from '../../core/channel-icons';
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

  protected readonly channelIcons = CHANNEL_ICONS;
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly editName = signal('');
  protected readonly editIcon = signal('');

  /** 自分の家族のチャンネルを見ている「ほごしゃ」だけ編集できる。 */
  protected readonly canEdit = computed(
    () =>
      this.sessionService.role() === 'parent' &&
      this.channel()?.familyId === this.sessionService.family()?.id
  );

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

  protected onStartEdit(): void {
    const channel = this.channel();
    if (!channel) {
      return;
    }
    this.editName.set(channel.channelName);
    this.editIcon.set(channel.icon);
    this.isEditing.set(true);
  }

  protected onEditNameInput(event: Event): void {
    this.editName.set((event.target as HTMLInputElement).value);
  }

  protected onSelectEditIcon(icon: string): void {
    this.editIcon.set(icon);
  }

  protected onCancelEdit(): void {
    this.isEditing.set(false);
  }

  protected async onSaveEdit(): Promise<void> {
    const channel = this.channel();
    const name = this.editName().trim();
    if (!channel || !name || this.isSaving()) {
      return;
    }

    const changes: { channelName?: string; icon?: string } = {};
    if (name !== channel.channelName) {
      changes.channelName = name;
    }
    if (this.editIcon() !== channel.icon) {
      changes.icon = this.editIcon();
    }
    if (Object.keys(changes).length === 0) {
      this.isEditing.set(false);
      return;
    }

    this.isSaving.set(true);
    try {
      await this.channelService.updateChannel(channel.id, changes);
      if (changes.channelName) {
        const newName = changes.channelName;
        await this.videoService.setChannelNameForVideos(channel.videoIds, newName);
        this.videos.update((videos) =>
          videos.map((video) => ({ ...video, channelName: newName }))
        );
      }
      this.channel.set({ ...channel, ...changes });
      this.isEditing.set(false);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async onDeleteChannel(): Promise<void> {
    const channel = this.channel();
    if (!channel || this.isSaving()) {
      return;
    }
    if (!confirm(`チャンネル「${channel.channelName}」を けしますか？`)) {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.channelService.deleteChannel(channel.id);
      await this.router.navigateByUrl('/');
    } finally {
      this.isSaving.set(false);
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
