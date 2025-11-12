# PWA Icons

This directory contains app icons for the Progressive Web App.

## Required Icons

- `icon-192x192.png` - 192x192px icon
- `icon-512x512.png` - 512x512px icon

## Generating Icons

You can generate these icons from the `favicon.svg` using an online tool or ImageMagick:

```bash
# Using ImageMagick
convert -background none -resize 192x192 ../favicon.svg icon-192x192.png
convert -background none -resize 512x512 ../favicon.svg icon-512x512.png
```

Or use an online tool like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Temporary Fallback

Until proper PNG icons are generated, the app will fall back to using the SVG favicon.

