// SYNTHETIC TEST FIXTURE ONLY. This is not any real building or a production asset.
import * as THREE from 'three';
import { modelToFacadeMatrix } from '../../src/ar/alignment.js';

export function fixtureManifest(withCharacter = false) {
  const normal = [0, 0, 0, 1]; // +Z building front.
  return {
    schemaVersion: 1, id: 'synthetic-test-only', name: '합성 테스트 전용 · 실존 건물 아님', revision: 'fixture-1', status: 'surveyed',
    coordinateSystem: { units: 'meters', up: '+Y', front: '+Z' },
    sources: [{ kind: 'survey', uri: 'test-fixture://not-a-survey', description: 'Automated synthetic tests only; no real-world verification.' }],
    model: { glbUrl: 'fixture.glb', occlusionGlbUrl: '' }, dimensionsMeters: [8, 6, 4],
    modelToFacade: { position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: 1 },
    anchors: [
      { id: 'window', kind: 'window', position: [-2, 3, 0], quaternion: normal, sizeMeters: [1.5, 1.5], node: 'Window' },
      { id: 'wall', kind: 'wall', position: [0, 3, 0], quaternion: normal, sizeMeters: [8, 6], node: 'Wall' },
      { id: 'door', kind: 'entrance', position: [0, 1, -0.25], quaternion: normal, node: 'Door' },
      { id: 'roof', kind: 'roof', position: [0, 6, 2], quaternion: [0, 0, 0, 1], node: 'Roof' },
      { id: 'back', kind: 'path', position: [0, 1, 5], quaternion: normal },
      { id: 'outline', kind: 'outline', position: [0, 0, -0.03], quaternion: [0, 0, 0, 1], points: [[-4, 0, 0], [-4, 6, 0], [4, 6, 0], [4, 0, 0], [-4, 0, 0]] },
    ],
    controlPoints: [
      { id: 'bottom-left', position: [-4, 0, 0] }, { id: 'bottom-right', position: [4, 0, 0] },
      { id: 'top-left', position: [-4, 6, 0] }, { id: 'top-right', position: [4, 6, 0] },
      { id: 'rear-roof', position: [4, 6, 4] },
    ],
    characters: withCharacter ? [{ id: 'dancer', glbUrl: 'dancer.glb', scale: 1, clip: 'Dance', route: ['door', 'window', 'back'] }] : [],
    audioUrl: 'test-soundtrack.mp3', timeline: null,
  };
}

export function fixtureAsset(url = 'fixture.glb') {
  const scene = new THREE.Group(); const animations = [];
  const material = new THREE.MeshStandardMaterial({ color: '#91a18a', roughness: 0.9 });
  if (url === 'dancer.glb') {
    const dancer = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), material);
    dancer.name = 'Dancer'; dancer.position.y = 0.5; scene.add(dancer);
    animations.push(new THREE.AnimationClip('Dance', 2, [new THREE.NumberKeyframeTrack('Dancer.rotation[y]', [0, 1, 2], [0, 0.3, 0])]));
  } else {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 4), material); wall.name = 'Wall'; wall.position.set(0, 3, 2); scene.add(wall);
    for (const [name, position] of [['Window', [-2, 3, 0]], ['Door', [0, 1, 0]], ['Roof', [0, 6, 2]]]) {
      const anchor = new THREE.Group(); anchor.name = name; anchor.position.fromArray(position); scene.add(anchor);
    }
  }
  return { scene, animations, byteLength: 1024 };
}

export function fakeAudio() {
  return { currentTime: 0, duration: 120, readyState: 4, paused: true, ended: false, error: null,
    playCalls: 0, pauseCalls: 0,
    async play() { this.playCalls++; this.paused = false; },
    pause() { this.pauseCalls++; this.paused = true; } };
}

export function fixtureCapture(manifest, sessionId = 'test-session', offset = [0, 0, 0]) {
  const viewpoints = [
    { id: 'front', cameraPosition: [0, 1.5, -10] },
    { id: 'left', cameraPosition: [-3, 1.5, -9] },
    { id: 'right', cameraPosition: [3, 1.5, -9] },
  ];
  const matrix = modelToFacadeMatrix(manifest);
  return { sessionId, modelRevision: manifest.revision, capturedAt: new Date().toISOString(),
    device: { platform: 'android', model: 'SYNTHETIC TEST', browser: 'Node synthetic fixture' }, viewpoints,
    samples: viewpoints.flatMap(view => manifest.controlPoints.map(point => ({ pointId: point.id, viewpointId: view.id,
      position: new THREE.Vector3(...point.position).applyMatrix4(matrix).add(new THREE.Vector3(...offset)).toArray() }))) };
}
