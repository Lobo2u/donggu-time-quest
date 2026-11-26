export const HISTORY_SPOTS = Object.freeze({
  'soje-railway-16': Object.freeze({
    title: '소제동 철도 관사 16호 · 파일럿',
    recordedAddress: '대전 동구 수향길 19',
    recordUrl: 'https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj01&boardSeq=3197&menuSeq=5945&pageIndex=1',
    compareHint: '같은 건물이나 골목을 고르고, 지붕선과 창문 모서리를 기준으로 현재 구도를 맞춰 보세요.',
    // Register only reviewed assets, with the fields checked in verifiedAsset().
    archive: null,
    restoration: null,
  }),
})

export function verifiedAsset(spot, kind) {
  if (!['archive', 'restoration'].includes(kind)) return null
  const asset = spot?.[kind]
  if (!asset || asset.reviewed !== true) return null
  const required = ['src', 'credit', 'sourceUrl', 'rightsUrl', 'capturedAt', 'viewpoint']
  if (!required.every(key => typeof asset[key] === 'string' && asset[key].trim())) return null
  // Images are first-party packaged files. The other URLs are citations only.
  if (!/^history\/[a-z0-9][a-z0-9/_-]*\.(avif|jpe?g|png|webp)$/i.test(asset.src)) return null
  if (!/^https:\/\//i.test(asset.sourceUrl) || !/^https:\/\//i.test(asset.rightsUrl)) return null
  return { ...asset, src: (import.meta.env?.BASE_URL || '/') + asset.src }
}
