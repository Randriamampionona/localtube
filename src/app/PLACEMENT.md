# LocalTube icons

Brand mark: violet gradient tile + white play glyph (matches the app header).

## Next.js App Router — drop these into `src/app/`
Next auto-detects them by filename and injects the correct `<link>` tags —
no code needed.

| File            | Put at              | Serves as                     |
| --------------- | ------------------- | ----------------------------- |
| `favicon.ico`   | `src/app/favicon.ico` | classic tab favicon (16/32/48) |
| `icon.svg`      | `src/app/icon.svg`    | crisp scalable icon (preferred by modern browsers) |
| `apple-icon.png`| `src/app/apple-icon.png` | iOS home-screen icon (180×180) |

That's all most projects need. Delete the default `src/app/favicon.ico`
Next created and replace it with this one.

## Optional — PWA / manifest
If you add a web manifest, reference these:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
(Put the PNGs in `public/` if you go the manifest route.)

Extra sizes `icon-16/32/48.png` are included as raw source in case you need them.
