import { z } from 'zod';

/**
 * 공지 북마크 등록·삭제 API의 경로 파라미터(:id) 유효성 검증 스키마
 * - id 필수 입력 여부 확인
 * - 공백 문자열 및 빈 문자열 거부 (.trim().min(1))
 * - UUID 전용 검증을 강제하지 않아 크롤링 공지(dept-*) 및 일반 공지 ID와 완벽 호환
 */
export const noticeBookmarkParamSchema = z.object({
  id: z.string().trim().min(1, '공지사항 ID는 필수 입력값입니다.'),
});

/**
 * 향후 Controller 및 Route에서 쉽게 재사용할 수 있도록 제공하는 별칭 스키마
 */
export const noticeIdParamSchema = noticeBookmarkParamSchema;

/**
 * 파라미터 타입 추론용 TypeScript 타입
 */
export type NoticeBookmarkParam = z.infer<typeof noticeBookmarkParamSchema>;

