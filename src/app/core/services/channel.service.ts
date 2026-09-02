import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { FIRESTORE } from '../firebase.providers';
import { Channel, ChannelSubscription } from '../models';

export interface CreateChannelInput {
  familyId: string;
  familyName: string;
  channelName: string;
  createdBy: string;
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly firestore = inject(FIRESTORE);

  async listChannels(): Promise<Channel[]> {
    const q = query(
      collection(this.firestore, 'channels'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Channel);
  }

  async listChannelsByFamily(familyId: string): Promise<Channel[]> {
    const q = query(
      collection(this.firestore, 'channels'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Channel);
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    const snapshot = await getDoc(doc(this.firestore, 'channels', channelId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Channel) : null;
  }

  async listChannelsByIds(channelIds: string[]): Promise<Channel[]> {
    const channels = await Promise.all(
      channelIds.map((channelId) => this.getChannel(channelId).catch(() => null))
    );
    return channels.filter((channel): channel is Channel => channel !== null);
  }

  async createChannel(input: CreateChannelInput): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'channels'), {
      ...input,
      videoIds: [],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async addVideoToChannel(channelId: string, videoId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'channels', channelId), {
      videoIds: arrayUnion(videoId),
    });
  }

  /** この動画が含まれているチャンネルを1件だけ返す(なければnull)。 */
  async findChannelForVideo(videoId: string): Promise<Channel | null> {
    const q = query(
      collection(this.firestore, 'channels'),
      where('videoIds', 'array-contains', videoId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    const [first] = snapshot.docs;
    return first ? ({ id: first.id, ...first.data() } as Channel) : null;
  }

  private subscriptionId(channelId: string, userId: string): string {
    return `${channelId}_${userId}`;
  }

  async isSubscribed(channelId: string, userId: string): Promise<boolean> {
    const snapshot = await getDoc(
      doc(
        this.firestore,
        'channel_subscriptions',
        this.subscriptionId(channelId, userId)
      )
    );
    return snapshot.exists();
  }

  async subscribe(
    channelId: string,
    userId: string,
    familyId: string
  ): Promise<void> {
    await setDoc(
      doc(
        this.firestore,
        'channel_subscriptions',
        this.subscriptionId(channelId, userId)
      ),
      { channelId, userId, familyId, createdAt: serverTimestamp() }
    );
  }

  async unsubscribe(channelId: string, userId: string): Promise<void> {
    await deleteDoc(
      doc(
        this.firestore,
        'channel_subscriptions',
        this.subscriptionId(channelId, userId)
      )
    );
  }

  async listSubscribedChannelIds(
    userId: string,
    familyId: string
  ): Promise<string[]> {
    const q = query(
      collection(this.firestore, 'channel_subscriptions'),
      where('familyId', '==', familyId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => (d.data() as ChannelSubscription).channelId
    );
  }

  private async deleteSubscriptionsForChannel(channelId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'channel_subscriptions'),
      where('channelId', '==', channelId)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }

  /** チャンネルを削除する。フォロー(登録)記録も合わせて削除する。 */
  async deleteChannel(channelId: string): Promise<void> {
    await this.deleteSubscriptionsForChannel(channelId);
    await deleteDoc(doc(this.firestore, 'channels', channelId));
  }

  /** この家族(のユーザー)がどのチャンネルにつけたフォローも全件削除する(退会時のカスケード用)。 */
  async deleteAllSubscriptionsByFamily(familyId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'channel_subscriptions'),
      where('familyId', '==', familyId)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }
}
