export async function detectArCapabilities(environment = globalThis) {
  const result = { webxr: false, quickLook: false, secure: environment.isSecureContext === true }
  try {
    result.webxr = result.secure && !!await environment.navigator?.xr?.isSessionSupported('immersive-ar')
  } catch { /* Feature detection can be denied by browser policy. */ }
  try {
    result.quickLook = !!environment.document?.createElement('a').relList?.supports?.('ar')
  } catch { /* Older browsers throw for unsupported rel tokens. */ }
  return result
}

export function quickLookUrl(assetUrl) {
  const url = new URL(assetUrl)
  const options = new URLSearchParams(url.hash.slice(1))
  options.set('allowsContentScaling', '0')
  url.hash = options.toString()
  return url.href
}
