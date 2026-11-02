import supabase, { unwrap } from '../config/supabase';
import { AppError } from '../utils/app-error';

/**
 * 북마크에 포함되는 연관 공지사항 정보 인터페이스 (존재가 확인된 최소 컬럼)
 */
export interface NoticeInfo {
  id: string;
  title: string;
}

/**
 * 공지 북마크 데이터 인터페이스
 */
export interface NoticeBookmark {
  id: string;
  userId: string;
  noticeId: string;
  createdAt: string;
  notice?: NoticeInfo | null;
}

/**
 * 북마크 목록 조회 결과 인터페이스
 */
export interface BookmarkListResult {
  total: number;
  bookmarks: NoticeBookmark[];
}

/**
 * 북마크 삭제 결과 인터페이스
 */
export interface BookmarkDeleteResult {
  success: boolean;
  message: string;
  deletedId: string;
}

/**
 * 공지 북마크 등록
 * @param userId - 인증된 사용자 ID
 * @param noticeId - 북마크할 공지사항 ID
 * @returns 생성된 북마크 정보
 */
export const addBookmark = async (userId: string, noticeId: string): Promise<NoticeBookmark> => {
  if (!userId?.trim() || !noticeId?.trim()) {
    throw new AppError('사용자 ID와 공지 ID는 필수 입력값입니다.', 400);
  }

  // 1. 공지사항 존재 여부 확인 (최소 컬럼 id, title 조회)
  const { data: notice, error: noticeErr } = await supabase
    .from('Notice')
    .select('id, title')
    .eq('id', noticeId)
    .maybeSingle();

  if (noticeErr) {
    console.error('Notice lookup error:', noticeErr.message);
    throw new AppError('공지사항 정보를 조회하는 중 오류가 발생했습니다.', 500);
  }
  if (!notice) {
    throw new AppError('존재하지 않는 공지사항입니다.', 404);
  }

  // 2. 이미 북마크했는지 사전 중복 검사
  const { data: existing, error: checkErr } = await supabase
    .from('NoticeBookmark')
    .select('id')
    .eq('userId', userId)
    .eq('noticeId', noticeId)
    .maybeSingle();

  if (checkErr) {
    console.error('Bookmark existence check error:', checkErr.message);
    throw new AppError('북마크 내역을 확인하는 중 오류가 발생했습니다.', 500);
  }
  if (existing) {
    throw new AppError('이미 북마크에 추가된 공지사항입니다.', 409);
  }

  // 3. 북마크 생성 (DB Unique 제약조건 충돌도 대비)
  const { data: bookmark, error: insertErr } = await supabase
    .from('NoticeBookmark')
    .insert({
      userId,
      noticeId,
    })
    .select('id, userId, noticeId, createdAt')
    .single();

  if (insertErr) {
    // PostgreSQL 유니크 제약조건 위반 코드 (23505)
    if ((insertErr as any).code === '23505') {
      throw new AppError('이미 북마크에 추가된 공지사항입니다.', 409);
    }
    console.error('Bookmark insert error:', insertErr.message);
    throw new AppError('북마크를 등록하는 중 데이터베이스 오류가 발생했습니다.', 500);
  }

  return bookmark as NoticeBookmark;
};

// 별칭 export (네이밍 호환성 지원)
export const createBookmark = addBookmark;

/**
 * 공지 북마크 삭제
 * @param userId - 인증된 사용자 ID (본인 소유 검증)
 * @param noticeId - 삭제할 공지사항 ID
 * @returns 삭제 결과
 */
export const removeBookmark = async (
  userId: string,
  noticeId: string
): Promise<BookmarkDeleteResult> => {
  if (!userId?.trim() || !noticeId?.trim()) {
    throw new AppError('사용자 ID와 공지 ID는 필수 입력값입니다.', 400);
  }

  // 사용자 ID와 공지 ID를 모두 조건으로 지정하여 타인 북마크 삭제 방지
  const { data: deleted, error: deleteErr } = await supabase
    .from('NoticeBookmark')
    .delete()
    .eq('userId', userId)
    .eq('noticeId', noticeId)
    .select('id')
    .maybeSingle();

  if (deleteErr) {
    console.error('Bookmark delete error:', deleteErr.message);
    throw new AppError('북마크를 삭제하는 중 데이터베이스 오류가 발생했습니다.', 500);
  }
  if (!deleted) {
    throw new AppError('북마크 내역을 찾을 수 없거나 삭제 권한이 없습니다.', 404);
  }

  return {
    success: true,
    message: '북마크가 성공적으로 삭제되었습니다.',
    deletedId: deleted.id,
  };
};

// 별칭 export (네이밍 호환성 지원)
export const deleteBookmark = removeBookmark;

/**
 * 사용자별 북마크 목록 조회
 * @param userId - 인증된 사용자 ID
 * @returns 사용자의 북마크 목록 및 전체 개수
 */
export const getBookmarks = async (userId: string): Promise<BookmarkListResult> => {
  if (!userId?.trim()) {
    throw new AppError('사용자 ID는 필수 입력값입니다.', 400);
  }

  // 1. 본인의 북마크만 최신순으로 조회 (존재 확인된 최소 컬럼 id, title 포함 시도)
  const initialQuery = await supabase
    .from('NoticeBookmark')
    .select('id, userId, noticeId, createdAt, notice:Notice(id, title)')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  let rawData: any[] | null = initialQuery.data as any[] | null;
  let queryError = initialQuery.error;

  // 2. PostgREST 외래키 관계 캐시 미반영(PGRST200, PGRST201 등) 시 단독 컬럼 조회로 안전하게 fallback
  const isRelationshipError =
    queryError &&
    (queryError.code === 'PGRST200' ||
      queryError.code === 'PGRST201' ||
      (typeof queryError.message === 'string' &&
        queryError.message.toLowerCase().includes('relationship')));

  if (isRelationshipError) {
    const fallback = await supabase
      .from('NoticeBookmark')
      .select('id, userId, noticeId, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    rawData = fallback.data as any[] | null;
    queryError = fallback.error;
  }

  if (queryError) {
    console.error('Bookmark list query error:', queryError.message);
    throw new AppError('북마크 목록을 조회하는 중 데이터베이스 오류가 발생했습니다.', 500);
  }

  const bookmarks: NoticeBookmark[] = (rawData ?? []).map((row: any) => {
    let noticeInfo: NoticeInfo | null = null;
    if (row.notice) {
      const rawNotice = Array.isArray(row.notice) ? row.notice[0] : row.notice;
      if (rawNotice && typeof rawNotice === 'object' && rawNotice.id && rawNotice.title) {
        noticeInfo = {
          id: String(rawNotice.id),
          title: String(rawNotice.title),
        };
      }
    }
    return {
      id: row.id,
      userId: row.userId,
      noticeId: row.noticeId,
      createdAt: row.createdAt,
      notice: noticeInfo,
    };
  });

  return {
    total: bookmarks.length,
    bookmarks,
  };
};

// 별칭 export (네이밍 호환성 지원)
export const getUserBookmarks = getBookmarks;
