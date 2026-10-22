import supabase, { unwrap } from '../config/supabase';

export const calculateRouteAndLateness = async (
  currentBuildingId: string,
  nextClassBuildingId: string,
  nextClassStartAt: string
) => {
  const edge = await unwrap(
    supabase
      .from('CampusEdge')
      .select('*')
      .or(
        `and(fromBuildingId.eq.${currentBuildingId},toBuildingId.eq.${nextClassBuildingId}),and(fromBuildingId.eq.${nextClassBuildingId},toBuildingId.eq.${currentBuildingId})`
      )
      .limit(1)
      .maybeSingle()
  );

  const walkingMinutes = edge?.walkingMinutes ?? 10;

  const now = new Date();
  const classStart = new Date(nextClassStartAt);
  const minutesLeft = isNaN(classStart.getTime())
    ? 0
    : (classStart.getTime() - now.getTime()) / (1000 * 60);

  let latenessRisk = 0;
  if (minutesLeft <= 0) latenessRisk = 100;
  else if (minutesLeft < walkingMinutes) latenessRisk = 90;
  else if (minutesLeft < walkingMinutes + 5) latenessRisk = 50;
  else latenessRisk = 10;

  const facilities = await unwrap(
    supabase.from('Facility').select('*').eq('buildingId', currentBuildingId).limit(3)
  );

  return {
    walkingMinutes,
    minutesLeft: Math.round(minutesLeft),
    latenessRisk,
    latenessLevel:
      latenessRisk >= 90 ? 'DANGER' :
      latenessRisk >= 50 ? 'WARNING' : 'SAFE',
    recommendedFacilities: facilities || [],
    message:
      latenessRisk >= 90 ? '지금 바로 이동하세요!' :
      latenessRisk >= 50 ? '서두르는 것이 좋습니다.' : '여유 있게 이동 가능합니다.',
  };
};
