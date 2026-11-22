import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Execute the page's real event handlers with state and browser/API boundaries supplied.
const source = readFileSync(new URL('./CampusMapPreviewPage.jsx', import.meta.url), 'utf8')
function handler(start, end, bindings) {
  const body = source.slice(source.indexOf(start), source.indexOf(end))
  const name = start.match(/function (\w+)/)[1]
  return new Function(...Object.keys(bindings), `${body}; return ${name}`)(...Object.values(bindings))
}
function scenario(origin, failGps = false) {
  const state = { from: origin, to: { id: 'custom', lat: 36.84, lng: 127.186 }, route: { distanceMeters: 123 }, gpsCalls: 0 }
  const epoch = { current: 0 }
  const noop = () => {}
  const bindings = {
    from: state.from, to: state.to, epoch, routeRequest: { current: null },
    CURRENT: { id: 'current' },
    readPosition: async () => { state.gpsCalls++; if (failGps) throw new Error('GPS denied'); return { id: 'current', lat: 36.838, lng: 127.184 } },
    setFrom: p => { state.from = p }, setMapFocus: p => { state.focus = p },
    setMessage: m => { state.message = m }, setPicking: noop, setDraft: noop, setLoading: noop,
    invalidate: () => { epoch.current++; state.route = null },
    validPoint: p => Number.isFinite(p?.lat) && Number.isFinite(p?.lng),
    routePoint: handler('function routePoint(', 'const ROUTE_SOURCE_LABEL', {}),
    getWalkingRoute: async (origin, destination) => { state.request = { origin, destination }; return { durationSeconds: 60, distanceMeters: 100 } },
    setRoute: r => { state.route = r },
  }
  return { state, center: handler('  async function moveMapToCurrentLocation(', '  function selectLocation(', bindings),
    route: () => handler('  async function showRoute(', '  function reset(', { ...bindings, from: state.from })({ preventDefault: noop }) }
}

for (const origin of [{ id: 'custom', lat: 36.839, lng: 127.185 }, { id: 'bldg-wisdom', name: '지혜관', lat: 36.8387, lng: 127.1844 }]) {
  test(`${origin.id}: map recenter preserves endpoints and existing route, next route uses selected endpoints`, async () => {
    const { state, center, route } = scenario(origin)
    const previousRoute = state.route
    await center()
    assert.strictEqual(state.from, origin)
    assert.strictEqual(state.route, previousRoute)
    assert.deepEqual(state.focus, { id: 'current', lat: 36.838, lng: 127.184 })
    await route()
    assert.equal(state.gpsCalls, 1)
    assert.equal(state.request.origin.lat, origin.lat)
    assert.equal(state.request.origin.lng, origin.lng)
    assert.deepEqual(state.request.destination, { lat: state.to.lat, lng: state.to.lng })
  })
}
test('GPS failure leaves selected origin and route intact', async () => {
  const origin = { id: 'custom', lat: 36.839, lng: 127.185 }
  const { state, center } = scenario(origin, true)
  const previousRoute = state.route
  await center()
  assert.strictEqual(state.from, origin)
  assert.strictEqual(state.route, previousRoute)
  assert.equal(state.message, 'GPS denied')
})
test('current-location origin still resolves GPS for route calculation', async () => {
  const { state, route } = scenario({ id: 'current' })
  await route()
  assert.equal(state.gpsCalls, 1)
  assert.deepEqual(state.request.origin, { lat: 36.838, lng: 127.184 })
})
