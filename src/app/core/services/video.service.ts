import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  or,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { FIRESTORE } from '../firebase.providers';
import { Video, VideoComment } from '../models';
import { LikeService } from './like.service';

export interface CreateVideoInput {
  youtubeId: string;
  title: string;
  familyId: string;
  familyName: string;
  registeredBy: string;
  registeredByName: string;
  channelId: string;
  channelName: string;
  isPrivate: boolean;
  allowedFamilyIds: string[];
}

export interface CreateVideoCommentInput {
  familyId: string;
  familyName: string;
  userId: string;
  userName: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly firestore = inject(FIRESTORE);
  private readonly likeService = inject(LikeService);

  /**
   * 「オープン公開」「自分の家族宛の限定公開」「自分の家族が投稿した動画」の
   * いずれかに該当する動画を、Firestoreの or() 複合フィルタで1クエリで取得する。
   */
  async listVisibleVideos(familyId: string): Promise<Video[]> {
    const videosRef = collection(this.firestore, 'videos');
    const q = query(
      videosRef,
      or(
        where('isPrivate', '==', false),
        where('allowedFamilyIds', 'array-contains', familyId),
        where('familyId', '==', familyId)
      ),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Video);
  }

  async getVideo(videoId: string): Promise<Video | null> {
    const snapshot = await getDoc(doc(this.firestore, 'videos', videoId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Video) : null;
  }

  async listVideosByIds(videoIds: string[]): Promise<Video[]> {
    const videos = await Promise.all(
      videoIds.map((videoId) => this.getVideo(videoId).catch(() => null))
    );
    return videos.filter((video): video is Video => video !== null);
  }

  async listVideosByFamily(familyId: string): Promise<Video[]> {
    const videosRef = collection(this.firestore, 'videos');
    const q = query(
      videosRef,
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Video);
  }

  async createVideo(input: CreateVideoInput): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'videos'), {
      ...input,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** 動画を削除する。動画自身に加えて、ついていたコメント・いいねも合わせて削除する。 */
  async deleteVideo(videoId: string): Promise<void> {
    await this.deleteCommentsForVideo(videoId);
    await this.likeService.deleteLikesForVideo(videoId);
    await deleteDoc(doc(this.firestore, 'videos', videoId));
  }

  async listComments(videoId: string): Promise<VideoComment[]> {
    const commentsRef = collection(this.firestore, 'videos', videoId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as VideoComment);
  }

  /** コメントを1件削除する(保護者によるモデレーション用)。 */
  async deleteComment(videoId: string, commentId: string): Promise<void> {
    await deleteDoc(
      doc(this.firestore, 'videos', videoId, 'comments', commentId)
    );
  }

  private async deleteCommentsForVideo(videoId: string): Promise<void> {
    const commentsRef = collection(this.firestore, 'videos', videoId, 'comments');
    const snapshot = await getDocs(commentsRef);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }

  /** この家族がどの動画につけたコメントも全件削除する(退会時のカスケード用)。 */
  async deleteAllCommentsByFamily(familyId: string): Promise<void> {
    const q = query(
      collectionGroup(this.firestore, 'comments'),
      where('familyId', '==', familyId)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }

  async addComment(
    videoId: string,
    input: CreateVideoCommentInput
  ): Promise<string> {
    const ref = await addDoc(
      collection(this.firestore, 'videos', videoId, 'comments'),
      { ...input, createdAt: serverTimestamp() }
    );
    return ref.id;
  }
}
