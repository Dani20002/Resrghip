const STORAGE_KEY = 'rsrg-shift-calendar-v1';
const state = {
  viewDate: new Date(),
  selectedDate: null,
  entries: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
};

const shiftMeta = {
  morning: { label: 'Délelőtt', short: '06–14', hours: 8 },
  afternoon: { label: 'Délután', short: '14–22', hours: 8 },
  night: { label: 'Éjszaka', short: '22–06', hours: 8 },
  overtime: { label: 'Túlóra', short: '+8 óra', hours: 8 },
  vacation: { label: 'Szabadság', short: 'SZABI', hours: 0 },
  sick: { label: 'Táppénz', short: 'TP', hours: 0 },
  off: { label: 'Szabadnap', short: 'SZABAD', hours: 0 }
};

const calendar = document.getElementById('calendar');
const monthTitle = document.getElementById('monthTitle');
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

function render() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  monthTitle.textContent = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long' }).format(state.viewDate);
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
    if (entry?.shift) button.classList.add(`shift-${entry.shift}`);

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = date.getDate();
    button.appendChild(number);

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
  updateSummary();
}

function openDay(key) {
  state.selectedDate = key;
  const date = parseKey(key);
  selectedDateTitle.textContent = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
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

function updateSummary() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  let workDays = 0, workHours = 0, overtime = 0, off = 0;

  Object.entries(state.entries).forEach(([key, entry]) => {
    const date = parseKey(key);
    if (date.getFullYear() !== year || date.getMonth() !== month || !entry.shift) return;
    const meta = shiftMeta[entry.shift];
    if (['morning', 'afternoon', 'night', 'overtime'].includes(entry.shift)) {
      workDays++;
      workHours += meta.hours;
    }
    if (entry.shift === 'overtime') overtime++;
    if (['off', 'vacation', 'sick'].includes(entry.shift)) off++;
  });

  document.getElementById('workDays').textContent = workDays;
  document.getElementById('workHours').textContent = workHours;
  document.getElementById('overtimeDays').textContent = overtime;
  document.getElementById('offDays').textContent = off;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
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
