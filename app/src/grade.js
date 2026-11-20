// Colour grades for Vice Cover Maker: a warm Vice City sunset grade and a
// magenta/cyan neon grade, applied over the drawn photos with canvas
// compositing so the whole cover shares one poster look.

export function applySunsetGrade(ctx, width, height) {
  ctx.save();
  const warm = ctx.createLinearGradient(0, 0, 0, height);
  warm.addColorStop(0, 'rgba(255, 170, 60, 0.28)');
  warm.addColorStop(0.55, 'rgba(255, 90, 120, 0.20)');
  warm.addColorStop(1, 'rgba(70, 20, 120, 0.30)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(
    width * 0.5, height * 0.78, 10,
    width * 0.5, height * 0.78, Math.max(width, height) * 0.75,
  );
  glow.addColorStop(0, 'rgba(255, 160, 70, 0.22)');
  glow.addColorStop(1, 'rgba(255, 160, 70, 0)');
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function applyNeonGrade(ctx, width, height) {
  ctx.save();
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, 'rgba(255, 43, 214, 0.30)');
  wash.addColorStop(0.5, 'rgba(90, 40, 220, 0.18)');
  wash.addColorStop(1, 'rgba(34, 230, 255, 0.28)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(10, 0, 40, 0.18)');
  shade.addColorStop(0.5, 'rgba(10, 0, 40, 0)');
  shade.addColorStop(1, 'rgba(10, 0, 40, 0.30)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function applyGrade(ctx, width, height, gradeName) {
  if (gradeName === 'neon') {
    applyNeonGrade(ctx, width, height);
  } else {
    applySunsetGrade(ctx, width, height);
  }
}
