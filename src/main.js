/**
 * RWD Viewer — pure vanilla JS
 * Shows multiple iframes side-by-side at different breakpoint widths
 * with synchronised scrolling between same-origin frames.
 */

// ─── Breakpoint presets ───────────────────────────────────────────────────────

const BREAKPOINTS = [
  { name: 'Mobile S',  width: 320,  height: 568  },
  { name: 'Mobile M',  width: 375,  height: 667  },
  { name: 'Mobile L',  width: 425,  height: 736  },
  { name: 'Tablet',    width: 768,  height: 1024 },
  { name: 'Laptop',    width: 1024, height: 768  },
  { name: 'Laptop L',  width: 1440, height: 900  },
  { name: '4K',        width: 2560, height: 1440 },
  { name: 'Custom',    width: null, height: null  },
]

// ─── State ────────────────────────────────────────────────────────────────────

let currentUrl      = ''
let viewports       = []
let viewportIdSeq   = 0
let isSyncing       = false
let syncTimer       = null

// ─── DOM references ───────────────────────────────────────────────────────────

const urlInput          = document.getElementById('url-input')
const loadBtn           = document.getElementById('load-btn')
const addViewportBtn    = document.getElementById('add-viewport-btn')
const viewportsContainer = document.getElementById('viewports-container')
const syncStatusEl      = document.getElementById('sync-status')

// ─── Event wiring ─────────────────────────────────────────────────────────────

loadBtn.addEventListener('click', loadUrl)
addViewportBtn.addEventListener('click', () => addViewport())

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadUrl()
})

// ─── Bootstrap ────────────────────────────────────────────────────────────────

addViewport('Mobile M')
addViewport('Tablet')
addViewport('Laptop')

// ─── Core functions ───────────────────────────────────────────────────────────

function loadUrl () {
  let url = urlInput.value.trim()
  if (!url) return

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
    urlInput.value = url
  }

  currentUrl = url
  viewports.forEach((vp) => {
    if (vp.iframe) vp.iframe.src = currentUrl
  })
}

function addViewport (presetName = 'Mobile M') {
  const id     = ++viewportIdSeq
  const preset = BREAKPOINTS.find((b) => b.name === presetName) || BREAKPOINTS[1]

  const vp = {
    id,
    name:        preset.name,
    width:       preset.width  ?? 375,
    height:      preset.height ?? 667,
    isCustom:    preset.name === 'Custom',
    iframe:      null,
    el:          null,
    syncEnabled: false,
  }

  viewports.push(vp)
  renderViewport(vp)
  updateSyncStatus()
}

function removeViewport (id) {
  viewports = viewports.filter((vp) => vp.id !== id)
  const el = document.getElementById(`vp-${id}`)
  if (el) el.remove()
  updateSyncStatus()
}

// ─── Viewport rendering ───────────────────────────────────────────────────────

function buildBreakpointOptions (selectedName) {
  return BREAKPOINTS.map((b) => {
    const label = b.width ? `${b.name} (${b.width}px)` : b.name
    return `<option value="${b.name}"${b.name === selectedName ? ' selected' : ''}>${label}</option>`
  }).join('')
}

function renderViewport (vp) {
  const el = document.createElement('div')
  el.className = 'viewport-wrapper'
  el.id = `vp-${vp.id}`

  el.innerHTML = `
    <div class="viewport-toolbar">
      <select class="viewport-select" aria-label="Breakpoint">
        ${buildBreakpointOptions(vp.name)}
      </select>
      <div class="custom-inputs" id="vp-custom-${vp.id}" style="display:${vp.isCustom ? 'flex' : 'none'}">
        <input type="number" class="custom-w" value="${vp.width}" min="200" max="3840" aria-label="Width (px)" placeholder="W" />
        <span class="custom-x">×</span>
        <input type="number" class="custom-h" value="${vp.height}" min="300" max="2160" aria-label="Height (px)" placeholder="H" />
      </div>
      <span class="size-label" id="vp-size-${vp.id}">${vp.width}&thinsp;×&thinsp;${vp.height}</span>
      <div class="sync-badge" id="vp-sync-${vp.id}" title="Scroll sync unavailable (cross-origin)" style="display:none">⚡</div>
      <button class="close-btn" aria-label="Remove viewport">✕</button>
    </div>
    <div class="frame-wrap" id="vp-wrap-${vp.id}" style="width:${vp.width}px">
      <iframe
        id="vp-iframe-${vp.id}"
        class="viewport-frame"
        style="width:${vp.width}px"
        title="${vp.name} viewport"
        loading="lazy"
        src="${currentUrl || 'about:blank'}"
      ></iframe>
    </div>
  `

  vp.el     = el
  vp.iframe = el.querySelector('.viewport-frame')

  viewportsContainer.appendChild(el)

  // ── Toolbar interactions ──────────────────────────────────────────────────
  const select   = el.querySelector('.viewport-select')
  const customBox = el.querySelector(`#vp-custom-${vp.id}`)
  const customW  = el.querySelector('.custom-w')
  const customH  = el.querySelector('.custom-h')
  const closeBtn = el.querySelector('.close-btn')

  select.addEventListener('change', () => {
    const preset = BREAKPOINTS.find((b) => b.name === select.value)
    if (!preset) return

    vp.name     = preset.name
    vp.isCustom = preset.name === 'Custom'

    if (!vp.isCustom) {
      vp.width  = preset.width
      vp.height = preset.height
      customW.value = vp.width
      customH.value = vp.height
    }

    customBox.style.display = vp.isCustom ? 'flex' : 'none'
    applyViewportSize(vp)
  })

  customW.addEventListener('change', () => {
    const val = parseInt(customW.value, 10)
    if (val > 0) { vp.width = val; applyViewportSize(vp) }
  })

  customH.addEventListener('change', () => {
    const val = parseInt(customH.value, 10)
    if (val > 0) { vp.height = val; applyViewportSize(vp) }
  })

  closeBtn.addEventListener('click', () => removeViewport(vp.id))

  // ── Scroll sync setup ─────────────────────────────────────────────────────
  vp.iframe.addEventListener('load', () => wireScrollSync(vp))

  // Show placeholder when no URL is set
  if (!currentUrl) showPlaceholder(vp.iframe)
}

function applyViewportSize (vp) {
  const sizeLabel = document.getElementById(`vp-size-${vp.id}`)
  const wrap      = document.getElementById(`vp-wrap-${vp.id}`)

  if (sizeLabel) sizeLabel.innerHTML = `${vp.width}&thinsp;×&thinsp;${vp.height}`
  if (wrap)      wrap.style.width    = `${vp.width}px`
  if (vp.iframe) {
    vp.iframe.style.width  = `${vp.width}px`
    vp.iframe.style.height = `${vp.height}px`
  }
}

// ─── Scroll synchronisation ───────────────────────────────────────────────────

/**
 * Returns true when we can access the iframe's window — i.e. it is same-origin.
 * Accessing any property of a cross-origin contentWindow throws a SecurityError.
 */
function isSameOrigin (iframeWindow) {
  try {
    // location.href throws SecurityError for cross-origin frames
    return typeof iframeWindow.location.href === 'string'
  } catch (_) {
    return false
  }
}

function wireScrollSync (vp) {
  vp.syncEnabled = false

  const win = vp.iframe.contentWindow

  if (isSameOrigin(win)) {
    win.addEventListener('scroll', () => {
      if (isSyncing) return
      isSyncing = true
      clearTimeout(syncTimer)

      const scrollX = win.scrollX
      const scrollY = win.scrollY

      viewports.forEach((other) => {
        if (other.id === vp.id || !other.iframe || !other.syncEnabled) return
        try {
          other.iframe.contentWindow.scrollTo(scrollX, scrollY)
        } catch (_) {
          // cross-origin — ignore
        }
      })

      syncTimer = setTimeout(() => { isSyncing = false }, 60)
    })

    vp.syncEnabled = true
  }

  updateSyncStatus()
  updateSyncBadge(vp)
}

function updateSyncBadge (vp) {
  const badge = document.getElementById(`vp-sync-${vp.id}`)
  if (!badge) return
  // Show an indicator only when the frame is loaded but sync is unavailable
  const hasUrl = currentUrl && currentUrl !== 'about:blank'
  badge.style.display = hasUrl && !vp.syncEnabled ? 'inline-flex' : 'none'
  badge.title = vp.syncEnabled
    ? 'Scroll sync active'
    : 'Scroll sync unavailable (cross-origin restriction)'
}

function updateSyncStatus () {
  const total   = viewports.length
  const synced  = viewports.filter((v) => v.syncEnabled).length

  if (total === 0 || !currentUrl) {
    syncStatusEl.textContent = ''
    syncStatusEl.className = 'sync-status'
    return
  }

  if (synced === total) {
    syncStatusEl.textContent = '⚡ Scroll sync active'
    syncStatusEl.className = 'sync-status sync-on'
  } else if (synced > 0) {
    syncStatusEl.textContent = `⚡ Scroll sync: ${synced}/${total}`
    syncStatusEl.className = 'sync-status sync-partial'
  } else {
    syncStatusEl.textContent = '⚠ Scroll sync unavailable'
    syncStatusEl.className = 'sync-status sync-off'
  }
}

// ─── Placeholder (no URL yet) ─────────────────────────────────────────────────

function showPlaceholder (iframe) {
  iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #12121e;
    color: #6060a0;
    font-family: system-ui, sans-serif;
    gap: 12px;
    text-align: center;
    padding: 24px;
  }
  .icon { font-size: 40px; opacity: .4; }
  p { font-size: 14px; line-height: 1.5; max-width: 260px; }
</style>
</head>
<body>
  <div class="icon">🖥</div>
  <p>Enter a URL in the toolbar above and click <strong>Load</strong> to preview.</p>
</body>
</html>`
}
