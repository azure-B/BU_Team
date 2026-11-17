/** MediaRecorder blob(webm 등) → 16kHz mono PCM WAV (최대 15초) */

const TARGET_RATE = 16000
const MAX_SECONDS = 12

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i))
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

function encodeWavMono16k(float32) {
  const buffer = new ArrayBuffer(44 + float32.length * 2)
  const view = new DataView(buffer)
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + float32.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, TARGET_RATE, true)
  view.setUint32(28, TARGET_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, float32.length * 2, true)
  floatTo16BitPCM(view, 44, float32)
  return buffer
}

function mixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer
  if (numberOfChannels === 1) return audioBuffer.getChannelData(0).slice(0)
  const mixed = new Float32Array(length)
  for (let c = 0; c < numberOfChannels; c += 1) {
    const ch = audioBuffer.getChannelData(c)
    for (let i = 0; i < length; i += 1) mixed[i] += ch[i] / numberOfChannels
  }
  return mixed
}

function resampleLinear(input, fromRate, toRate) {
  if (fromRate === toRate) return input
  const ratio = fromRate / toRate
  const outLen = Math.max(1, Math.round(input.length / ratio))
  const out = new Float32Array(outLen)
  for (let i = 0; i < outLen; i += 1) {
    const src = i * ratio
    const i0 = Math.floor(src)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const t = src - i0
    out[i] = input[i0] * (1 - t) + input[i1] * t
  }
  return out
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x2000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length)
    for (let j = i; j < end; j += 1) binary += String.fromCharCode(bytes[j])
  }
  return btoa(binary)
}

/**
 * @param {Blob} blob
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export async function blobToWavBase64(blob) {
  const ab = await blob.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const decoded = await ctx.decodeAudioData(ab.slice(0))
    let mono = mixToMono(decoded)
    let resampled = resampleLinear(mono, decoded.sampleRate, TARGET_RATE)
    const maxSamples = TARGET_RATE * MAX_SECONDS
    if (resampled.length > maxSamples) {
      resampled = resampled.slice(0, maxSamples)
    }
    const wav = encodeWavMono16k(resampled)
    return { base64: arrayBufferToBase64(wav), mimeType: 'audio/wav' }
  } finally {
    await ctx.close().catch(() => {})
  }
}
