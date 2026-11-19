import { reactive } from 'vue'
import { resolveSceneStyle } from '../ar/diorama.js'

// 현재 코스: 우송대 → 대동천 → 대동벽화마을 → 대동하늘공원 → 대전역
export const COURSE_STOPS = [
  ['woosong', '우송대'],
  ['daedongcheon', '대동천'],
  ['daedong-maeul', '대동벽화마을'],
  ['daedong-sky', '대동하늘공원'],
  ['daejeon-station', '대전역'],
]
export const LOCATION_IDS = COURSE_STOPS.map(([id]) => id)
export const LOCATION_NAMES = {
  ...Object.fromEntries(COURSE_STOPS),
  // 구 장소명도 이름 조회는 가능하게 유지
  sojedom: '소제동', jungang: '중앙시장', heredi: '한의약거리', indong: '인동시장',
}

// 관리자가 등록한 장소별 '입체(3D) 과거 건물' 자료.
// Blender 로 만든 건물 GLB 를 본체로 공간에 세우고(WebXR·USDZ Quick Look),
// 제미나이 플로우 영상은 표면 질감/분위기 빌보드로 보조한다.
// 운영은 정적 파일 참조(glbUrl)가 기본. 관리자 로컬 테스트 업로드는 GLB 가 커서
// localStorage(≈5MB) 대신 IndexedDB 에 Blob 으로 담고, 메타데이터만 localStorage 에 둔다.
// 실제 서비스에서는 백엔드 업로드로 대체. 현재는 데모.

const META_KEY = 'donggu-tq-ar-models-v1'
const SEED_KEY = 'donggu-tq-ar-models-seed-v2'
const DB_NAME = 'donggu-tq-ar'
const STORE = 'glb'
// 코스 정류장용 기본 입체 건물 GLB (scripts/gen-ar-buildings.mjs 로 생성한 저폴리 모델)
const courseGlb = id => `${import.meta.env.BASE_URL}ar/course/${id}/building.glb`

function load() {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // { [locationId]: { glbUrl, usdzUrl, videoUrl, poster, scaleMeters, yawDeg, sceneStyle, blobKey, updated } }
  return {}
}

export const arModels = reactive(load())

function persist() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(arModels))
  } catch {
    throw new Error('3D 자료 정보를 저장하지 못했습니다.')
  }
}

// 코스 5개 정류장에 기본 입체 건물을 1회 시드. 아직 없거나 과거 플레이스홀더면 코스 GLB 로 채운다.
// (관리 콘솔·스튜디오에서 실제 Blender 모델 URL 로 자유롭게 교체 가능)
function seedCourse() {
  try { if (localStorage.getItem(SEED_KEY)) return } catch { return }
  for (const [id] of COURSE_STOPS) {
    const cur = arModels[id]
    if (!cur || cur.placeholder || !cur.glbUrl) arModels[id] = {
      glbUrl: courseGlb(id), usdzUrl: '', videoUrl: '', poster: '',
      scaleMeters: 1, yawDeg: 0, updated: Date.now(),
    }
  }
  try { localStorage.setItem(META_KEY, JSON.stringify(arModels)); localStorage.setItem(SEED_KEY, '1') } catch {}
}
seedCourse()

export function getModel(locationId) {
  return Object.hasOwn(arModels, locationId) ? arModels[locationId] : null
}

export function hasModel(locationId) {
  const m = arModels[locationId]
  return !!(m && (m.glbUrl || m.blobKey))
}

export function getModelSceneStyle(locationId, model) {
  return resolveSceneStyle(model?.sceneStyle, !model?.blobKey && LOCATION_IDS.includes(locationId) && model?.glbUrl === courseGlb(locationId))
}

export function saveModel(locationId, data) {
  const previous = getModel(locationId)
  const updated = { scaleMeters: 1, yawDeg: 0, ...previous, ...data, updated: Date.now() }
  if (updated.sceneStyle !== undefined) updated.sceneStyle = resolveSceneStyle(updated.sceneStyle)
  arModels[locationId] = updated
  try { persist() } catch (error) {
    if (previous) arModels[locationId] = previous
    else delete arModels[locationId]
    throw error
  }
}

export async function clearModel(locationId) {
  const m = arModels[locationId]
  if (m?.blobKey) await deleteBlob(m.blobKey).catch(() => {})
  delete arModels[locationId]
  persist()
}

// ── IndexedDB: 로컬 업로드 GLB(Blob) 보관 ────────────────────────────────
function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('이 브라우저는 IndexedDB 를 지원하지 않습니다.')); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

export async function putBlob(key, blob) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const r = tx(db, 'readwrite').put(blob, key)
    r.onsuccess = resolve; r.onerror = () => reject(r.error)
  })
  db.close()
}

export async function getBlob(key) {
  const db = await openDb()
  const blob = await new Promise((resolve, reject) => {
    const r = tx(db, 'readonly').get(key)
    r.onsuccess = () => resolve(r.result || null); r.onerror = () => reject(r.error)
  })
  db.close()
  return blob
}

export async function deleteBlob(key) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const r = tx(db, 'readwrite').delete(key)
    r.onsuccess = resolve; r.onerror = () => reject(r.error)
  })
  db.close()
}

// 뷰어가 바로 쓸 수 있는 GLB 주소로 변환: 로컬 Blob 이면 object URL, 아니면 정적 URL.
// object URL 을 만든 경우 호출자가 끝나고 URL.revokeObjectURL 로 정리할 수 있게 revoke 를 함께 돌려준다.
export async function resolveGlbUrl(model) {
  if (!model) return null
  if (model.blobKey) {
    const blob = await getBlob(model.blobKey)
    if (blob) {
      const url = URL.createObjectURL(blob)
      return { url, revoke: () => URL.revokeObjectURL(url) }
    }
  }
  if (model.glbUrl) return { url: model.glbUrl, revoke: () => {} }
  return null
}
