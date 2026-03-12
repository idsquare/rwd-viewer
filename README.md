# RWD Viewer

A responsive-design multi-viewport viewer built with **pure HTML / CSS / JavaScript** and bundled by **Vite** — no React, no Vue.

Inspired by Firefox's Responsive Design Mode (`Ctrl + Shift + M`), it lets you preview any URL side-by-side at multiple breakpoint widths simultaneously, with synchronised scrolling between same-origin frames.

![RWD Viewer screenshot](https://github.com/user-attachments/assets/7dc41b52-d915-411f-825d-8c34025a31d3)

---

## Features

- **URL bar** — enter any URL and press **Load** (or `Enter`) to load it in all viewports
- **Classic breakpoint presets** — Mobile S · Mobile M · Mobile L · Tablet · Laptop · Laptop L · 4K
- **Custom breakpoint** — choose any width × height
- **Add / remove viewports** — as many side-by-side columns as you need
- **Synchronised scrolling** — when scrolling inside one viewport, all others follow (same-origin pages)
- **Cross-origin awareness** — a badge is shown when scroll sync is unavailable due to browser security restrictions
- Zero framework dependencies — pure ES modules, compiled with Vite

---

## Getting started

```bash
npm install
npm run dev      # development server with HMR
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

### URL query parameter

You can pre-fill the URL input with a query parameter:

```text
http://localhost:5173/?url=https%3A%2F%2Fexample.com
```

This only fills the input field. Click **Load** (or press `Enter`) to load the page in all viewports.

---

## Breakpoints

| Name      | Width  | Height |
|-----------|-------:|-------:|
| Mobile S  | 320 px | 568 px |
| Mobile M  | 375 px | 667 px |
| Mobile L  | 425 px | 736 px |
| Tablet    | 768 px | 1024 px |
| Laptop    | 1024 px | 768 px |
| Laptop L  | 1440 px | 900 px |
| 4K        | 2560 px | 1440 px |
| Custom    | any | any |

---

## Notes on scroll synchronisation

Browsers enforce the **same-origin policy**, which prevents JavaScript in one origin from reading or writing properties (including scroll position) of a frame loaded from a different origin.  
Scroll sync therefore works reliably when the previewed URL is served from the same host as the viewer (e.g. during local development).  
For external URLs a ⚡ badge is shown in the viewport toolbar indicating that sync is not available for that frame.

