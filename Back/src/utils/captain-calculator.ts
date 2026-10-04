// 조장님 계산 모듈 (Mock)
// 실제로는 조장님이 만드신 외부 API나 모듈을 호출하게 됩니다.
export const calculatePriorityScore = (task: any) => {
  // Priority = 0.45 * Urgency + 0.30 * Importance + 0.15 * Effort + 0.10 * Context (PDF 기준 예시)
  const daysLeft = (new Date(task.dueAt).getTime() - Date.now()) / (1000 * 3600 * 24);
  const urgency = daysLeft <= 0 ? 100 : Math.max(100 - (daysLeft * 10), 0); // 10일 남으면 0점, 0일이면 100점
  const importanceScore = task.importance * 20; // 1~5 -> 20~100

  // 가상의 모듈 로직
  const priorityScore = (0.45 * urgency) + (0.30 * importanceScore) + (0.15 * 50) + (0.10 * 50);
  return priorityScore;
};
