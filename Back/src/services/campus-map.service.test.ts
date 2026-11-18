import test from 'node:test';
import assert from 'node:assert/strict';
import { getMapConfig, getWalkingRoute } from './campus-map.service';
import { walkingRouteSchema } from '../validations/campus.validation';

test('walking integration contract and failures', async (t) => {
  const oldKey = process.env.KAKAO_REST_API_KEY;
  const oldJsKey = process.env.KAKAO_JAVASCRIPT_KEY;
  const input = { origin: { lat: 36.839, lng: 127.185 }, destination: { lat: 36.84, lng: 127.186 } };
  const fakeFetch = (body: unknown, status = 200): typeof fetch => async () => new Response(JSON.stringify(body), { status });
  try {
    delete process.env.KAKAO_REST_API_KEY;
    await t.test('missing key makes no provider request', async () => {
      let called = false;
      await assert.rejects(getWalkingRoute(input, async () => { called = true; return new Response(); }), { statusCode: 503 });
      assert.equal(called, false);
    });
    process.env.KAKAO_REST_API_KEY = 'fixture-rest-key';
    process.env.KAKAO_JAVASCRIPT_KEY = 'fixture-js-key';
    await t.test('config exposes only JavaScript key', () => {
      const config = getMapConfig();
      assert.equal(config.javascriptKey, 'fixture-js-key');
      assert.equal(config.walkingConfigured, true);
      assert.ok(!JSON.stringify(config).includes('fixture-rest-key'));
    });
    await t.test('requests full route in lng,lat order; converts and deduplicates geometry', async () => {
      const data = await getWalkingRoute(input, async (url, options) => {
        const query = new URL(String(url)).searchParams;
        assert.equal(query.get('summary'), 'false');
        assert.equal(query.get('origin'), '127.185,36.839');
        assert.equal(query.get('destination'), '127.186,36.84');
        assert.equal(new Headers(options?.headers).get('Authorization'), 'KakaoAK fixture-rest-key');
        return new Response(JSON.stringify({ routes: [{ result_code: 0, summary: { distance: 185, duration: 180 }, sections: [{ roads: [{ vertexes: [127.185, 36.839, 127.186, 36.84] }, { vertexes: [127.186, 36.84, 127.187, 36.841] }] }] }] }));
      });
      assert.equal(data.path.length, 3);
      assert.deepEqual(data.path[0], input.origin);
      assert.equal(data.distanceMeters, 185);
      assert.equal(data.durationSeconds, 180);
    });
    for (const [status, expected] of [[403, 503], [429, 429], [500, 502]]) {
      await t.test(`provider HTTP ${status}`, async () => assert.rejects(getWalkingRoute(input, fakeFetch({}, status)), { statusCode: expected }));
    }
    await t.test('network failure', async () => assert.rejects(getWalkingRoute(input, async () => { throw new Error('offline'); }), { statusCode: 504 }));
    await t.test('no route is not a fabricated line', async () => assert.rejects(getWalkingRoute(input, fakeFetch({ routes: [{ result_code: 104 }] })), { statusCode: 422 }));
    await t.test('rejects incomplete geometry', async () => assert.rejects(getWalkingRoute(input, fakeFetch({ routes: [{ result_code: 0, summary: { distance: 10, duration: 30 }, sections: [{ roads: [{ vertexes: [127] }] }] }] })), { statusCode: 502 }));
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
