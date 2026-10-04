import prisma from '../utils/prisma';

// ─── 조장님 동선 계산 모듈 (Mock) ────────────────────────────
// 실제로는 조장님의 외부 API/모듈을 호출하게 됩니다.
// Input : 현재 위치(buildingId), 다음 수업 건물(buildingId), 다음 수업 시작 시각
// Output: 지각 위험도(%), 추천 이동 경로, 예상 소요 시간

export const calculateRouteAndLateness = async (
  currentBuildingId: string,
  nextClassBuildingId: string,
  nextClassStartAt: string
) => {
  // 1. 두 건물 사이의 캠퍼스 엣지(경로) 조회
  const edge = await prisma.campusEdge.findFirst({
    where: {
      OR: [
        { fromBuildingId: currentBuildingId, toBuildingId: nextClassBuildingId },
        { fromBuildingId: nextClassBuildingId, toBuildingId: currentBuildingId },
      ],
    },
  });

  const walkingMinutes = edge?.walkingMinutes ?? 10; // 경로 없으면 기본 10분 가정

  // 2. 지각 위험도 계산 (조장님 모듈 Mock)
  const now = new Date();
  const classStart = new Date(nextClassStartAt);
  const minutesLeft = (classStart.getTime() - now.getTime()) / (1000 * 60);

  let latenessRisk = 0;
  if (minutesLeft <= 0) latenessRisk = 100;           // 이미 지각
  else if (minutesLeft < walkingMinutes) latenessRisk = 90;  // 시간 부족
  else if (minutesLeft < walkingMinutes + 5) latenessRisk = 50; // 아슬아슬
  else latenessRisk = 10;                              // 여유 있음

  // 3. 현재 건물 근처 추천 시설 조회
  const recommendedFacilities = await prisma.facility.findMany({
    where: { buildingId: currentBuildingId },
    take: 3,
  });

  return {
    walkingMinutes,
    minutesLeft: Math.round(minutesLeft),
    latenessRisk,
    latenessLevel:
      latenessRisk >= 90 ? 'DANGER' :
      latenessRisk >= 50 ? 'WARNING' : 'SAFE',
    recommendedFacilities,
    message:
      latenessRisk >= 90 ? '지금 바로 이동하세요!' :
      latenessRisk >= 50 ? '서두르는 것이 좋습니다.' : '여유 있게 이동 가능합니다.',
  };
};
