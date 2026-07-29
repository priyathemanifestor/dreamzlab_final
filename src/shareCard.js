// Generates a shareable square "dream card" image (1080x1080, Instagram-post
// sized) client-side using Canvas — no server round-trip needed. Returns a
// Blob you can download or hand to navigator.share().

import { catInfo } from './data';

export async function generateDreamCardBlob(dream, pct) {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const info = catInfo(dream.category);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1e1040');
  grad.addColorStop(1, '#150f24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Accent glow
  const glow = ctx.createRadialGradient(size * 0.85, size * 0.1, 10, size * 0.85, size * 0.1, size * 0.5);
  glow.addColorStop(0, 'rgba(139,92,246,.35)');
  glow.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Eyebrow
  ctx.fillStyle = '#8b5cf6';
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText('✨ MY DREAM · DreamzLab', 70, 130);

  // Category emoji, big
  ctx.font = '160px sans-serif';
  ctx.fillText(info.emoji, 70, 340);

  // Title (wrapped)
  ctx.fillStyle = '#f5f0ff';
  ctx.font = '700 64px "Fredoka", Inter, sans-serif';
  wrapText(ctx, dream.title, 70, 460, size - 140, 74);

  // Progress bar
  const barY = 780;
  const barX = 70;
  const barW = size - 140;
  ctx.fillStyle = '#33254a';
  roundRect(ctx, barX, barY, barW, 26, 13);
  ctx.fill();
  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, '#8b5cf6');
  fillGrad.addColorStop(1, '#ec4899');
  ctx.fillStyle = fillGrad;
  roundRect(ctx, barX, barY, Math.max(26, (barW * pct) / 100), 26, 13);
  ctx.fill();

  // Progress label
  ctx.fillStyle = '#a99bc2';
  ctx.font = '500 34px Inter, sans-serif';
  ctx.fillText(`${pct}% complete`, barX, barY + 70);

  // Footer wordmark
  ctx.fillStyle = '#a99bc2';
  ctx.font = '500 28px Inter, sans-serif';
  ctx.fillText('✨ Track your own dreams at DreamzLab', 70, size - 60);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length && lines < 3; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y + lines * lineHeight);
      line = words[i] + ' ';
      lines++;
    } else {
      line = test;
    }
  }
  if (line && lines < 3) ctx.fillText(line.trim(), x, y + lines * lineHeight);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
