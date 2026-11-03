import { Router } from 'express';
import { getNotices } from '../controllers/notice.controller';
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
} from '../controllers/notice-bookmark.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { noticeBookmarkParamSchema } from '../validations/notice-bookmark.validation';

const router = Router();

// 기존 공지사항 목록 조회 (전체 공개)
router.get('/', getNotices as any);

// 공지 북마크 목록 조회 (정적 경로를 동적 :id 경로보다 먼저 선언하여 충돌 방지)
router.get('/bookmarks', authenticate as any, getBookmarks as any);

// 공지 북마크 등록 및 삭제
router.post(
  '/:id/bookmark',
  authenticate as any,
  validate({ params: noticeBookmarkParamSchema }) as any,
  addBookmark as any
);
router.delete(
  '/:id/bookmark',
  authenticate as any,
  validate({ params: noticeBookmarkParamSchema }) as any,
  removeBookmark as any
);

export default router;
