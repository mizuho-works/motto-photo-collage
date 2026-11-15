'use strict';
const $ = id => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');
const state = { photos: [], ratio: 1, loading: false };
const status = message => { $('status').textContent = message; };

function cells(count, width, height, gap, layout) {
  if (!count) return [];
  if (layout === 'hero' && count > 1) {
    const left = (width - gap * 3) * .6;
    const right = width - gap * 3 - left;
    const smallH = (height - gap * count) / (count - 1);
    return [{ x: gap, y: gap, w: left, h: height - gap * 2 }, ...Array.from({ length: count - 1 }, (_, i) => ({ x: gap * 2 + left, y: gap + i * (smallH + gap), w: right, h: smallH }))];
  }
  const columns = layout === 'auto' ? Math.ceil(Math.sqrt(count * state.ratio)) : Number(layout);
  const cols = Math.min(columns, count);
  const rows = Math.ceil(count / cols);
  const h = (height - gap * (rows + 1)) / rows;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const rowCount = Math.min(cols, count - row * cols);
    const w = (width - gap * (rowCount + 1)) / rowCount;
    return { x: gap + (i % cols) * (w + gap), y: gap + row * (h + gap), w, h };
  });
}

function render() {
  canvas.width = state.ratio >= 1 ? 1600 : 1280;
  canvas.height = Math.round(canvas.width / state.ratio);
  canvas.parentElement.style.aspectRatio = String(state.ratio);
  $('dimensions').textContent = `${canvas.width} × ${canvas.height} px`;
  ctx.fillStyle = $('background').value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const boxes = cells(state.photos.length, canvas.width, canvas.height, Number($('gap').value), $('layout').value);
  state.photos.forEach((photo, i) => {
    const { x, y, w, h } = boxes[i];
    const scale = Math.max(w / photo.image.width, h / photo.image.height);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(photo.image, (photo.image.width - sw) / 2, (photo.image.height - sh) / 2, sw, sh, x, y, w, h);
  });
  $('empty').hidden = state.photos.length > 0;
  $('save').disabled = !state.photos.length || state.loading;
  $('count').textContent = `${state.photos.length} / 9`;
}

function thumbnails() {
  $('thumbnails').replaceChildren();
  state.photos.forEach((photo, i) => {
    const item = document.createElement('div'); item.className = 'thumb';
    const img = document.createElement('img'); img.src = photo.url; img.alt = photo.name;
    const controls = document.createElement('div'); controls.className = 'thumb-controls';
    [['←', '前へ移動', -1], ['×', '削除', 0], ['→', '後ろへ移動', 1]].forEach(([text, label, direction]) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
      button.setAttribute('aria-label', `${i + 1}枚目を${label}`);
      button.disabled = direction === -1 && i === 0 || direction === 1 && i === state.photos.length - 1;
      button.onclick = () => {
        if (!direction) { URL.revokeObjectURL(photo.url); state.photos.splice(i, 1); }
        else { [state.photos[i], state.photos[i + direction]] = [state.photos[i + direction], state.photos[i]]; }
        thumbnails(); render(); status('');
      };
      controls.append(button);
    });
    item.append(img, controls); $('thumbnails').append(item);
  });
}

$('photos').addEventListener('change', async event => {
  if (state.loading) return;
  const files = Array.from(event.target.files);
  event.target.value = '';
  const available = 9 - state.photos.length;
  if (!available) { status('写真は最大9枚です。削除してから追加してください。'); return; }
  state.loading = true; $('photos').disabled = true; render(); status('写真を読み込んでいます…');
  let failed = 0;
  for (const file of files.slice(0, available)) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      state.photos.push({ image, url, name: file.name });
    } catch { URL.revokeObjectURL(url); failed++; }
  }
  state.loading = false; $('photos').disabled = false; thumbnails(); render();
  status(failed ? `${failed}枚を読み込めませんでした。JPEGやPNGでお試しください。` : files.length > available ? '9枚まで追加しました。' : '写真を追加しました。');
});
document.querySelectorAll('[data-ratio]').forEach(button => button.onclick = () => {
  state.ratio = Number(button.dataset.ratio);
  document.querySelectorAll('[data-ratio]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  render();
});
['layout', 'background', 'gap'].forEach(id => $(id).addEventListener('input', () => { $('gap-value').value = $('gap').value; render(); }));
$('save').onclick = () => {
  canvas.toBlob(async blob => {
    if (!blob) { status('画像を作成できませんでした。もう一度お試しください。'); return; }
    const name = `motto-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([blob], name, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'motto コラージュ' }); status('共有メニューから画像を保存できます。'); return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = name;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000); status('画像をダウンロードしました。');
    } catch (error) { if (error.name !== 'AbortError') status('保存できませんでした。ブラウザを変えてお試しください。'); }
  }, 'image/png');
};
render();
