import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

  async listSubscribedChannelIds(userId: string): Promise<string[]> {
    const q = query(
      collection(this.firestore, 'channel_subscriptions'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => (d.data() as ChannelSubscription).channelId
    );
  }
}
