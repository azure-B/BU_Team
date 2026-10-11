// 조장님 우선순위 계산 모듈 (Captain Calculator)
// 과제 마감일(D-Day)과 중요도(1~5)를 종합하여 우선순위 점수를 산출합니다.
// TODO: 조장님 외부 AI/연산 모듈이 확정되면 엔드포인트 또는 모듈 교체 예정
export const calculatePriorityScore = (task: { dueAt: string | Date; importance: number }): number => {
  const now = new Date().getTime();
  const due = new Date(task.dueAt).getTime();
  const diffHours = (due - now) / (1000 * 60 * 60);

  // 긴급도 점수: 24시간 이내 마감이면 50점, 3일 이내면 30점, 7일 이내면 10점, 이미 지난 경우 60점
  let urgencyScore = 0;
  if (diffHours < 0) {
    urgencyScore = 60; // 마감 지남 (최우선 처리 필요)
  } else if (diffHours <= 24) {
    urgencyScore = 50; // 24시간 이내 (D-1)
  } else if (diffHours <= 72) {
    urgencyScore = 35; // 3일 이내
  } else if (diffHours <= 168) {
    urgencyScore = 20; // 7일 이내
  } else {
    urgencyScore = 10;
  }

  // 중요도 점수: 1~5점을 10점 단위로 변환 (최대 50점)
  const importanceScore = Math.min(5, Math.max(1, task.importance || 1)) * 10;

  return urgencyScore + importanceScore;
};
