import test from 'node:test';
import assert from 'node:assert/strict';
import { getMapConfig, getWalkingRoute } from './campus-map.service';
import { walkingRouteSchema } from '../validations/campus.validation';

test('walking integration contract and fallbacks', async (t) => {
  const oldKey = process.env.KAKAO_REST_API_KEY;
  const oldJsKey = process.env.KAKAO_JAVASCRIPT_KEY;
  const input = { origin: { lat: 36.839, lng: 127.185 }, destination: { lat: 36.84, lng: 127.186 } };

  const kakaoOk = {
    routes: [{
      result_code: 0,
      summary: { distance: 185, duration: 180 },
      sections: [{ roads: [{ vertexes: [127.185, 36.839, 127.186, 36.84] }, { vertexes: [127.186, 36.84, 127.187, 36.841] }] }],
    }],
  };
  const osrmOk = {
    code: 'Ok',
    routes: [{
      distance: 220.4,
      duration: 160.2,
      geometry: { coordinates: [[127.185, 36.839], [127.1855, 36.8395], [127.186, 36.84]] },
    }],
  };

  try {
    delete process.env.KAKAO_REST_API_KEY;
    process.env.KAKAO_JAVASCRIPT_KEY = 'fixture-js-key';

    await t.test('config exposes JS key and always marks walking available', () => {
      const config = getMapConfig();
      assert.equal(config.javascriptKey, 'fixture-js-key');
      assert.equal(config.walkingConfigured, true);
      assert.equal(config.kakaoWalkingConfigured, false);
      assert.ok(!JSON.stringify(config).includes('fixture-rest-key'));
    });

    await t.test('without kakao key uses OSRM then succeeds', async () => {
      const data = await getWalkingRoute(input, async (url) => {
        assert.match(String(url), /project-osrm\.org/);
        return new Response(JSON.stringify(osrmOk), { status: 200 });
      });
      assert.equal(data.source, 'osrm');
      assert.equal(data.distanceMeters, 220);
      assert.equal(data.durationSeconds, 160);
      assert.equal(data.path.length, 3);
    });

    await t.test('osrm failure falls back to haversine', async () => {
      const data = await getWalkingRoute(input, async () => new Response('{}', { status: 500 }));
      assert.equal(data.source, 'haversine');
      assert.equal(data.path.length, 2);
      assert.ok(data.distanceMeters > 0);
      assert.ok(data.durationSeconds > 0);
    });

    process.env.KAKAO_REST_API_KEY = 'fixture-rest-key';

    await t.test('kakao success still preferred', async () => {
      const data = await getWalkingRoute(input, async (url, options) => {
        assert.match(String(url), /kakaomobility/);
        assert.equal(new URL(String(url)).searchParams.get('summary'), 'false');
        assert.equal(new URL(String(url)).searchParams.get('origin'), '127.185,36.839');
        assert.equal(new Headers(options?.headers).get('Authorization'), 'KakaoAK fixture-rest-key');
        return new Response(JSON.stringify(kakaoOk), { status: 200 });
      });
      assert.equal(data.source, 'kakao');
      assert.equal(data.path.length, 3);
      assert.equal(data.distanceMeters, 185);
      assert.equal(data.durationSeconds, 180);
    });

    await t.test('kakao 403 falls back to OSRM', async () => {
      const data = await getWalkingRoute(input, async (url) => {
        if (String(url).includes('kakaomobility')) return new Response('{}', { status: 403 });
        return new Response(JSON.stringify(osrmOk), { status: 200 });
      });
      assert.equal(data.source, 'osrm');
    });

    await t.test('kakao network error falls back to OSRM', async () => {
      let stage = 0;
      const data = await getWalkingRoute(input, async (url) => {
        if (String(url).includes('kakaomobility')) throw new Error('offline');
        stage += 1;
        return new Response(JSON.stringify(osrmOk), { status: 200 });
      });
      assert.equal(data.source, 'osrm');
      assert.equal(stage, 1);
    });

    await t.test('validates coordinates and different endpoints', () => {
      assert.equal(walkingRouteSchema.safeParse(input).success, true);
      assert.equal(walkingRouteSchema.safeParse({ ...input, origin: { lat: 127, lng: 36 } }).success, false);
      assert.equal(walkingRouteSchema.safeParse({ origin: input.origin, destination: input.origin }).success, false);
    });
  } finally {
    if (oldKey == null) delete process.env.KAKAO_REST_API_KEY; else process.env.KAKAO_REST_API_KEY = oldKey;
    if (oldJsKey == null) delete process.env.KAKAO_JAVASCRIPT_KEY; else process.env.KAKAO_JAVASCRIPT_KEY = oldJsKey;
  }
});
