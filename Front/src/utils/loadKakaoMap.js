let pending
export function loadKakaoMap(key) {
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps)
  if (pending) return pending
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => fail(), 15000)
    function fail() {
      clearTimeout(timeout)
      script.onload = null
      script.onerror = null
      script.dataset.failed = 'true'
      reject(new Error('카카오 지도를 불러오지 못했습니다. JavaScript 키와 등록 도메인을 확인해 주세요.'))
    }
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.onerror = fail
    script.onload = () => {
      if (!window.kakao?.maps?.load) { fail(); return }
      window.kakao.maps.load(() => {
        if (!window.kakao.maps.Map) { fail(); return }
        clearTimeout(timeout)
        resolve(window.kakao.maps)
      })
    }
    document.head.appendChild(script)
  }).catch((error) => { pending = null; throw error })
  return pending
}
