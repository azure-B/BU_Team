import test from 'node:test';
import assert from 'node:assert/strict';
import {
  campusEdgeTiming,
  getMapConfig,
  getWalkingRoute,
  resolveBuildingName,
} from './campus-map.service';
import { walkingRouteSchema } from '../validations/campus.validation';

test('walking campus-edge timing and fallbacks', async (t) => {
  const oldKey = process.env.KAKAO_REST_API_KEY;
  const oldJsKey = process.env.KAKAO_JAVASCRIPT_KEY;
  const input = {
    origin: { lat: 36.8386967, lng: 127.1843735, buildingId: 'bldg-wisdom', name: '지혜관' },
    destination: { lat: 36.8396459, lng: 127.1858915, buildingId: 'bldg-hq', name: '본부동' },
  };

  const osrmOk = {
    code: 'Ok',
    routes: [{
      distance: 350,
      duration: 120,
      geometry: { coordinates: [[127.1843735, 36.8386967], [127.1858915, 36.8396459]] },
    }],
  };

  try {
    delete process.env.KAKAO_REST_API_KEY;
    process.env.KAKAO_JAVASCRIPT_KEY = 'fixture-js-key';

    await t.test('resolveBuildingName uses id and matrix names', () => {
      assert.equal(resolveBuildingName({ lat: 0, lng: 0, buildingId: 'bldg-wisdom' }), '지혜관');
      assert.equal(resolveBuildingName({ lat: 0, lng: 0, name: '본부동' }), '본부동');
      assert.equal(resolveBuildingName({ lat: 0, lng: 0 }), null);
    });

    await t.test('campusEdgeTiming matches dashboard 지혜관→본부동 5분', () => {
      const edge = campusEdgeTiming('지혜관', '본부동');
      assert.equal(edge?.walkMinutes, 5);
      assert.equal(edge?.durationSeconds, 300);
      assert.equal(edge?.distanceMeters, 250);
    });

    await t.test('building pair overrides OSRM with campus edge', async () => {
      const data = await getWalkingRoute(input, async () => new Response(JSON.stringify(osrmOk), { status: 200 }));
      assert.equal(data.source, 'campus');
      assert.equal(data.walkMinutes, 5);
      assert.equal(data.durationSeconds, 300);
      assert.equal(data.distanceMeters, 250);
      assert.ok(data.path.length >= 2);
    });

    await t.test('unknown points scale OSRM by ~3x', async () => {
      const gps = {
        origin: { lat: 36.839, lng: 127.185 },
        destination: { lat: 36.84, lng: 127.186 },
      };
      const data = await getWalkingRoute(gps, async () => new Response(JSON.stringify(osrmOk), { status: 200 }));
      assert.equal(data.source, 'osrm');
      assert.equal(data.durationSeconds, 360);
      assert.equal(data.distanceMeters, 1050);
    });

    await t.test('config and validation', () => {
      const config = getMapConfig();
      assert.equal(config.walkingConfigured, true);
      assert.equal(walkingRouteSchema.safeParse(input).success, true);
      assert.equal(walkingRouteSchema.safeParse({
        origin: { lat: 1, lng: 1, buildingId: 'bldg-hq' },
        destination: { lat: 2, lng: 2, name: '지혜관' },
      }).success, true);
    });
  } finally {
    if (oldKey == null) delete process.env.KAKAO_REST_API_KEY; else process.env.KAKAO_REST_API_KEY = oldKey;
    if (oldJsKey == null) delete process.env.KAKAO_JAVASCRIPT_KEY; else process.env.KAKAO_JAVASCRIPT_KEY = oldJsKey;
  }
});
