# /qr

Conference-table page: scan to open the home page. Static, build-time SVG (uqr, ECC H), no client JS beyond the shared navbar island.

```
        ( navbar pill )

        Ananthan Nambiar        <- Fraunces display h1

      +----------------+
      | ############## |        <- white card, always dark-on-white
      | ## QR (home) ##|           min(80vw, 320px), 360px on sm+
      | ############## |
      +----------------+

     Scan to open my page       <- muted hint (i18n qr_hint)

           QR  llms.txt         <- footer, QR links here
```

Encodes the absolute home URL `https://ananthan.nambiar.my/` (from `Astro.site`). Companion: `/qr.md`.
