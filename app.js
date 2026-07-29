const STORAGE_KEY = 'rsrg-shift-calendar-v1';

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const state = {
  viewDate: new Date(),
  selectedDate: null,
  entries: loadEntries()
};

const shiftMeta = {
  morning: { label: 'Délelőtt', short: '06–14', hours: 8, overtimeHours: 0, workDay: true },
  afternoon: { label: 'Délután', short: '14–22', hours: 8, overtimeHours: 0, workDay: true },
  night: { label: 'Éjszaka', short: '22–06', hours: 8, overtimeHours: 0, workDay: true },

  morning_ot_02_14: { label: 'Délelőtt túlóra', short: '02–14', hours: 12, overtimeHours: 4, workDay: true },
  morning_ot_06_18: { label: 'Délelőtt túlóra', short: '06–18', hours: 12, overtimeHours: 4, workDay: true },
  afternoon_ot_10_22: { label: 'Délután túlóra', short: '10–22', hours: 12, overtimeHours: 4, workDay: true },
  afternoon_ot_14_02: { label: 'Délután túlóra', short: '14–02', hours: 12, overtimeHours: 4, workDay: true },
  night_ot_18_06: { label: 'Éjszaka túlóra', short: '18–06', hours: 12, overtimeHours: 4, workDay: true },
  night_ot_22_10: { label: 'Éjszaka túlóra', short: '22–10', hours: 12, overtimeHours: 4, workDay: true },

  // Régi verzióból megmaradt bejegyzések támogatása.
  overtime: { label: 'Túlóra', short: '+8 óra', hours: 8, overtimeHours: 8, workDay: true },
  vacation: { label: 'Szabadság', short: 'SZABI', hours: 0, overtimeHours: 0, workDay: false },
  sick: { label: 'Táppénz', short: 'TP', hours: 0, overtimeHours: 0, workDay: false },
  off: { label: 'Szabadnap', short: 'SZABAD', hours: 0, overtimeHours: 0, workDay: false }
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
const specialNonWorkingDays = new Set([
  '2026-01-02',
  '2026-08-21',
  '2026-12-24'
]);

const specialWorkingDays = new Set([
  '2026-01-10',
  '2026-08-08',
  '2026-12-12'
]);

const calendar = document.getElementById('calendar');
const monthTitle = document.getElementById('monthTitle');
const weekInfo = document.getElementById('weekInfo');
const shiftDialog = document.getElementById('shiftDialog');
const selectedDateTitle = document.getElementById('selectedDateTitle');
const dayNote = document.getElementById('dayNote');
const rotationStartDate = document.getElementById('rotationStartDate');

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

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
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
    `${year}-01-01`,
    `${year}-03-15`,
    `${year}-05-01`,
    `${year}-08-20`,
    `${year}-10-23`,
    `${year}-11-01`,
    `${year}-12-25`,
    `${year}-12-26`
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

function getShiftClass(shift) {
  if (shift?.startsWith('morning_ot_')) return 'shift-overtime-morning';
  if (shift?.startsWith('afternoon_ot_')) return 'shift-overtime-afternoon';
  if (shift?.startsWith('night_ot_')) return 'shift-overtime-night';
  return `shift-${shift}`;
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

  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toKey(date);
    const entry = state.entries[key];
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

    if (entry?.shift && shiftMeta[entry.shift]) {
      const badge = document.createElement('span');
      badge.className = 'shift-badge';
      badge.textContent = `${shiftMeta[entry.shift].label} ${shiftMeta[entry.shift].short}`;
      button.appendChild(badge);
    }

    button.addEventListener('click', () => openDay(key));
    calendar.appendChild(button);
  }

  updateSummary(payday);
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

  save();
  render();
  shiftDialog.close();
}

function updateSummary(payday) {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  let workDays = 0;
  let workHours = 0;
  let overtimeDays = 0;
  let overtimeHours = 0;

  Object.entries(state.entries).forEach(([key, entry]) => {
    const date = parseKey(key);
    if (date.getFullYear() !== year || date.getMonth() !== month || !entry.shift) return;

    const meta = shiftMeta[entry.shift];
    if (!meta) return;

    if (meta.workDay) {
      workDays += 1;
      workHours += meta.hours;
    }

    if (overtimeShifts.has(entry.shift)) {
      overtimeDays += 1;
      overtimeHours += meta.overtimeHours;
    }
  });

  document.getElementById('workDays').textContent = workDays;
  document.getElementById('workHours').textContent = `${workHours} óra`;
  document.getElementById('overtimeDays').textContent = overtimeDays;
  document.getElementById('overtimeHours').textContent = `${overtimeHours} óra`;
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

    for (let weekday = 0; weekday < 5; weekday++) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + weekday);
      const key = toKey(day);
      state.entries[key] = { ...(state.entries[key] || {}), shift };
    }
  }

  save();
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

  save();
  render();
}

document.querySelectorAll('[data-shift]').forEach(btn => {
  btn.addEventListener('click', () => setShift(btn.dataset.shift));
});

document.getElementById('saveNote').addEventListener('click', () => {
  const key = state.selectedDate;
  const note = dayNote.value.trim();
  if (!key) return;

  const current = state.entries[key] || {};
  if (!note && !current.shift) delete state.entries[key];
  else state.entries[key] = { ...current, note };

  save();
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
  render();
});

document.getElementById('fillRotation').addEventListener('click', fillRotation);
document.getElementById('clearMonth').addEventListener('click', clearCurrentMonth);

rotationStartDate.value = toKey(startOfWeek(new Date()));
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
