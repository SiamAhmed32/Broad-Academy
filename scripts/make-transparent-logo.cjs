const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const input = path.join(root, "public", "logo.jpeg");
const outputs = [path.join(root, "public", "logo.png")];

async function main() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const { width, height, channels } = info;

  for (let i = 0; i < pixels.length; i += channels) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];
    const white = Math.min(r, g, b);
    const alpha = 255 - white;
    if (alpha < 10) {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 0;
    } else {
      const scale = 255 / alpha;
      pixels[i] = Math.min(255, Math.round((r - white) * scale));
      pixels[i + 1] = Math.min(255, Math.round((g - white) * scale));
      pixels[i + 2] = Math.min(255, Math.round((b - white) * scale));
      pixels[i + 3] = alpha;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = pixels[(y * width + x) * channels + 3];
      if (a > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.08);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const cropped = await sharp(Buffer.from(pixels), {
    raw: { width, height, channels },
  })
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toBuffer();

  const square = await sharp(cropped)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  for (const output of outputs) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, square);
  }

  console.log(`Wrote transparent logo ${maxX - minX + 1}x${maxY - minY + 1} -> 512x512`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
