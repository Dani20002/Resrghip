const STORAGE_KEY = 'rsrg-shift-calendar-v1';
const SETTINGS_KEY = 'rsrg-shift-calendar-settings-v3';

const DEFAULT_SETTINGS = {
  appName: 'RSRG Naptár',
  iconText: 'RSRG',
  eyebrow: 'MUNKAHELYI NAPTÁR',
  headerTitle: 'RSRG Műszaknaptár',
  iconBackground: '#111827',
  iconTextColor: '#ffffff',
  customOptions: []
};

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return typeof structuredClone === 'function' ? structuredClone(fallback) : JSON.parse(JSON.stringify(fallback));
  }
}

function loadEntries() {
  return loadJson(STORAGE_KEY, {});
}

function loadSettings() {
  const saved = loadJson(SETTINGS_KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    customOptions: Array.isArray(saved.customOptions) ? saved.customOptions : []
  };
}

const state = {
  viewDate: new Date(),
  selectedDate: null,
  activeTab: 'calendarTab',
  entries: loadEntries(),
  settings: loadSettings(),
  manifestUrl: null
};

const builtInShiftMeta = {
  morning: { label: 'Délelőtt', short: '06–14', hours: 8, paidHours: 8, overtimeHours: 0, workDay: true, paidDay: true, color: '#f59e0b' },
  afternoon: { label: 'Délután', short: '14–22', hours: 8, paidHours: 8, overtimeHours: 0, workDay: true, paidDay: true, color: '#f97316' },
  night: { label: 'Éjszaka', short: '22–06', hours: 8, paidHours: 8, overtimeHours: 0, workDay: true, paidDay: true, color: '#6366f1' },

  morning_ot_02_14: { label: 'Délelőtt túlóra', short: '02–14', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, color: '#ef4444' },
  morning_ot_06_18: { label: 'Délelőtt túlóra', short: '06–18', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, color: '#ef4444' },
  afternoon_ot_10_22: { label: 'Délután túlóra', short: '10–22', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, color: '#ef4444' },
  afternoon_ot_14_02: { label: 'Délután túlóra', short: '14–02', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, color: '#ef4444' },
  night_ot_18_06: { label: 'Éjszaka túlóra', short: '18–06', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, color: '#ef4444' },
  night_ot_22_10: { label: 'Éjszaka túlóra', short: '22–10', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, color: '#ef4444' },

  // Régi verzióból megmaradt bejegyzések támogatása.
  overtime: { label: 'Túlóra', short: '+8 óra', hours: 8, paidHours: 8, overtimeHours: 8, workDay: true, paidDay: true, color: '#ef4444' },
  vacation: { label: 'Szabadság', short: 'SZABI', hours: 0, paidHours: 8, overtimeHours: 0, workDay: false, paidDay: true, color: '#10b981' },
  paid_leave: { label: 'Fizetett munka nélküli nap', short: 'FIZETETT', hours: 0, paidHours: 8, overtimeHours: 0, workDay: false, paidDay: true, color: '#22c55e' },
  paid_holiday: { label: 'Fizetett ünnepnap', short: 'ÜNNEP', hours: 0, paidHours: 8, overtimeHours: 0, workDay: false, paidDay: true, color: '#84cc16' },
  sick: { label: 'Táppénz', short: 'TP', hours: 0, paidHours: 0, overtimeHours: 0, workDay: false, paidDay: false, color: '#06b6d4' },
  unpaid_leave: { label: 'Fizetetlen távollét', short: 'FIZETETLEN', hours: 0, paidHours: 0, overtimeHours: 0, workDay: false, paidDay: false, color: '#f43f5e' },
  off: { label: 'Szabadnap', short: 'SZABAD', hours: 0, paidHours: 0, overtimeHours: 0, workDay: false, paidDay: false, color: '#64748b' }
};

const overtimeShifts = new Set([
  'morning_ot_02_14',
  'morning_ot_06_18',
  'afternoon_ot_10_22',
  'afternoon_ot_14_02',
  'night_ot_18_06',
  'night_ot_22_10',
  'overtime'
]);

// A 2026-os általános magyar munkarend áthelyezései.
const specialNonWorkingDays = new Set(['2026-01-02', '2026-08-21', '2026-12-24']);
const specialWorkingDays = new Set(['2026-01-10', '2026-08-08', '2026-12-12']);

const calendar = document.getElementById('calendar');
const monthTitle = document.getElementById('monthTitle');
const weekInfo = document.getElementById('weekInfo');
const shiftDialog = document.getElementById('shiftDialog');
const selectedDateTitle = document.getElementById('selectedDateTitle');
const dayNote = document.getElementById('dayNote');
const rotationStartDate = document.getElementById('rotationStartDate');
const customShiftSection = document.getElementById('customShiftSection');
const customShiftOptions = document.getElementById('customShiftOptions');

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function mondayIndex(day) {
  return day === 0 ? 6 : day - 1;
}

function calculateEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getHungarianHolidayKeys(year) {
  const holidays = new Set([
    `${year}-01-01`, `${year}-03-15`, `${year}-05-01`, `${year}-08-20`,
    `${year}-10-23`, `${year}-11-01`, `${year}-12-25`, `${year}-12-26`
  ]);

  const easter = calculateEasterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  const pentecostMonday = new Date(easter);
  pentecostMonday.setDate(easter.getDate() + 50);

  holidays.add(toKey(goodFriday));
  holidays.add(toKey(easterMonday));
  holidays.add(toKey(pentecostMonday));
  return holidays;
}

const holidayCache = new Map();

function isBusinessDay(date) {
  const key = toKey(date);
  if (specialWorkingDays.has(key)) return true;
  if (specialNonWorkingDays.has(key)) return false;

  const day = date.getDay();
  if (day === 0 || day === 6) return false;

  const year = date.getFullYear();
  if (!holidayCache.has(year)) holidayCache.set(year, getHungarianHolidayKeys(year));
  return !holidayCache.get(year).has(key);
}

function getThirdBusinessDay(year, month) {
  let count = 0;
  const cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    if (isBusinessDay(cursor)) {
      count += 1;
      if (count === 3) return new Date(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

function getCustomMetaMap() {
  return Object.fromEntries(state.settings.customOptions.map(option => [option.id, option]));
}

function getMeta(shift) {
  return builtInShiftMeta[shift] || getCustomMetaMap()[shift] || null;
}

function getShiftClass(shift) {
  if (shift?.startsWith('custom_')) return 'shift-custom';
  if (shift?.startsWith('morning_ot_')) return 'shift-overtime-morning';
  if (shift?.startsWith('afternoon_ot_')) return 'shift-overtime-afternoon';
  if (shift?.startsWith('night_ot_')) return 'shift-overtime-night';
  return `shift-${shift}`;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map(char => char + char).join('')
    : value.padEnd(6, '0').slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function styleCustomBadge(element, color) {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#8b5cf6';
  element.style.background = hexToRgba(safeColor, 0.18);
  element.style.color = safeColor;
  element.style.borderLeft = `3px solid ${safeColor}`;
}

function render() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  const payday = getThirdBusinessDay(year, month);
  const paydayKey = payday ? toKey(payday) : '';

  monthTitle.textContent = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long'
  }).format(state.viewDate);

  weekInfo.textContent = payday
    ? `Fizetésnap: ${new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' }).format(payday)}`
    : 'Érints meg egy napot a beállításhoz';

  calendar.innerHTML = '';
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - mondayIndex(first.getDay()));
  const todayKey = toKey(new Date());

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toKey(date);
    const entry = state.entries[key];
    const meta = entry?.shift ? getMeta(entry.shift) : null;
    const button = document.createElement('button');
    button.className = 'day-cell';
    button.type = 'button';
    button.dataset.date = key;

    if (date.getMonth() !== month) button.classList.add('outside');
    if ([0, 6].includes(date.getDay())) button.classList.add('weekend');
    if (key === todayKey) button.classList.add('today');
    if (key === paydayKey) button.classList.add('payday');
    if (entry?.shift) button.classList.add(getShiftClass(entry.shift));

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = date.getDate();
    button.appendChild(number);

    if (key === paydayKey) {
      const paydayMark = document.createElement('span');
      paydayMark.className = 'payday-mark';
      paydayMark.textContent = 'FIZU';
      paydayMark.title = 'A hónap 3. munkanapja';
      button.appendChild(paydayMark);
    }

    if (entry?.note) {
      const mark = document.createElement('span');
      mark.className = 'note-mark';
      mark.textContent = '●';
      mark.title = entry.note;
      button.appendChild(mark);
    }

    if (meta) {
      const badge = document.createElement('span');
      badge.className = 'shift-badge';
      badge.textContent = `${meta.label} ${meta.short || ''}`.trim();
      if (entry.shift.startsWith('custom_')) styleCustomBadge(badge, meta.color);
      button.appendChild(badge);
    } else if (entry?.shift) {
      const badge = document.createElement('span');
      badge.className = 'shift-badge missing-option';
      badge.textContent = 'Hiányzó saját opció';
      button.appendChild(badge);
    }

    button.addEventListener('click', () => openDay(key));
    calendar.appendChild(button);
  }

  updateSummary(payday);
}

function renderCustomDialogOptions() {
  customShiftOptions.innerHTML = '';
  const options = state.settings.customOptions;
  customShiftSection.hidden = options.length === 0;

  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.shift = option.id;
    button.className = 'shift-option custom-shift-option';
    button.style.background = hexToRgba(option.color, 0.16);
    button.style.borderColor = hexToRgba(option.color, 0.5);

    const title = document.createElement('strong');
    title.textContent = option.label;
    const detail = document.createElement('span');
    const pieces = [];
    if (option.timeText) pieces.push(option.timeText);
    if (Number(option.hours) > 0) pieces.push(`${formatHours(option.hours)} óra`);
    if (option.type === 'paid_leave') pieces.push(`${formatHours(option.paidHours)} fizetett óra`);
    detail.textContent = pieces.join(' · ') || option.short || 'Saját opció';

    button.append(title, detail);
    customShiftOptions.appendChild(button);
  });
}

function openDay(key) {
  state.selectedDate = key;
  const date = parseKey(key);
  selectedDateTitle.textContent = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
  dayNote.value = state.entries[key]?.note || '';
  renderCustomDialogOptions();
  shiftDialog.showModal();
}

function setShift(shift) {
  const key = state.selectedDate;
  if (!key) return;
  const current = state.entries[key] || {};

  if (shift === 'clear') {
    delete state.entries[key];
  } else {
    state.entries[key] = { ...current, shift };
  }

  saveEntries();
  render();
  shiftDialog.close();
}

function formatHours(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
}

function updateSummary(payday) {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  let workDays = 0;
  let workHours = 0;
  let overtimeDays = 0;
  let overtimeHours = 0;
  let paidLeaveDays = 0;

  Object.entries(state.entries).forEach(([key, entry]) => {
    const date = parseKey(key);
    if (date.getFullYear() !== year || date.getMonth() !== month || !entry.shift) return;

    const meta = getMeta(entry.shift);
    if (!meta) return;

    if (meta.workDay) {
      workDays += 1;
      workHours += Number(meta.hours) || 0;
    }

    if (!meta.workDay && meta.paidDay) paidLeaveDays += 1;

    const overtime = Number(meta.overtimeHours) || 0;
    if (overtime > 0 || overtimeShifts.has(entry.shift)) {
      overtimeDays += 1;
      overtimeHours += overtime;
    }
  });

  document.getElementById('workDays').textContent = workDays;
  document.getElementById('workHours').textContent = `${formatHours(workHours)} óra`;
  document.getElementById('overtimeDays').textContent = overtimeDays;
  document.getElementById('overtimeHours').textContent = `${formatHours(overtimeHours)} óra`;
  document.getElementById('paidLeaveDays').textContent = `${paidLeaveDays} nap`;
  document.getElementById('paydayDate').textContent = payday
    ? new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric', weekday: 'short' }).format(payday)
    : '–';
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - mondayIndex(d.getDay()));
  return d;
}

function fillRotation() {
  const rawDate = rotationStartDate.value;
  if (!rawDate) {
    alert('Válassz kezdő dátumot.');
    return;
  }

  const startShift = document.getElementById('rotationStartShift').value;
  const order = ['morning', 'afternoon', 'night'];
  const startIndex = order.indexOf(startShift);
  const firstMonday = startOfWeek(parseKey(rawDate));
  const rangeEnd = new Date(firstMonday);
  rangeEnd.setMonth(rangeEnd.getMonth() + 12);

  for (let cursor = new Date(firstMonday); cursor < rangeEnd; cursor.setDate(cursor.getDate() + 7)) {
    const weeks = Math.round((cursor - firstMonday) / (7 * 86400000));
    const shift = order[(startIndex + weeks) % 3];

    for (let weekday = 0; weekday < 5; weekday += 1) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + weekday);
      const key = toKey(day);
      state.entries[key] = { ...(state.entries[key] || {}), shift };
    }
  }

  saveEntries();
  state.viewDate = parseKey(rawDate);
  render();
}

function clearCurrentMonth() {
  if (!confirm('Biztosan törlöd a megjelenített hónap összes bejegyzését?')) return;
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();

  Object.keys(state.entries).forEach(key => {
    const d = parseKey(key);
    if (d.getFullYear() === year && d.getMonth() === month) delete state.entries[key];
  });

  saveEntries();
  render();
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const active = panel.id === tabId;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  document.querySelectorAll('.tab-btn').forEach(button => {
    const active = button.dataset.tab === tabId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  if (tabId === 'settingsTab') {
    syncBrandingForm();
    renderCustomOptionList();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function splitIconText(text) {
  const trimmed = (text || 'RSRG').trim() || 'RSRG';
  if (trimmed.length <= 7) return [trimmed];
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    const halfway = Math.ceil(words.length / 2);
    return [words.slice(0, halfway).join(' '), words.slice(halfway).join(' ')].filter(Boolean);
  }
  const cut = Math.ceil(trimmed.length / 2);
  return [trimmed.slice(0, cut), trimmed.slice(cut)];
}

function createIconDataUrl(text, background, foreground) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const bg = /^#[0-9a-f]{6}$/i.test(background || '') ? background : '#111827';
  const fg = /^#[0-9a-f]{6}$/i.test(foreground || '') ? foreground : '#ffffff';

  roundedRect(ctx, 0, 0, 512, 512, 112);
  ctx.fillStyle = bg;
  ctx.fill();

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, 'rgba(255,255,255,.18)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.22)');
  roundedRect(ctx, 0, 0, 512, 512, 112);
  ctx.fillStyle = gradient;
  ctx.fill();

  roundedRect(ctx, 28, 28, 456, 456, 92);
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 7;
  ctx.stroke();

  const lines = splitIconText(text).slice(0, 2);
  const maxWidth = 400;
  let fontSize = lines.length === 1 ? 132 : 92;
  ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  while (fontSize > 28 && lines.some(line => ctx.measureText(line).width > maxWidth)) {
    fontSize -= 4;
    ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  }

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.25)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  if (lines.length === 1) {
    ctx.fillText(lines[0], 256, 260);
  } else {
    const lineHeight = fontSize * 1.05;
    ctx.fillText(lines[0], 256, 256 - lineHeight / 2);
    ctx.fillText(lines[1], 256, 256 + lineHeight / 2);
  }

  return canvas.toDataURL('image/png');
}

function createDynamicManifest(iconDataUrl) {
  if (state.manifestUrl) URL.revokeObjectURL(state.manifestUrl);
  const manifest = {
    name: state.settings.headerTitle || DEFAULT_SETTINGS.headerTitle,
    short_name: state.settings.appName || DEFAULT_SETTINGS.appName,
    description: 'Telefonra telepíthető munkahelyi műszaknaptár.',
    start_url: './',
    display: 'standalone',
    background_color: state.settings.iconBackground,
    theme_color: state.settings.iconBackground,
    lang: 'hu',
    icons: [{ src: iconDataUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  state.manifestUrl = URL.createObjectURL(blob);
  document.getElementById('manifestLink').href = state.manifestUrl;
}

function applyBranding() {
  const settings = state.settings;
  document.getElementById('headerEyebrow').textContent = settings.eyebrow || DEFAULT_SETTINGS.eyebrow;
  document.getElementById('headerTitle').textContent = settings.headerTitle || DEFAULT_SETTINGS.headerTitle;
  document.title = settings.headerTitle || DEFAULT_SETTINGS.headerTitle;
  document.getElementById('appleAppTitle').content = settings.appName || DEFAULT_SETTINGS.appName;
  document.getElementById('themeColorMeta').content = settings.iconBackground || DEFAULT_SETTINGS.iconBackground;

  const iconDataUrl = createIconDataUrl(settings.iconText, settings.iconBackground, settings.iconTextColor);
  document.getElementById('iconPreview').src = iconDataUrl;
  document.getElementById('favicon').href = iconDataUrl;
  document.getElementById('appleTouchIcon').href = iconDataUrl;
  createDynamicManifest(iconDataUrl);
}

function getBrandingDraft() {
  return {
    appName: document.getElementById('appNameInput').value.trim() || DEFAULT_SETTINGS.appName,
    iconText: document.getElementById('iconTextInput').value.trim() || DEFAULT_SETTINGS.iconText,
    eyebrow: document.getElementById('eyebrowInput').value.trim() || DEFAULT_SETTINGS.eyebrow,
    headerTitle: document.getElementById('headerTitleInput').value.trim() || DEFAULT_SETTINGS.headerTitle,
    iconBackground: document.getElementById('iconBgInput').value || DEFAULT_SETTINGS.iconBackground,
    iconTextColor: document.getElementById('iconTextColorInput').value || DEFAULT_SETTINGS.iconTextColor
  };
}

function previewBrandingDraft() {
  const draft = getBrandingDraft();
  document.getElementById('iconPreview').src = createIconDataUrl(draft.iconText, draft.iconBackground, draft.iconTextColor);
}

function syncBrandingForm() {
  const settings = state.settings;
  document.getElementById('appNameInput').value = settings.appName;
  document.getElementById('iconTextInput').value = settings.iconText;
  document.getElementById('eyebrowInput').value = settings.eyebrow;
  document.getElementById('headerTitleInput').value = settings.headerTitle;
  document.getElementById('iconBgInput').value = settings.iconBackground;
  document.getElementById('iconTextColorInput').value = settings.iconTextColor;
  previewBrandingDraft();
}

function durationBetween(start, end) {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes / 60;
}

function normalizeTimeText(start, end) {
  if (!start || !end) return '';
  return `${start.replace(':00', '')}–${end.replace(':00', '')}`;
}

function clearCustomForm() {
  document.getElementById('customOptionForm').reset();
  document.getElementById('customOptionId').value = '';
  document.getElementById('customColor').value = '#8b5cf6';
  document.getElementById('customPaidHours').value = '8';
  document.getElementById('customOvertimeHours').value = '0';
  document.getElementById('saveCustomOption').textContent = 'Saját opció hozzáadása';
  document.getElementById('cancelCustomEdit').hidden = true;
  updateCustomTypeFields();
}

function updateCustomTypeFields() {
  const type = document.getElementById('customType').value;
  const isWork = type === 'work';
  document.querySelectorAll('.time-dependent').forEach(field => field.classList.toggle('dimmed', !isWork));
  document.getElementById('customStart').disabled = !isWork;
  document.getElementById('customEnd').disabled = !isWork;
  document.getElementById('customHours').disabled = !isWork;
  document.getElementById('customOvertimeHours').disabled = !isWork;
  if (type === 'paid_leave' && !document.getElementById('customPaidHours').value) {
    document.getElementById('customPaidHours').value = '8';
  }
  if (type === 'unpaid_leave' || type === 'off') {
    document.getElementById('customPaidHours').value = '0';
  }
}

function renderCustomOptionList() {
  const list = document.getElementById('customOptionList');
  const options = state.settings.customOptions;
  document.getElementById('customOptionCount').textContent = `${options.length} db`;
  list.innerHTML = '';

  if (options.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Még nincs saját műszakod vagy napopciód.';
    list.appendChild(empty);
    return;
  }

  options.forEach(option => {
    const card = document.createElement('article');
    card.className = 'custom-option-card';
    card.style.borderLeftColor = option.color;

    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = option.label;
    const detail = document.createElement('span');
    const typeLabels = {
      work: 'Műszak',
      paid_leave: 'Fizetett munka nélküli nap',
      unpaid_leave: 'Fizetetlen távollét',
      off: 'Szabadnap'
    };
    const pieces = [typeLabels[option.type] || 'Saját opció'];
    if (option.timeText) pieces.push(option.timeText);
    if (Number(option.hours) > 0) pieces.push(`${formatHours(option.hours)} ledolgozott óra`);
    if (Number(option.paidHours) > 0 && !option.workDay) pieces.push(`${formatHours(option.paidHours)} fizetett óra`);
    if (Number(option.overtimeHours) > 0) pieces.push(`${formatHours(option.overtimeHours)} túlóra`);
    detail.textContent = pieces.join(' · ');
    info.append(title, detail);

    const actions = document.createElement('div');
    actions.className = 'custom-option-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'mini-btn';
    edit.dataset.editCustom = option.id;
    edit.textContent = 'Szerkesztés';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'mini-btn delete-mini';
    remove.dataset.deleteCustom = option.id;
    remove.textContent = 'Törlés';
    actions.append(edit, remove);

    card.append(info, actions);
    list.appendChild(card);
  });
}

function editCustomOption(id) {
  const option = state.settings.customOptions.find(item => item.id === id);
  if (!option) return;
  document.getElementById('customOptionId').value = option.id;
  document.getElementById('customName').value = option.label;
  document.getElementById('customShort').value = option.short || '';
  document.getElementById('customType').value = option.type || 'work';
  document.getElementById('customColor').value = option.color || '#8b5cf6';
  document.getElementById('customStart').value = option.start || '';
  document.getElementById('customEnd').value = option.end || '';
  document.getElementById('customHours').value = option.hours ?? '';
  document.getElementById('customPaidHours').value = option.paidHours ?? 0;
  document.getElementById('customOvertimeHours').value = option.overtimeHours ?? 0;
  document.getElementById('saveCustomOption').textContent = 'Saját opció mentése';
  document.getElementById('cancelCustomEdit').hidden = false;
  updateCustomTypeFields();
  document.getElementById('customName').focus();
}

function deleteCustomOption(id) {
  const option = state.settings.customOptions.find(item => item.id === id);
  if (!option) return;
  const usageCount = Object.values(state.entries).filter(entry => entry.shift === id).length;
  const warning = usageCount > 0
    ? `A(z) „${option.label}” ${usageCount} napon szerepel. Törléskor ezekről a napokról is lekerül. Biztosan folytatod?`
    : `Biztosan törlöd ezt a saját opciót: „${option.label}”?`;
  if (!confirm(warning)) return;

  state.settings.customOptions = state.settings.customOptions.filter(item => item.id !== id);
  Object.keys(state.entries).forEach(key => {
    if (state.entries[key]?.shift === id) {
      const note = state.entries[key].note;
      if (note) state.entries[key] = { note };
      else delete state.entries[key];
    }
  });
  saveSettings();
  saveEntries();
  clearCustomForm();
  renderCustomOptionList();
  renderCustomDialogOptions();
  render();
}

document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

document.getElementById('settingsShortcut').addEventListener('click', () => switchTab('settingsTab'));

shiftDialog.addEventListener('click', event => {
  const button = event.target.closest('[data-shift]');
  if (button) setShift(button.dataset.shift);
});

document.getElementById('saveNote').addEventListener('click', () => {
  const key = state.selectedDate;
  const note = dayNote.value.trim();
  if (!key) return;

  const current = state.entries[key] || {};
  if (!note && !current.shift) delete state.entries[key];
  else state.entries[key] = { ...current, note };

  saveEntries();
  render();
  shiftDialog.close();
});

document.getElementById('prevMonth').addEventListener('click', () => {
  state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
  render();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
  render();
});

document.getElementById('todayBtn').addEventListener('click', () => {
  state.viewDate = new Date();
  switchTab('calendarTab');
  render();
});

document.getElementById('fillRotation').addEventListener('click', fillRotation);
document.getElementById('clearMonth').addEventListener('click', clearCurrentMonth);

document.getElementById('brandingForm').addEventListener('submit', event => {
  event.preventDefault();
  state.settings = { ...state.settings, ...getBrandingDraft() };
  saveSettings();
  applyBranding();
  alert('A megjelenés elmentve.');
});

['appNameInput', 'iconTextInput', 'iconBgInput', 'iconTextColorInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', previewBrandingDraft);
});

document.getElementById('resetBranding').addEventListener('click', () => {
  state.settings = {
    ...state.settings,
    appName: DEFAULT_SETTINGS.appName,
    iconText: DEFAULT_SETTINGS.iconText,
    eyebrow: DEFAULT_SETTINGS.eyebrow,
    headerTitle: DEFAULT_SETTINGS.headerTitle,
    iconBackground: DEFAULT_SETTINGS.iconBackground,
    iconTextColor: DEFAULT_SETTINGS.iconTextColor
  };
  saveSettings();
  syncBrandingForm();
  applyBranding();
});

document.getElementById('customType').addEventListener('change', updateCustomTypeFields);

document.getElementById('customOptionForm').addEventListener('submit', event => {
  event.preventDefault();
  const existingId = document.getElementById('customOptionId').value;
  const type = document.getElementById('customType').value;
  const start = type === 'work' ? document.getElementById('customStart').value : '';
  const end = type === 'work' ? document.getElementById('customEnd').value : '';
  const calculatedHours = durationBetween(start, end);
  const hoursRaw = document.getElementById('customHours').value.trim();
  const typedHours = hoursRaw === '' ? Number.NaN : Number(hoursRaw);
  const hours = type === 'work' ? (Number.isFinite(typedHours) && typedHours >= 0 ? typedHours : calculatedHours) : 0;
  const paidHoursInput = Number(document.getElementById('customPaidHours').value);
  const paidHours = Number.isFinite(paidHoursInput) ? paidHoursInput : (type === 'paid_leave' ? 8 : hours);
  const overtimeInput = Number(document.getElementById('customOvertimeHours').value);
  const overtimeHours = type === 'work' && Number.isFinite(overtimeInput) ? overtimeInput : 0;
  const label = document.getElementById('customName').value.trim();
  const timeText = normalizeTimeText(start, end);
  const short = document.getElementById('customShort').value.trim() || timeText || label.slice(0, 12).toUpperCase();

  if (!label) return;
  if (type === 'work' && hours <= 0) {
    alert('Adj meg kezdési és befejezési időt, vagy írd be a ledolgozott órák számát.');
    return;
  }

  const option = {
    id: existingId || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    short,
    type,
    start,
    end,
    timeText,
    hours,
    paidHours: type === 'unpaid_leave' || type === 'off' ? 0 : paidHours,
    overtimeHours,
    workDay: type === 'work',
    paidDay: type === 'work' || type === 'paid_leave',
    color: document.getElementById('customColor').value || '#8b5cf6'
  };

  const index = state.settings.customOptions.findIndex(item => item.id === option.id);
  if (index >= 0) state.settings.customOptions[index] = option;
  else state.settings.customOptions.push(option);

  saveSettings();
  clearCustomForm();
  renderCustomOptionList();
  renderCustomDialogOptions();
  render();
});

document.getElementById('cancelCustomEdit').addEventListener('click', clearCustomForm);

document.getElementById('customOptionList').addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit-custom]');
  if (editButton) editCustomOption(editButton.dataset.editCustom);
  const deleteButton = event.target.closest('[data-delete-custom]');
  if (deleteButton) deleteCustomOption(deleteButton.dataset.deleteCustom);
});

rotationStartDate.value = toKey(startOfWeek(new Date()));
applyBranding();
syncBrandingForm();
clearCustomForm();
renderCustomOptionList();
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
