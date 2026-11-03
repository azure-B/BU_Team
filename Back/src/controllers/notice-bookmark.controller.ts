import { Request, Response, NextFunction } from 'express';
import * as noticeBookmarkService from '../services/notice-bookmark.service';
import { AppError } from '../utils/app-error';

/**
 * JWT 검증 미들웨어를 통해 주입된 req.user에서 사용자 ID를 방어적으로 추출
 * - 인증 정보가 누락되었거나 id가 유효한 문자열이 아닌 경우 401 AppError 발생
 * - 실제 1차 인증 강제는 Route에 연결될 authenticate 미들웨어가 수행함
 */
const getUserId = (req: Request): string => {
  const userId = (req as any).user?.id;
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new AppError('인증 정보가 유효하지 않습니다.', 401);
  }
  return userId.trim();
};

/**
 * 1. 북마크 목록 조회 핸들러
 * - 인증된 사용자의 북마크 목록 및 총 개수 조회
 * - HTTP Method: GET
 * - Response Status: 200 OK
 */
export const getBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const data = await noticeBookmarkService.getBookmarks(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. 북마크 등록 핸들러
 * - 경로 파라미터(:id)의 공지사항을 인증된 사용자의 북마크로 추가
 * - HTTP Method: POST
 * - Response Status: 201 Created
 */
export const addBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const noticeId = req.params.id as string;
    const data = await noticeBookmarkService.addBookmark(userId, noticeId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. 북마크 삭제 핸들러
 * - 경로 파라미터(:id)의 공지사항 북마크를 해제(삭제)
 * - HTTP Method: DELETE
 * - Response Status: 200 OK
 */
export const removeBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const noticeId = req.params.id as string;
    const data = await noticeBookmarkService.removeBookmark(userId, noticeId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 네이밍 호환성을 위한 별칭 export
export const createBookmark = addBookmark;
export const deleteBookmark = removeBookmark;

