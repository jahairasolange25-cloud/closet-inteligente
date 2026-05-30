# Test Images for E2E Tests

Place test garment images in this directory (e.g., `test-garment.png`, `test-garment.jpg`).

## Generating a Test Image

You can create a minimal valid PNG using Node.js:

```ts
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Minimal 100x100 red PNG
function createMinimalPNG(): Buffer {
  const width = 100;
  const height = 100;
  const rawData = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawData[idx] = 255;     // R
      rawData[idx + 1] = 0;   // G
      rawData[idx + 2] = 0;   // B
      rawData[idx + 3] = 255; // A
    }
  }

  const { encode } = require('fast-png');
  const pngData = encode({ width, height, data: rawData, channels: 4 });
  return Buffer.from(pngData);
}

writeFileSync(resolve(__dirname, 'test-garment.png'), createMinimalPNG());
```

Or simply copy any `.jpg`/`.png`/`.webp` file here and name it `test-garment.png`.

## Accepted formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.heic`

Max file size: 10MB
