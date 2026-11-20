// Cover composition for Vice Cover Maker: a multi-panel poster with one
// large hero panel and two smaller stacked panels, each photo cropped to
// fill its panel, bold caption lettering across the cover, and clean gaps
// and borders between panels.

export const CAPTION_FONT_STACK = 'Impact, "Arial Narrow Bold", sans-serif';

export function panelRectsFor(width, height) {
  const gap = Math.max(8, Math.round(Math.min(width, height) * 0.012));
  const margin = gap;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2;
  const portrait = height > width * 1.08;
  if (portrait) {
    const heroH = Math.round(innerH * 0.58);
    const sideH = innerH - heroH - gap;
    const sideW = Math.round((innerW - gap) / 2);
    return [
      { x: margin, y: margin, w: innerW, h: heroH },
      { x: margin, y: margin + heroH + gap, w: sideW, h: sideH },
      { x: margin + sideW + gap, y: margin + heroH + gap, w: innerW - sideW - gap, h: sideH },
    ];
  }
  const heroW = Math.round(innerW * 0.62);
  const sideW = innerW - heroW - gap;
  const sideH = Math.round((innerH - gap) / 2);
  return [
    { x: margin, y: margin, w: heroW, h: innerH },
    { x: margin + heroW + gap, y: margin, w: sideW, h: sideH },
    { x: margin + heroW + gap, y: margin + sideH + gap, w: sideW, h: innerH - sideH - gap },
  ];
}

export function drawPanelPhoto(ctx, image, rect, offsetX, offsetY, scale) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!image) {
    const placeholder = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    placeholder.addColorStop(0, '#3a2f55');
    placeholder.addColorStop(1, '#1f1830');
    ctx.fillStyle = placeholder;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(244, 238, 252, 0.55)';
    ctx.font = `700 ${Math.max(14, Math.round(rect.w * 0.05))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add a photo', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }
  const coverScale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight) * scale;
  const drawW = image.naturalWidth * coverScale;
  const drawH = image.naturalHeight * coverScale;
  const slackX = Math.max(0, drawW - rect.w);
  const slackY = Math.max(0, drawH - rect.h);
  const drawX = rect.x - slackX / 2 - offsetX * (slackX / 2);
  const drawY = rect.y - slackY / 2 - offsetY * (slackY / 2);
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}

export function drawPanelBorders(ctx, rects, width, height) {
  const line = Math.max(2, Math.round(Math.min(width, height) * 0.004));
  ctx.save();
  ctx.strokeStyle = '#0b0714';
  ctx.lineWidth = line;
  for (const rect of rects) {
    ctx.strokeRect(rect.x + line / 2, rect.y + line / 2, rect.w - line, rect.h - line);
  }
  ctx.restore();
}

export function drawCaption(ctx, width, height, caption, subtitle) {
  const title = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim();
  if (!title && !sub) return;
  ctx.save();
  const bandH = Math.round(height * 0.2);
  const bandY = height - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, height);
  band.addColorStop(0, 'rgba(8, 4, 18, 0)');
  band.addColorStop(0.45, 'rgba(8, 4, 18, 0.55)');
  band.addColorStop(1, 'rgba(8, 4, 18, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, width, bandH);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let titleSize = Math.round(width * 0.11);
  if (title) {
    ctx.font = `900 ${titleSize}px ${CAPTION_FONT_STACK}`;
    while (ctx.measureText(title).width > width * 0.92 && titleSize > 18) {
      titleSize -= 4;
      ctx.font = `900 ${titleSize}px ${CAPTION_FONT_STACK}`;
    }
    const titleY = sub ? height - Math.round(height * 0.075) : height - Math.round(height * 0.045);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b0714';
    ctx.lineWidth = Math.max(4, Math.round(titleSize * 0.14));
    ctx.strokeText(title, width / 2, titleY);
    const fill = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
    fill.addColorStop(0, '#ffe9a8');
    fill.addColorStop(0.5, '#ffb35c');
    fill.addColorStop(1, '#ff3e7f');
    ctx.fillStyle = fill;
    ctx.fillText(title, width / 2, titleY);
  }
  if (sub) {
    const subSize = Math.max(16, Math.round(width * 0.032));
    ctx.font = `700 ${subSize}px sans-serif`;
    ctx.fillStyle = '#f4eefc';
    ctx.strokeStyle = '#0b0714';
    ctx.lineWidth = Math.max(2, Math.round(subSize * 0.12));
    const subY = height - Math.round(height * 0.028);
    ctx.strokeText(sub, width / 2, subY);
    ctx.fillText(sub, width / 2, subY);
  }
  ctx.restore();
}

export function drawCover(ctx, width, height, panels, caption, subtitle) {
  ctx.save();
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, width, height);
  const rects = panelRectsFor(width, height);
  rects.forEach((rect, index) => {
    const panel = panels[index] || { image: null, offsetX: 0, offsetY: 0, scale: 1 };
    drawPanelPhoto(ctx, panel.image, rect, panel.offsetX, panel.offsetY, panel.scale);
  });
  ctx.restore();
  return rects;
}
