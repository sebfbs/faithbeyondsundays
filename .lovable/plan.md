

## Disable Pinch-to-Zoom on iOS

A single, small change to `index.html` will lock the viewport and prevent pinch-to-zoom, making the app feel more like a native mobile app.

### What Changes

**`index.html`** — Update the existing viewport meta tag from:

```
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

to:

```
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

That's it — one line change, no new files or dependencies.

