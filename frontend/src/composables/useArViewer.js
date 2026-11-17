// 입체(3D) 과거 건물 뷰어 — Blender GLB 를 실공간에 세운다.
// 안드로이드: WebXR immersive-ar + hit-test 로 바닥에 배치해 걸어서 돌아본다.
// 비AR 기기/데스크톱: OrbitControls 턴테이블로 돌려보기(폴백).
// iOS 는 화면 쪽에서 USDZ Quick Look 으로 분기하므로 여기서는 다루지 않는다.
// GLB 로드·예산 측정·정리는 src/ar/assets.js 의 기존 함수를 재사용한다.
import { reactive } from 'vue'
import {
  AmbientLight, Box3, DirectionalLight, DoubleSide, Euler, Group, Mesh, MeshBasicMaterial,
  PerspectiveCamera, PlaneGeometry, Quaternion, RingGeometry, Scene, SRGBColorSpace, Vector3,
  VideoTexture, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { loadBuildingGlb, measureResources, disposeResources } from '../ar/assets.js'

export function useArViewer() {
  const state = reactive({
    status: '', webxrSupported: false, presenting: false, placed: false,
    loaded: false, warnings: [], error: '', gyroActive: false,
  })

  let renderer, scene, camera, controls, container, observer, raf = 0
  let modelRoot, modelScene, reticle
  let billboard = null, videoEl = null, videoTexture = null
  let session = null, hitTestSource = null
  let baseScale = 1, yaw = 0
  const gesture = { points: new Map(), startScale: 1, startYaw: 0, startDist: 0, startX: 0, moved: false }
  let overlayEl = null

  // 자이로(기기 방향) 매직윈도우용
  const gyro = { on: false, alpha: 0, beta: 0, gamma: 0, orient: 0, offset: null, height: 1, dist: 4 }
  const previewCam = { pos: new Vector3(2, 1.2, 4), target: new Vector3(0, 0.8, 0) }
  const zee = new Vector3(0, 0, 1)
  const q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) // -90° about X: 기기 평면 → 카메라 정면
  const qAxis = new Quaternion()
  const euler = new Euler()

  async function init(el) {
    container = el
    scene = new Scene()
    camera = new PerspectiveCamera(60, 1, 0.01, 200)
    camera.position.set(0, 1.4, 4)

    // preserveDrawingBuffer: 사진 캡처 때 캔버스를 읽을 수 있게 유지
    renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    renderer.xr.enabled = true
    container.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'

    scene.add(new AmbientLight('#ffffff', 2.2))
    const key = new DirectionalLight('#ffeac4', 2.6)
    key.position.set(6, 12, 8)
    scene.add(key)

    modelRoot = new Group()
    scene.add(modelRoot)

    reticle = new Mesh(
      new RingGeometry(0.11, 0.14, 32).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: '#ffb547' }),
    )
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2
    controls.target.set(0, 0.8, 0)

    observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    renderer.setAnimationLoop(render)

    try {
      state.webxrSupported = isSecureContext && !!(await navigator.xr?.isSessionSupported('immersive-ar'))
    } catch { state.webxrSupported = false }
  }

  function resize() {
    if (!container || !renderer) return
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function render(_time, frame) {
    const presenting = renderer.xr.isPresenting
    state.presenting = presenting
    if (presenting && frame && hitTestSource && !state.placed) {
      const refSpace = renderer.xr.getReferenceSpace()
      const results = frame.getHitTestResults(hitTestSource)
      if (results.length) {
        const pose = results[0].getPose(refSpace)
        if (pose) { reticle.visible = true; reticle.matrix.fromArray(pose.transform.matrix) }
      } else reticle.visible = false
    }
    if (presenting) { /* XR 이 카메라 포즈를 제어 */ }
    else if (gyro.on) applyGyro()
    else controls.update()
    renderer.render(scene, camera)
  }

  // 기기 방향(alpha/beta/gamma) → 카메라 회전. 위치는 고정이라 모델이 공간에 박힌 느낌.
  function applyGyro() {
    const a = gyro.alpha - (gyro.offset ?? 0)
    euler.set(gyro.beta, a, -gyro.gamma, 'YXZ')
    camera.quaternion.setFromEuler(euler)
    camera.quaternion.multiply(q1)
    camera.quaternion.multiply(qAxis.setFromAxisAngle(zee, -gyro.orient))
  }

  // url: 정적 GLB 주소(/ar/..)나 http(s), 또는 로컬 blob: object URL.
  async function loadModel(url, { baseUrl, scaleMeters = 1, yawDeg = 0, videoUrl = '' } = {}) {
    state.status = '모델을 불러오는 중'
    state.error = ''
    state.loaded = false
    try {
      let gltf
      if (/^blob:/.test(url)) {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
        gltf = await new GLTFLoader().loadAsync(url)
      } else {
        gltf = await loadBuildingGlb(url, { baseUrl })
      }
      if (modelScene) { modelRoot.remove(modelScene); disposeResources([modelScene]) }
      removeBillboard()
      modelScene = gltf.scene

      // 바닥(reticle) 위에 서도록 중심을 원점으로, 바닥면을 y=0 으로 옮긴다.
      const box = new Box3().setFromObject(modelScene)
      const center = box.getCenter(new Vector3())
      const size = box.getSize(new Vector3())
      modelScene.position.x -= center.x
      modelScene.position.z -= center.z
      modelScene.position.y -= box.min.y
      modelRoot.add(modelScene)

      // 제미나이 영상: 모델 뒤 평면 빌보드에 VideoTexture 로 분위기 배경을 깐다.
      if (videoUrl) addBillboard(size, videoUrl)

      baseScale = scaleMeters
      yaw = (yawDeg * Math.PI) / 180
      modelRoot.scale.setScalar(baseScale)
      modelRoot.rotation.y = yaw

      const warn = measureResources([modelScene])
      state.warnings = warn.errors

      // 폴백(인라인) 프레이밍: 모델 전체가 보이도록 카메라·타깃 조정.
      const radius = size.length() * baseScale || 2
      controls.target.set(0, (size.y * baseScale) / 2, 0)
      camera.position.set(radius * 0.5, size.y * baseScale * 0.6, radius * 1.05)
      camera.far = Math.max(200, radius * 10)
      camera.updateProjectionMatrix()
      controls.update()
      // 자이로/복원용 값 저장
      previewCam.pos.copy(camera.position)
      previewCam.target.copy(controls.target)
      gyro.height = controls.target.y
      gyro.dist = camera.position.distanceTo(controls.target)

      state.loaded = true
      state.status = ''
    } catch (err) {
      state.error = err?.message || 'GLB 를 불러오지 못했습니다.'
      state.status = ''
      throw err
    }
  }

  function addBillboard(size, videoUrl) {
    videoEl = document.createElement('video')
    Object.assign(videoEl, { src: videoUrl, loop: true, muted: true, autoplay: true, playsInline: true, crossOrigin: 'anonymous' })
    videoEl.setAttribute('playsinline', '')
    videoEl.play().catch(() => {})
    videoTexture = new VideoTexture(videoEl)
    videoTexture.colorSpace = SRGBColorSpace
    const w = Math.max(size.x, size.z) * 1.6 || 2
    const h = size.y || 2
    billboard = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({ map: videoTexture, side: DoubleSide, toneMapped: false }),
    )
    billboard.position.set(0, h / 2, -(size.z / 2) - Math.max(0.05, size.z * 0.05))
    modelRoot.add(billboard)
  }

  function removeBillboard() {
    if (billboard) { modelRoot.remove(billboard); billboard.geometry.dispose(); billboard.material.dispose() }
    videoTexture?.dispose()
    if (videoEl) { videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load() }
    billboard = null; videoTexture = null; videoEl = null
  }

  async function enterAR(overlayRoot) {
    if (!state.webxrSupported) throw new Error('이 기기는 WebXR AR 을 지원하지 않습니다.')
    if (gyro.on) disableGyro()
    overlayEl = overlayRoot || null
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: overlayEl ? ['dom-overlay'] : [],
      ...(overlayEl ? { domOverlay: { root: overlayEl } } : {}),
    })
    renderer.xr.setReferenceSpaceType('local')
    await renderer.xr.setSession(session)

    const viewerSpace = await session.requestReferenceSpace('viewer')
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

    state.placed = false
    modelRoot.visible = false
    controls.enabled = false
    scene.background = null
    videoEl?.play().catch(() => {})

    session.addEventListener('select', onSelect)
    session.addEventListener('end', onSessionEnd)
    const target = overlayEl || renderer.domElement
    target.addEventListener('pointerdown', onPointerDown)
    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointercancel', onPointerUp)
  }

  // 레티클 위치에 건물을 세운다(탭할 때마다 재배치).
  function onSelect() {
    if (!reticle.visible) return
    modelRoot.position.setFromMatrixPosition(reticle.matrix)
    modelRoot.visible = true
    state.placed = true
  }

  function onSessionEnd() {
    const target = overlayEl || renderer?.domElement
    target?.removeEventListener('pointerdown', onPointerDown)
    target?.removeEventListener('pointermove', onPointerMove)
    target?.removeEventListener('pointerup', onPointerUp)
    target?.removeEventListener('pointercancel', onPointerUp)
    hitTestSource?.cancel?.()
    hitTestSource = null
    session?.removeEventListener('select', onSelect)
    session?.removeEventListener('end', onSessionEnd)
    session = null
    reticle.visible = false
    controls.enabled = true
    state.presenting = false
    state.placed = false
    scene.background = null
  }

  function exitAR() {
    session?.end().catch(() => {})
  }

  // 인라인 프리뷰 위에 실시간 카메라를 깔 때 자동 회전을 꺼 모델이 공간에 놓인 느낌을 준다.
  function setAutoRotate(on) { if (controls) controls.autoRotate = on }

  // ── 자이로(기기 방향) 매직윈도우 ────────────────────────────────
  const d2r = d => (d * Math.PI) / 180
  function onDeviceOrient(e) {
    if (e.alpha == null) return
    gyro.alpha = d2r(e.alpha); gyro.beta = d2r(e.beta || 0); gyro.gamma = d2r(e.gamma || 0)
    if (gyro.offset == null) gyro.offset = gyro.alpha // 시작 시점을 모델 정면으로 맞춤
  }
  function onScreenOrient() {
    gyro.orient = d2r(screen.orientation?.angle ?? window.orientation ?? 0)
  }

  async function enableGyro() {
    // iOS 13+ 는 사용자 제스처에서 권한 요청 필요
    const DOE = globalThis.DeviceOrientationEvent
    if (DOE && typeof DOE.requestPermission === 'function') {
      const res = await DOE.requestPermission()
      if (res !== 'granted') throw new Error('기기 방향(자이로) 권한이 필요해요.')
    } else if (!globalThis.DeviceOrientationEvent) {
      throw new Error('이 기기는 자이로(기기 방향)를 지원하지 않아요.')
    }
    gyro.offset = null
    onScreenOrient()
    window.addEventListener('deviceorientation', onDeviceOrient)
    screen.orientation?.addEventListener?.('change', onScreenOrient)
    controls.enabled = false
    camera.position.set(0, gyro.height, gyro.dist)
    gyro.on = true
    state.gyroActive = true
  }

  function disableGyro() {
    window.removeEventListener('deviceorientation', onDeviceOrient)
    screen.orientation?.removeEventListener?.('change', onScreenOrient)
    gyro.on = false
    state.gyroActive = false
    if (controls) {
      controls.enabled = true
      camera.position.copy(previewCam.pos)
      controls.target.copy(previewCam.target)
      camera.up.set(0, 1, 0)
      controls.update()
    }
  }

  // 배치 후 제스처: 한 손가락 = 좌우 회전(yaw), 두 손가락 = 크기.
  function onPointerDown(e) {
    gesture.points.set(e.pointerId, [e.clientX, e.clientY])
    gesture.moved = false
    if (gesture.points.size === 1) { gesture.startYaw = yaw; gesture.startX = e.clientX }
    else if (gesture.points.size === 2) {
      const [a, b] = [...gesture.points.values()]
      gesture.startDist = Math.hypot(a[0] - b[0], a[1] - b[1])
      gesture.startScale = baseScale
    }
  }
  function onPointerMove(e) {
    if (!gesture.points.has(e.pointerId) || !state.placed) return
    gesture.points.set(e.pointerId, [e.clientX, e.clientY])
    const pts = [...gesture.points.values()]
    if (pts.length >= 2) {
      const d = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1])
      if (gesture.startDist > 0) {
        baseScale = Math.min(50, Math.max(0.05, gesture.startScale * (d / gesture.startDist)))
        modelRoot.scale.setScalar(baseScale)
      }
      gesture.moved = true
    } else {
      const dx = e.clientX - gesture.startX
      if (Math.abs(dx) > 3) gesture.moved = true
      yaw = gesture.startYaw + dx * 0.01
      modelRoot.rotation.y = yaw
    }
  }
  function onPointerUp(e) {
    gesture.points.delete(e.pointerId)
    if (gesture.points.size < 2) gesture.startDist = 0
  }

  function dispose() {
    if (raf) cancelAnimationFrame(raf)
    renderer?.setAnimationLoop(null)
    disableGyro()
    exitAR()
    observer?.disconnect()
    controls?.dispose()
    removeBillboard()
    if (modelScene) disposeResources([modelScene])
    reticle?.geometry.dispose(); reticle?.material.dispose()
    renderer?.dispose()
    renderer?.domElement.remove()
  }

  return { state, init, loadModel, enterAR, exitAR, setAutoRotate, enableGyro, disableGyro, getCanvas: () => renderer?.domElement, dispose }
}
