import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { FIRESTORE } from '../firebase.providers';
import { Like } from '../models';

@Injectable({ providedIn: 'root' })
export class LikeService {
  private readonly firestore = inject(FIRESTORE);

  private likeId(videoId: string, userId: string): string {
    return `${videoId}_${userId}`;
  }

  async isLiked(videoId: string, userId: string): Promise<boolean> {
    const snapshot = await getDoc(
      doc(this.firestore, 'likes', this.likeId(videoId, userId))
    );
    return snapshot.exists();
  }

  async countLikes(videoId: string): Promise<number> {
    const q = query(
      collection(this.firestore, 'likes'),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  async like(videoId: string, userId: string, familyId: string): Promise<void> {
    await setDoc(doc(this.firestore, 'likes', this.likeId(videoId, userId)), {
      videoId,
      userId,
      familyId,
      createdAt: serverTimestamp(),
    });
  }

  async unlike(videoId: string, userId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'likes', this.likeId(videoId, userId)));
  }

  async listLikedVideoIds(userId: string): Promise<string[]> {
    const q = query(
      collection(this.firestore, 'likes'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => (d.data() as Like).videoId);
  }

  /** 指定した動画についた「いいね」を全件削除する(動画削除時のカスケード用)。 */
  async deleteLikesForVideo(videoId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'likes'),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }

  /** この家族(のユーザー)がどの動画につけた「いいね」も全件削除する(退会時のカスケード用)。 */
  async deleteAllLikesByFamily(familyId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'likes'),
      where('familyId', '==', familyId)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }
}
