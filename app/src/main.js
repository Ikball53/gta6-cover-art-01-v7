// Vice Cover Maker editor wiring: reads chosen photos with FileReader
// (never uploads), keeps per-panel framing state, draws the cover with
// cover.js and grade.js, supports drag and wheel zoom, and exports the
// canvas as a PNG download at the chosen size.
import { drawCaption, drawCover, drawPanelBorders, panelRectsFor } from './cover.js';
import { applyGrade } from './grade.js';

const canvas = document.getElementById('cover-canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('preview-status');

const panels = [
  { image: null, offsetX: 0, offsetY: 0, scale: 1 },
  { image: null, offsetX: 0, offsetY: 0, scale: 1 },
  { image: null, offsetX: 0, offsetY: 0, scale: 1 },
];

const sizeSelect = document.getElementById('export-size');
const captionInput = document.getElementById('caption-text');
const subtitleInput = document.getElementById('subtitle-text');
const activePanelSelect = document.getElementById('active-panel');
const scaleInput = document.getElementById('panel-scale');
const offsetXInput = document.getElementById('panel-offset-x');
const offsetYInput = document.getElementById('panel-offset-y');

function selectedGrade() {
  const checked = document.querySelector('input[name="grade"]:checked');
  return checked ? checked.value : 'sunset';
}

function selectedSize() {
  const parts = sizeSelect.value.split('x');
  return { width: Number(parts[0]), height: Number(parts[1]) };
}

function renderCover(targetCtx, width, height) {
  const rects = drawCover(targetCtx, width, height, panels, captionInput.value, subtitleInput.value);
  applyGrade(targetCtx, width, height, selectedGrade());
  drawPanelBorders(targetCtx, rects, width, height);
  drawCaption(targetCtx, width, height, captionInput.value, subtitleInput.value);
  return rects;
}

function refreshPreview() {
  const { width, height } = selectedSize();
  canvas.width = width;
  canvas.height = height;
  renderCover(ctx, width, height);
}

function syncPanelControls() {
  const panel = panels[Number(activePanelSelect.value)];
  scaleInput.value = String(panel.scale);
  offsetXInput.value = String(panel.offsetX);
  offsetYInput.value = String(panel.offsetY);
}

function loadPhotoIntoPanel(file, panelIndex) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const image = new Image();
    image.addEventListener('load', () => {
      panels[panelIndex].image = image;
      panels[panelIndex].offsetX = 0;
      panels[panelIndex].offsetY = 0;
      panels[panelIndex].scale = 1;
      if (Number(activePanelSelect.value) === panelIndex) syncPanelControls();
      refreshPreview();
      statusEl.textContent = 'Photo loaded. Drag it in the preview to reframe, then export your PNG.';
    });
    image.src = String(reader.result);
  });
  reader.readAsDataURL(file);
}

function panelIndexAt(canvasX, canvasY) {
  const rects = panelRectsFor(canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (canvasX >= rect.x && canvasX <= rect.x + rect.w && canvasY >= rect.y && canvasY <= rect.y + rect.h) {
      return i;
    }
  }
  return -1;
}

function canvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

let dragState = null;

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const index = panelIndexAt(point.x, point.y);
  if (index < 0 || !panels[index].image) return;
  activePanelSelect.value = String(index);
  syncPanelControls();
  dragState = {
    index,
    startX: point.x,
    startY: point.y,
    startOffsetX: panels[index].offsetX,
    startOffsetY: panels[index].offsetY,
  };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragState) return;
  const point = canvasPoint(event);
  const rect = panelRectsFor(canvas.width, canvas.height)[dragState.index];
  const panel = panels[dragState.index];
  panel.offsetX = Math.max(-1, Math.min(1, dragState.startOffsetX - ((point.x - dragState.startX) / rect.w) * 2));
  panel.offsetY = Math.max(-1, Math.min(1, dragState.startOffsetY - ((point.y - dragState.startY) / rect.h) * 2));
  syncPanelControls();
  refreshPreview();
});

canvas.addEventListener('pointerup', () => {
  dragState = null;
});

canvas.addEventListener('pointercancel', () => {
  dragState = null;
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const point = canvasPoint(event);
  const index = panelIndexAt(point.x, point.y);
  if (index < 0 || !panels[index].image) return;
  const panel = panels[index];
  panel.scale = Math.max(1, Math.min(3, panel.scale * (event.deltaY < 0 ? 1.06 : 0.94)));
  if (Number(activePanelSelect.value) === index) syncPanelControls();
  refreshPreview();
}, { passive: false });

document.getElementById('photo-hero').addEventListener('change', (event) => {
  loadPhotoIntoPanel(event.target.files[0], 0);
});
document.getElementById('photo-top').addEventListener('change', (event) => {
  loadPhotoIntoPanel(event.target.files[0], 1);
});
document.getElementById('photo-bottom').addEventListener('change', (event) => {
  loadPhotoIntoPanel(event.target.files[0], 2);
});

document.getElementById('use-one-photo').addEventListener('click', () => {
  if (!panels[0].image) {
    statusEl.textContent = 'Load a hero photo first, then spread it across all panels.';
    return;
  }
  panels[1].image = panels[0].image;
  panels[2].image = panels[0].image;
  refreshPreview();
  statusEl.textContent = 'Hero photo now fills all three panels. Reframe each panel as you like.';
});

sizeSelect.addEventListener('change', refreshPreview);
captionInput.addEventListener('input', refreshPreview);
subtitleInput.addEventListener('input', refreshPreview);
document.querySelectorAll('input[name="grade"]').forEach((radio) => {
  radio.addEventListener('change', refreshPreview);
});

activePanelSelect.addEventListener('change', syncPanelControls);
scaleInput.addEventListener('input', () => {
  panels[Number(activePanelSelect.value)].scale = Number(scaleInput.value);
  refreshPreview();
});
offsetXInput.addEventListener('input', () => {
  panels[Number(activePanelSelect.value)].offsetX = Number(offsetXInput.value);
  refreshPreview();
});
offsetYInput.addEventListener('input', () => {
  panels[Number(activePanelSelect.value)].offsetY = Number(offsetYInput.value);
  refreshPreview();
});

document.getElementById('reset-panel').addEventListener('click', () => {
  const panel = panels[Number(activePanelSelect.value)];
  panel.offsetX = 0;
  panel.offsetY = 0;
  panel.scale = 1;
  syncPanelControls();
  refreshPreview();
});

document.getElementById('export-png').addEventListener('click', () => {
  const { width, height } = selectedSize();
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  renderCover(exportCanvas.getContext('2d'), width, height);
  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vice-cover.png';
    link.click();
    URL.revokeObjectURL(url);
    statusEl.textContent = `Exported a ${width} x ${height} PNG cover.`;
  }, 'image/png');
});

syncPanelControls();
refreshPreview();
