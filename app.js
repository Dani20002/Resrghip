'use strict';

const APP_VERSION = '4.0.0';
const STORAGE_KEY = 'rsrg-shift-calendar-v1';
const SETTINGS_KEY = 'rsrg-shift-calendar-settings-v4';
const LEGACY_SETTINGS_KEY = 'rsrg-shift-calendar-settings-v3';
const SENT_NOTIFICATIONS_KEY = 'rsrg-sent-notifications-v4';

const DEFAULT_SETTINGS = {
  appName: 'RSRG Naptár',
  iconText: 'RSRG',
  eyebrow: 'MUNKAHELYI NAPTÁR',
  headerTitle: 'RSRG Műszaknaptár',
  iconBackground: '#111827',
  iconTextColor: '#ffffff',
  accentColor: '#7c3aed',
  theme: 'dark',
  customOptions: [],
  specialDays: [],
  actualNetByMonth: {},
  salary: {
    baseMonthly: 462000,
    hourDivisor: 174,
    fixedBonus: 0,
    afternoonPremium: 30,
    nightPremium: 40,
    sundayPremium: 50,
    holidayPremium: 100,
    overtimePremium: 50,
    restOvertimePremium: 100,
    sickPercent: 70,
    taxRate: 15,
    socialRate: 18.5,
    under25Enabled: true,
    under25Limit: 715765,
    otherNetAllowance: 0,
    otherDeduction: 0,
    paydayBusinessDay: 3
  },
  leave: {
    annualAllowance: 20,
    carryOver: 0
  },
  reminders: {
    shiftEnabled: true,
    shiftMinutes: 120,
    paydayEnabled: true
  }
};

const OFFICIAL_SPECIAL_DAYS = {
  '2026-01-02': { type: 'nonworking', label: 'Áthelyezett pihenőnap' },
  '2026-01-10': { type: 'working', label: 'Áthelyezett munkanap' },
  '2026-08-08': { type: 'working', label: 'Áthelyezett munkanap' },
  '2026-08-21': { type: 'nonworking', label: 'Áthelyezett pihenőnap' },
  '2026-12-12': { type: 'working', label: 'Áthelyezett munkanap' },
  '2026-12-24': { type: 'nonworking', label: 'Áthelyezett pihenőnap' }
};

const BUILT_IN_SHIFTS = {
  morning: { id: 'morning', label: 'Délelőtt', short: '06–14', start: '06:00', end: '14:00', hours: 8, paidHours: 8, overtimeHours: 0, workDay: true, paidDay: true, type: 'work', color: '#f59e0b' },
  afternoon: { id: 'afternoon', label: 'Délután', short: '14–22', start: '14:00', end: '22:00', hours: 8, paidHours: 8, overtimeHours: 0, workDay: true, paidDay: true, type: 'work', color: '#f97316' },
  night: { id: 'night', label: 'Éjszaka', short: '22–06', start: '22:00', end: '06:00', hours: 8, paidHours: 8, overtimeHours: 0, workDay: true, paidDay: true, type: 'work', color: '#6366f1' },
  morning_ot_02_14: { id: 'morning_ot_02_14', label: 'Délelőtt túlóra', short: '02–14', start: '02:00', end: '14:00', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, type: 'work', color: '#ef4444' },
  morning_ot_06_18: { id: 'morning_ot_06_18', label: 'Délelőtt túlóra', short: '06–18', start: '06:00', end: '18:00', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, type: 'work', color: '#ef4444' },
  afternoon_ot_10_22: { id: 'afternoon_ot_10_22', label: 'Délután túlóra', short: '10–22', start: '10:00', end: '22:00', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, type: 'work', color: '#dc2626' },
  afternoon_ot_14_02: { id: 'afternoon_ot_14_02', label: 'Délután túlóra', short: '14–02', start: '14:00', end: '02:00', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, type: 'work', color: '#dc2626' },
  night_ot_18_06: { id: 'night_ot_18_06', label: 'Éjszaka túlóra', short: '18–06', start: '18:00', end: '06:00', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, type: 'work', color: '#be123c' },
  night_ot_22_10: { id: 'night_ot_22_10', label: 'Éjszaka túlóra', short: '22–10', start: '22:00', end: '10:00', hours: 12, paidHours: 12, overtimeHours: 4, workDay: true, paidDay: true, type: 'work', color: '#be123c' },
  overtime: { id: 'overtime', label: 'Túlóra', short: '+8 óra', start: '', end: '', hours: 8, paidHours: 8, overtimeHours: 8, workDay: true, paidDay: true, type: 'work', color: '#ef4444' },
  vacation: { id: 'vacation', label: 'Szabadság', short: 'SZABI', start: '', end: '', hours: 0, paidHours: 8, overtimeHours: 0, absenceHours: 8, workDay: false, paidDay: true, type: 'paid_leave', color: '#10b981' },
  paid_leave: { id: 'paid_leave', label: 'Fizetett munka nélküli nap', short: 'FIZETETT', start: '', end: '', hours: 0, paidHours: 8, overtimeHours: 0, absenceHours: 8, workDay: false, paidDay: true, type: 'paid_leave', color: '#22c55e' },
  paid_holiday: { id: 'paid_holiday', label: 'Fizetett ünnepnap', short: 'ÜNNEP', start: '', end: '', hours: 0, paidHours: 8, overtimeHours: 0, absenceHours: 8, workDay: false, paidDay: true, type: 'paid_leave', color: '#84cc16' },
  sick: { id: 'sick', label: 'Betegnap / táppénz', short: 'TP', start: '', end: '', hours: 0, paidHours: 8, overtimeHours: 0, absenceHours: 8, workDay: false, paidDay: true, type: 'sick', color: '#06b6d4' },
  unpaid_leave: { id: 'unpaid_leave', label: 'Fizetetlen távollét', short: 'FIZETETLEN', start: '', end: '', hours: 0, paidHours: 0, overtimeHours: 0, absenceHours: 8, workDay: false, paidDay: false, type: 'unpaid_leave', color: '#f43f5e' },
  off: { id: 'off', label: 'Szabadnap', short: 'SZABAD', start: '', end: '', hours: 0, paidHours: 0, overtimeHours: 0, absenceHours: 0, workDay: false, paidDay: false, type: 'off', color: '#64748b' }
};

const BUILT_IN_ORDER = [
  'morning', 'afternoon', 'night',
  'morning_ot_02_14', 'morning_ot_06_18', 'afternoon_ot_10_22', 'afternoon_ot_14_02', 'night_ot_18_06', 'night_ot_22_10',
  'vacation', 'paid_leave', 'paid_holiday', 'sick', 'unpaid_leave', 'off'
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szept', 'Okt', 'Nov', 'Dec'];
const HUF = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 });
const NUMBER = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
const DATE_LONG = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const DATE_MEDIUM = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric', weekday: 'short' });
const MONTH_LONG = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long' });

const $ = id => document.getElementById(id);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function deepMerge(base, extra) {
  const output = clone(base);
  if (!extra || typeof extra !== 'object') return output;
  Object.entries(extra).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function loadSettings() {
  const v4 = loadJson(SETTINGS_KEY, null);
  const legacy = loadJson(LEGACY_SETTINGS_KEY, null);
  const saved = v4 || legacy || {};
  const merged = deepMerge(DEFAULT_SETTINGS, saved);
  merged.customOptions = Array.isArray(saved.customOptions) ? saved.customOptions : [];
  merged.specialDays = Array.isArray(saved.specialDays) ? saved.specialDays : [];
  merged.actualNetByMonth = saved.actualNetByMonth && typeof saved.actualNetByMonth === 'object' ? saved.actualNetByMonth : {};
  return merged;
}

const state = {
  viewDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  salaryDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  statsYear: new Date().getFullYear(),
  selectedDate: null,
  draftShiftId: '',
  activeTab: 'homeTab',
  entries: loadJson(STORAGE_KEY, {}),
  settings: loadSettings(),
  manifestUrl: null,
  nextShiftInfo: null,
  swRegistration: null,
  toastTimer: null
};

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numberValue(id, fallback = 0) {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : fallback;
}

function formatHours(value) {
  return `${NUMBER.format(Number(value) || 0)} óra`;
}

function formatMoney(value) {
  return HUF.format(Math.round(Number(value) || 0));
}

function durationBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 1440;
  return minutes / 60;
}

function normalizeTimeText(start, end) {
  if (!start || !end) return '';
  return `${start.replace(':00', '')}–${end.replace(':00', '')}`;
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
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

const holidayCache = new Map();
function getHolidayMap(year) {
  if (holidayCache.has(year)) return holidayCache.get(year);
  const map = new Map([
    [`${year}-01-01`, 'Újév'],
    [`${year}-03-15`, 'Nemzeti ünnep'],
    [`${year}-05-01`, 'A munka ünnepe'],
    [`${year}-08-20`, 'Államalapítás ünnepe'],
    [`${year}-10-23`, 'Nemzeti ünnep'],
    [`${year}-11-01`, 'Mindenszentek'],
    [`${year}-12-25`, 'Karácsony'],
    [`${year}-12-26`, 'Karácsony másnapja']
  ]);
  const easter = calculateEasterSunday(year);
  map.set(toKey(addDays(easter, -2)), 'Nagypéntek');
  map.set(toKey(addDays(easter, 1)), 'Húsvéthétfő');
  map.set(toKey(addDays(easter, 50)), 'Pünkösdhétfő');
  holidayCache.set(year, map);
  return map;
}

function getCustomSpecialDay(key) {
  return state.settings.specialDays.find(item => item.date === key) || null;
}

function getSpecialDay(key) {
  return getCustomSpecialDay(key) || OFFICIAL_SPECIAL_DAYS[key] || null;
}

function getHolidayName(date) {
  const key = toKey(date);
  return getHolidayMap(date.getFullYear()).get(key) || '';
}

function isHoliday(date) {
  return Boolean(getHolidayName(date));
}

function isBusinessDay(date) {
  const key = toKey(date);
  const special = getSpecialDay(key);
  if (special?.type === 'working') return true;
  if (special?.type === 'nonworking') return false;
  if (isHoliday(date)) return false;
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getPayday(year, month) {
  const target = clamp(Number(state.settings.salary.paydayBusinessDay) || 3, 1, 10);
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (isBusinessDay(date)) {
      count += 1;
      if (count === target) return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return new Date(year, month, 1);
}

function getMeta(id) {
  if (!id) return null;
  if (BUILT_IN_SHIFTS[id]) return BUILT_IN_SHIFTS[id];
  return state.settings.customOptions.find(item => item.id === id) || null;
}

function getEntry(key) {
  return state.entries[key] || {};
}

function getShiftDateTimes(key, meta) {
  if (!meta?.start || !meta?.end) return null;
  const base = parseKey(key);
  const [sh, sm] = meta.start.split(':').map(Number);
  const [eh, em] = meta.end.split(':').map(Number);
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

function splitShiftByMidnight(key, meta) {
  const bounds = getShiftDateTimes(key, meta);
  if (!bounds) return [];
  const segments = [];
  let cursor = new Date(bounds.start);
  while (cursor < bounds.end) {
    const midnight = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0, 0);
    const segmentEnd = midnight < bounds.end ? midnight : bounds.end;
    segments.push({ start: new Date(cursor), end: new Date(segmentEnd) });
    cursor = segmentEnd;
  }
  return segments;
}

function overlapHours(start, end, windowStartHour, windowEndHour) {
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const ws = new Date(day.getFullYear(), day.getMonth(), day.getDate(), windowStartHour, 0, 0, 0);
  const we = new Date(day.getFullYear(), day.getMonth(), day.getDate(), windowEndHour, 0, 0, 0);
  const from = Math.max(start.getTime(), ws.getTime());
  const to = Math.min(end.getTime(), we.getTime());
  return Math.max(0, to - from) / 3600000;
}

function premiumHoursForEntry(key, meta) {
  const result = { afternoon: 0, night: 0, sunday: 0, holiday: 0 };
  splitShiftByMidnight(key, meta).forEach(segment => {
    result.afternoon += overlapHours(segment.start, segment.end, 18, 22);
    result.night += overlapHours(segment.start, segment.end, 0, 6) + overlapHours(segment.start, segment.end, 22, 24);
    const hours = (segment.end - segment.start) / 3600000;
    if (segment.start.getDay() === 0) result.sunday += hours;
    if (isHoliday(segment.start)) result.holiday += hours;
  });
  return result;
}

function getMonthKeys(year, month) {
  return Object.keys(state.entries).filter(key => {
    const date = parseKey(key);
    return date.getFullYear() === year && date.getMonth() === month;
  }).sort();
}

function getStandardWorkdays(year, month) {
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (isBusinessDay(date)) count += 1;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

function getMonthStats(year, month, cutoffKey = null) {
  const stats = {
    workDays: 0,
    workHours: 0,
    paidHours: 0,
    overtimeDays: 0,
    overtimeHours: 0,
    paidLeaveDays: 0,
    vacationDays: 0,
    sickDays: 0,
    unpaidDays: 0,
    offDays: 0,
    eventDays: 0,
    shiftCounts: {}
  };
  getMonthKeys(year, month).forEach(key => {
    if (cutoffKey && key > cutoffKey) return;
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    if (entry.event?.title) stats.eventDays += 1;
    if (!meta) return;
    const hours = Number(meta.hours) || 0;
    const overtimeHours = Number.isFinite(Number(entry.overtimeHours)) && entry.overtimeHours !== '' ? Number(entry.overtimeHours) : Number(meta.overtimeHours) || 0;
    stats.workHours += hours;
    stats.paidHours += Number(meta.paidHours) || 0;
    if (meta.workDay) stats.workDays += 1;
    if (overtimeHours > 0) {
      stats.overtimeDays += 1;
      stats.overtimeHours += overtimeHours;
    }
    if (meta.type === 'paid_leave') stats.paidLeaveDays += 1;
    if (entry.shift === 'vacation') stats.vacationDays += 1;
    if (meta.type === 'sick') stats.sickDays += 1;
    if (meta.type === 'unpaid_leave') stats.unpaidDays += 1;
    if (meta.type === 'off') stats.offDays += 1;
    stats.shiftCounts[entry.shift] = (stats.shiftCounts[entry.shift] || 0) + 1;
  });
  return stats;
}

function calculateSalary(year, month, cutoffKey = null) {
  const s = state.settings.salary;
  const hourly = (Number(s.baseMonthly) || 0) / Math.max(1, Number(s.hourDivisor) || 174);
  const totalStandardDays = Math.max(1, getStandardWorkdays(year, month));
  let baseFactor = 1;
  if (cutoffKey) {
    let elapsed = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month && toKey(date) <= cutoffKey) {
      if (isBusinessDay(date)) elapsed += 1;
      date.setDate(date.getDate() + 1);
    }
    baseFactor = clamp(elapsed / totalStandardDays, 0, 1);
  }

  const result = {
    base: (Number(s.baseMonthly) || 0) * baseFactor,
    fixedBonus: (Number(s.fixedBonus) || 0) * baseFactor,
    afternoonPremium: 0,
    nightPremium: 0,
    sundayPremium: 0,
    holidayPremium: 0,
    overtimePay: 0,
    unpaidDeduction: 0,
    sickReduction: 0,
    szja: 0,
    social: 0,
    otherNetAllowance: (Number(s.otherNetAllowance) || 0) * baseFactor,
    otherDeduction: (Number(s.otherDeduction) || 0) * baseFactor,
    gross: 0,
    net: 0,
    hourly,
    standardDays: totalStandardDays,
    standardHours: totalStandardDays * 8,
    baseFactor
  };

  getMonthKeys(year, month).forEach(key => {
    if (cutoffKey && key > cutoffKey) return;
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    if (!meta) return;

    if (meta.workDay) {
      const premiumHours = premiumHoursForEntry(key, meta);
      result.afternoonPremium += hourly * premiumHours.afternoon * (Number(s.afternoonPremium) || 0) / 100;
      result.nightPremium += hourly * premiumHours.night * (Number(s.nightPremium) || 0) / 100;
      result.sundayPremium += hourly * premiumHours.sunday * (Number(s.sundayPremium) || 0) / 100;
      result.holidayPremium += hourly * premiumHours.holiday * (Number(s.holidayPremium) || 0) / 100;

      const otHours = Number.isFinite(Number(entry.overtimeHours)) && entry.overtimeHours !== '' ? Number(entry.overtimeHours) : Number(meta.overtimeHours) || 0;
      if (otHours > 0) {
        const rate = entry.overtimeType === 'rest' ? Number(s.restOvertimePremium) || 0 : Number(s.overtimePremium) || 0;
        result.overtimePay += hourly * otHours * (1 + rate / 100);
      }
    } else if (meta.type === 'unpaid_leave') {
      result.unpaidDeduction += hourly * (Number(meta.absenceHours) || 8);
    } else if (meta.type === 'sick') {
      const missingRate = 1 - clamp((Number(s.sickPercent) || 0) / 100, 0, 1);
      result.sickReduction += hourly * (Number(meta.absenceHours) || 8) * missingRate;
    }
  });

  result.gross = Math.max(0,
    result.base + result.fixedBonus + result.afternoonPremium + result.nightPremium + result.sundayPremium + result.holidayPremium + result.overtimePay - result.unpaidDeduction - result.sickReduction
  );
  const under25Allowance = s.under25Enabled ? Number(s.under25Limit) || 0 : 0;
  const taxableForSzja = Math.max(0, result.gross - under25Allowance);
  result.szja = taxableForSzja * (Number(s.taxRate) || 0) / 100;
  result.social = result.gross * (Number(s.socialRate) || 0) / 100;
  result.net = Math.max(0, result.gross - result.szja - result.social + result.otherNetAllowance - result.otherDeduction);
  return result;
}

function calculateEarnedSoFar(year, month) {
  const today = new Date();
  const selected = new Date(year, month, 1);
  const current = new Date(today.getFullYear(), today.getMonth(), 1);
  if (selected > current) return calculateSalary(year, month, '0000-00-00');
  if (selected < current) return calculateSalary(year, month);
  return calculateSalary(year, month, toKey(today));
}

function getAnnualStats(year) {
  const annual = {
    workDays: 0, workHours: 0, overtimeHours: 0, vacationDays: 0, sickDays: 0, unpaidDays: 0,
    estimatedNet: 0, shiftCounts: {}, months: []
  };
  for (let month = 0; month < 12; month += 1) {
    const stats = getMonthStats(year, month);
    const salary = calculateSalary(year, month);
    const actual = Number(state.settings.actualNetByMonth[monthKey(year, month)]);
    annual.workDays += stats.workDays;
    annual.workHours += stats.workHours;
    annual.overtimeHours += stats.overtimeHours;
    annual.vacationDays += stats.vacationDays;
    annual.sickDays += stats.sickDays;
    annual.unpaidDays += stats.unpaidDays;
    annual.estimatedNet += salary.net;
    Object.entries(stats.shiftCounts).forEach(([id, count]) => {
      annual.shiftCounts[id] = (annual.shiftCounts[id] || 0) + count;
    });
    annual.months.push({ stats, salary, actual: Number.isFinite(actual) ? actual : null });
  }
  return annual;
}

function switchTab(tabId) {
  state.activeTab = tabId;
  $$('.tab-btn').forEach(button => {
    const active = button.dataset.tab === tabId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $$('.tab-panel').forEach(panel => {
    const active = panel.id === tabId;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  if (tabId === 'homeTab') renderHome();
  if (tabId === 'calendarTab') renderCalendar();
  if (tabId === 'salaryTab') renderSalary();
  if (tabId === 'statsTab') renderStats();
  if (tabId === 'settingsTab') renderSettingsLists();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAll() {
  applyBranding();
  renderHome();
  renderCalendar();
  renderSalary();
  renderStats();
  renderSettingsLists();
  updateNotificationStatus();
}

function renderHome() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayKey = toKey(now);
  const tomorrowKey = toKey(addDays(now, 1));
  const stats = getMonthStats(year, month);
  const salary = calculateSalary(year, month);
  const earned = calculateEarnedSoFar(year, month);
  const payday = getPayday(year, month);
  const nextPayday = now <= new Date(payday.getFullYear(), payday.getMonth(), payday.getDate(), 23, 59) ? payday : getPayday(month === 11 ? year + 1 : year, (month + 1) % 12);

  $('todayShift').textContent = describeEntry(todayKey);
  $('tomorrowShift').textContent = describeEntry(tomorrowKey);
  $('homePayday').textContent = DATE_MEDIUM.format(nextPayday);
  const usedVacation = getAnnualStats(year).vacationDays;
  const leaveTotal = Number(state.settings.leave.annualAllowance) + Number(state.settings.leave.carryOver);
  $('homeVacationLeft').textContent = `${Math.max(0, leaveTotal - usedVacation)} nap`;
  $('homeWorkHours').textContent = formatHours(stats.workHours);
  $('homeOvertimeHours').textContent = formatHours(stats.overtimeHours);
  $('homeNetSalary').textContent = formatMoney(salary.net);
  $('homeEarnedSoFar').textContent = formatMoney(earned.net);

  state.nextShiftInfo = findNextShift(now);
  renderNextShiftCard();
  renderUpcoming();
}

function describeEntry(key) {
  const entry = getEntry(key);
  const meta = getMeta(entry.shift);
  if (meta) return meta.timeText || normalizeTimeText(meta.start, meta.end) ? `${meta.label} ${meta.timeText || normalizeTimeText(meta.start, meta.end)}` : meta.label;
  if (entry.event?.title) return entry.event.title;
  return 'Nincs beállítva';
}

function findNextShift(now) {
  const keys = Object.keys(state.entries).sort();
  let future = null;
  for (const key of keys) {
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    if (!meta?.workDay || !meta.start || !meta.end) continue;
    const bounds = getShiftDateTimes(key, meta);
    if (!bounds) continue;
    if (bounds.start <= now && bounds.end > now) return { key, entry, meta, ...bounds, active: true };
    if (bounds.start > now && (!future || bounds.start < future.start)) future = { key, entry, meta, ...bounds, active: false };
  }
  return future;
}

function renderNextShiftCard() {
  const info = state.nextShiftInfo;
  const button = $('openNextShiftDay');
  if (!info) {
    $('nextShiftName').textContent = 'Nincs beállított műszak';
    $('nextShiftTime').textContent = 'Adj hozzá műszakokat a naptárban.';
    $('nextShiftCountdown').textContent = '—';
    button.hidden = true;
    return;
  }
  $('nextShiftName').textContent = info.active ? `${info.meta.label} – folyamatban` : info.meta.label;
  $('nextShiftTime').textContent = `${DATE_MEDIUM.format(info.start)} · ${normalizeTimeText(info.meta.start, info.meta.end)}`;
  button.hidden = false;
  button.dataset.date = info.key;
  updateCountdown();
}

function updateCountdown() {
  const info = state.nextShiftInfo;
  if (!info) return;
  const now = new Date();
  const target = info.active ? info.end : info.start;
  let diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000);
  const text = days > 0 ? `${days} nap ${hours} óra ${minutes} perc` : `${hours} óra ${minutes} perc`;
  $('nextShiftCountdown').textContent = info.active ? `${text} van hátra` : `${text} múlva`;
  if (target <= now) {
    state.nextShiftInfo = findNextShift(now);
    renderNextShiftCard();
  }
}

function renderUpcoming() {
  const list = $('upcomingList');
  list.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = [];
  for (let i = 0; i <= 21; i += 1) {
    const date = addDays(today, i);
    const key = toKey(date);
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    if (meta || entry.event?.title || entry.note) items.push({ date, key, entry, meta });
    if (items.length >= 8) break;
  }
  if (!items.length) {
    list.innerHTML = '<p class="empty-state">A következő három hétre nincs bejegyzés.</p>';
    return;
  }
  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'upcoming-item';
    article.dataset.date = item.key;
    const dateBox = document.createElement('div');
    dateBox.className = 'upcoming-date';
    dateBox.innerHTML = `<strong>${item.date.getDate()}</strong><span>${MONTHS_SHORT[item.date.getMonth()]}</span>`;
    const info = document.createElement('div');
    info.className = 'upcoming-info';
    const title = item.entry.event?.title || item.meta?.label || 'Megjegyzés';
    const details = [item.meta ? normalizeTimeText(item.meta.start, item.meta.end) : '', item.entry.note || ''].filter(Boolean).join(' · ');
    info.innerHTML = `<strong>${title}</strong><small>${details || DATE_MEDIUM.format(item.date)}</small>`;
    const color = document.createElement('i');
    color.className = 'upcoming-color';
    color.style.background = item.meta?.color || state.settings.accentColor;
    article.append(dateBox, info, color);
    list.appendChild(article);
  });
}

function renderCalendar() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  const stats = getMonthStats(year, month);
  const payday = getPayday(year, month);
  const paydayKey = toKey(payday);
  $('monthTitle').textContent = MONTH_LONG.format(state.viewDate);
  $('workDays').textContent = String(stats.workDays);
  $('workHours').textContent = formatHours(stats.workHours);
  $('overtimeDays').textContent = String(stats.overtimeDays);
  $('overtimeHours').textContent = formatHours(stats.overtimeHours);
  $('paidLeaveDays').textContent = `${stats.paidLeaveDays} nap`;
  $('paydayDate').textContent = DATE_MEDIUM.format(payday);

  const grid = $('calendar');
  grid.innerHTML = '';
  const first = new Date(year, month, 1);
  const startIndex = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -startIndex);
  const todayKey = toKey(new Date());

  for (let i = 0; i < 42; i += 1) {
    const date = addDays(gridStart, i);
    const key = toKey(date);
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    const holidayName = getHolidayName(date);
    const special = getSpecialDay(key);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    cell.dataset.date = key;
    if (date.getMonth() !== month) cell.classList.add('outside');
    if (date.getDay() === 0 || date.getDay() === 6) cell.classList.add('weekend');
    if (holidayName) cell.classList.add('holiday');
    if (key === todayKey) cell.classList.add('today');

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = String(date.getDate());
    cell.appendChild(number);

    const badges = document.createElement('div');
    badges.className = 'day-badges';
    if (key === paydayKey) badges.appendChild(makeBadge('FIZU', 'payday'));
    if (holidayName) badges.appendChild(makeBadge('ÜNNEP', 'holiday'));
    if (special?.type === 'working') badges.appendChild(makeBadge('MUNKANAP', ''));
    if (special?.type === 'nonworking') badges.appendChild(makeBadge('PIHENŐ', ''));
    cell.appendChild(badges);

    if (meta) {
      const pill = document.createElement('span');
      pill.className = 'shift-pill';
      pill.textContent = meta.short || meta.label;
      pill.style.background = meta.color || state.settings.accentColor;
      cell.appendChild(pill);
    }
    if (entry.event?.title) {
      const label = document.createElement('span');
      label.className = 'event-label';
      label.textContent = entry.event.title;
      cell.appendChild(label);
    }
    if (entry.note || entry.event?.title) {
      const dot = document.createElement('i');
      dot.className = 'note-dot';
      cell.appendChild(dot);
    }
    grid.appendChild(cell);
  }
  renderLegend();
}

function makeBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = `tiny-badge ${className}`.trim();
  badge.textContent = text;
  return badge;
}

function renderLegend() {
  const legend = $('legendCard');
  legend.innerHTML = '';
  ['morning', 'afternoon', 'night', 'morning_ot_06_18', 'vacation', 'sick'].forEach(id => {
    const meta = BUILT_IN_SHIFTS[id];
    const item = document.createElement('div');
    item.innerHTML = `<i class="dot" style="background:${meta.color}"></i>${meta.label}`;
    legend.appendChild(item);
  });
  if (state.settings.customOptions.length) {
    const item = document.createElement('div');
    item.innerHTML = `<i class="dot" style="background:${state.settings.accentColor}"></i>Saját opciók`;
    legend.appendChild(item);
  }
}

function openDayEditor(key) {
  state.selectedDate = key;
  const date = parseKey(key);
  const entry = getEntry(key);
  state.draftShiftId = entry.shift || '';
  $('selectedDateTitle').textContent = DATE_LONG.format(date);
  const holiday = getHolidayName(date);
  const special = getSpecialDay(key);
  $('selectedDateHoliday').textContent = [holiday, special?.label].filter(Boolean).join(' · ');
  $('dayOvertimeHours').value = entry.overtimeHours ?? '';
  $('dayOvertimeType').value = entry.overtimeType || 'normal';
  $('dayEventTitle').value = entry.event?.title || '';
  $('dayEventType').value = entry.event?.type || 'work';
  $('dayEventStart').value = entry.event?.start || '';
  $('dayEventEnd').value = entry.event?.end || '';
  $('dayEventLocation').value = entry.event?.location || '';
  $('dayEventReminder').value = String(entry.event?.reminderMinutes || 0);
  $('dayNote').value = entry.note || '';
  renderDayShiftOptions();
  $('shiftDialog').showModal();
}

function renderDayShiftOptions() {
  const built = $('builtInShiftOptions');
  built.innerHTML = '';
  BUILT_IN_ORDER.forEach(id => built.appendChild(createShiftOptionButton(BUILT_IN_SHIFTS[id])));
  const none = document.createElement('button');
  none.type = 'button';
  none.className = `shift-option${state.draftShiftId ? '' : ' selected'}`;
  none.dataset.shiftId = '__none__';
  none.style.setProperty('--option-color', '#64748b');
  none.innerHTML = '<strong>Nincs műszak</strong><span>Csak esemény vagy megjegyzés</span>';
  built.appendChild(none);

  const customWrap = $('customShiftOptions');
  customWrap.innerHTML = '';
  state.settings.customOptions.forEach(option => customWrap.appendChild(createShiftOptionButton(option)));
  $('customShiftSection').hidden = state.settings.customOptions.length === 0;
}

function createShiftOptionButton(meta) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `shift-option${state.draftShiftId === meta.id ? ' selected' : ''}`;
  button.dataset.shiftId = meta.id;
  button.style.setProperty('--option-color', meta.color || state.settings.accentColor);
  const details = [];
  const time = meta.timeText || normalizeTimeText(meta.start, meta.end);
  if (time) details.push(time);
  if (Number(meta.hours) > 0) details.push(formatHours(meta.hours));
  if (Number(meta.overtimeHours) > 0) details.push(`${NUMBER.format(meta.overtimeHours)} túlóra`);
  if (!details.length) details.push(meta.type === 'paid_leave' ? 'Fizetett távollét' : meta.type === 'sick' ? 'Betegnap' : meta.type === 'unpaid_leave' ? 'Fizetetlen' : 'Nincs munkavégzés');
  button.innerHTML = `<strong>${meta.label}</strong><span>${details.join(' · ')}</span>`;
  return button;
}

function saveDayEditor() {
  const key = state.selectedDate;
  if (!key) return;
  const eventTitle = $('dayEventTitle').value.trim();
  const note = $('dayNote').value.trim();
  const entry = {};
  if (state.draftShiftId) entry.shift = state.draftShiftId;
  const otRaw = $('dayOvertimeHours').value.trim();
  if (otRaw !== '') entry.overtimeHours = Math.max(0, Number(otRaw) || 0);
  if ((entry.overtimeHours || getMeta(entry.shift)?.overtimeHours) > 0) entry.overtimeType = $('dayOvertimeType').value;
  if (eventTitle) {
    entry.event = {
      title: eventTitle,
      type: $('dayEventType').value,
      start: $('dayEventStart').value,
      end: $('dayEventEnd').value,
      location: $('dayEventLocation').value.trim(),
      reminderMinutes: Number($('dayEventReminder').value) || 0
    };
  }
  if (note) entry.note = note;
  if (Object.keys(entry).length) state.entries[key] = entry;
  else delete state.entries[key];
  saveEntries();
  $('shiftDialog').close();
  renderAll();
  toast('Nap elmentve.');
}

function clearSelectedDay() {
  if (!state.selectedDate) return;
  if (!confirm('Biztosan törlöd ennek a napnak minden adatát?')) return;
  delete state.entries[state.selectedDate];
  saveEntries();
  $('shiftDialog').close();
  renderAll();
  toast('Nap törölve.');
}

function fillRotation() {
  const startKey = $('rotationStartDate').value;
  if (!startKey) return toast('Adj meg kezdő dátumot.');
  const startDate = startOfWeek(parseKey(startKey));
  const startShift = $('rotationStartShift').value;
  const weeks = Number($('rotationWeeks').value) || 12;
  const overwrite = $('rotationOverwrite').checked;
  const order = ['morning', 'afternoon', 'night'];
  const startIndex = order.indexOf(startShift);
  let changed = 0;
  for (let week = 0; week < weeks; week += 1) {
    const shift = order[(startIndex + week) % order.length];
    for (let weekday = 0; weekday < 5; weekday += 1) {
      const date = addDays(startDate, week * 7 + weekday);
      const key = toKey(date);
      if (!isBusinessDay(date)) continue;
      const current = getEntry(key);
      if (!overwrite && current.shift) continue;
      state.entries[key] = { ...current, shift };
      changed += 1;
    }
  }
  saveEntries();
  state.viewDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  renderAll();
  toast(`${changed} munkanap kitöltve.`);
}

function clearCurrentMonth() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  if (!confirm(`Biztosan törlöd ${MONTH_LONG.format(state.viewDate)} összes bejegyzését?`)) return;
  getMonthKeys(year, month).forEach(key => delete state.entries[key]);
  saveEntries();
  renderAll();
  toast('A hónap törölve.');
}

function swapDays() {
  const a = $('swapDateA').value;
  const b = $('swapDateB').value;
  if (!a || !b || a === b) return toast('Adj meg két különböző napot.');
  const entryA = state.entries[a] ? clone(state.entries[a]) : null;
  const entryB = state.entries[b] ? clone(state.entries[b]) : null;
  if (entryB) state.entries[a] = entryB; else delete state.entries[a];
  if (entryA) state.entries[b] = entryA; else delete state.entries[b];
  saveEntries();
  renderAll();
  toast('A két napot felcseréltem.');
}

function renderSalary() {
  const year = state.salaryDate.getFullYear();
  const month = state.salaryDate.getMonth();
  const calc = calculateSalary(year, month);
  const earned = calculateEarnedSoFar(year, month);
  const base = Number(state.settings.salary.baseMonthly) || 0;
  $('salaryMonthTitle').textContent = MONTH_LONG.format(state.salaryDate);
  $('grossSalary').textContent = formatMoney(calc.gross);
  $('netSalary').textContent = formatMoney(calc.net);
  $('earnedSoFar').textContent = formatMoney(earned.net);
  $('grossDelta').textContent = `Alapbéren felül: ${formatMoney(calc.gross - base)}`;
  $('netNote').textContent = state.settings.salary.under25Enabled ? '25 év alatti kedvezménnyel' : 'Normál SZJA-val';
  $('earnedProgress').textContent = calc.baseFactor > 0 ? `${Math.round(earned.baseFactor * 100)}% havi alapbér-időarány` : '—';

  const rows = [
    ['Havi alapbér', calc.base, ''],
    ['Fix havi bruttó bónusz', calc.fixedBonus, calc.fixedBonus >= 0 ? 'positive' : 'negative'],
    [`Délutáni pótlék (${state.settings.salary.afternoonPremium}%)`, calc.afternoonPremium, 'positive'],
    [`Éjszakai pótlék (${state.settings.salary.nightPremium}%)`, calc.nightPremium, 'positive'],
    [`Vasárnapi pótlék (${state.settings.salary.sundayPremium}%)`, calc.sundayPremium, 'positive'],
    [`Ünnepnapi pótlék (${state.settings.salary.holidayPremium}%)`, calc.holidayPremium, 'positive'],
    ['Túlóra alap + pótlék', calc.overtimePay, 'positive'],
    ['Fizetetlen távollét levonása', -calc.unpaidDeduction, 'negative'],
    ['Betegnap becsült csökkentése', -calc.sickReduction, 'negative'],
    ['Becsült bruttó', calc.gross, 'total'],
    [`SZJA (${state.settings.salary.taxRate}%)`, -calc.szja, 'negative'],
    [`TB-járulék (${state.settings.salary.socialRate}%)`, -calc.social, 'negative'],
    ['Egyéb nettó kedvezmény', calc.otherNetAllowance, 'positive'],
    ['Egyéb levonás', -calc.otherDeduction, 'negative'],
    ['Becsült nettó', calc.net, 'total']
  ];
  const breakdown = $('salaryBreakdown');
  breakdown.innerHTML = '';
  rows.forEach(([label, value, cls]) => {
    const row = document.createElement('div');
    row.className = `breakdown-row ${cls === 'total' ? 'total' : ''}`;
    const amountClass = cls === 'positive' ? 'positive' : cls === 'negative' ? 'negative' : '';
    row.innerHTML = `<span>${label}</span><strong class="${amountClass}">${value < 0 ? '−' : ''}${formatMoney(Math.abs(value))}</strong>`;
    breakdown.appendChild(row);
  });

  const savedActual = state.settings.actualNetByMonth[monthKey(year, month)];
  $('actualNetInput').value = Number.isFinite(Number(savedActual)) ? savedActual : '';
  updateActualDifference();
}

function updateActualDifference() {
  const year = state.salaryDate.getFullYear();
  const month = state.salaryDate.getMonth();
  const actualRaw = $('actualNetInput').value.trim();
  if (!actualRaw) {
    $('actualDifference').textContent = '—';
    return;
  }
  const diff = Number(actualRaw) - calculateSalary(year, month).net;
  $('actualDifference').textContent = `${diff >= 0 ? '+' : '−'}${formatMoney(Math.abs(diff))}`;
  $('actualDifference').style.color = diff >= 0 ? '#86efac' : '#fca5a5';
}

function saveActualNet() {
  const value = Number($('actualNetInput').value);
  if (!Number.isFinite(value) || value < 0) return toast('Adj meg érvényes nettó összeget.');
  state.settings.actualNetByMonth[monthKey(state.salaryDate.getFullYear(), state.salaryDate.getMonth())] = value;
  saveSettings();
  renderSalary();
  renderStats();
  toast('Tényleges fizetés elmentve.');
}

function clearActualNet() {
  delete state.settings.actualNetByMonth[monthKey(state.salaryDate.getFullYear(), state.salaryDate.getMonth())];
  saveSettings();
  renderSalary();
  renderStats();
  toast('Tényleges összeg törölve.');
}

function renderStats() {
  const year = state.statsYear;
  const annual = getAnnualStats(year);
  $('statsYearTitle').textContent = `${year}`;
  $('yearWorkDays').textContent = String(annual.workDays);
  $('yearWorkHours').textContent = formatHours(annual.workHours);
  $('yearOvertime').textContent = formatHours(annual.overtimeHours);
  $('yearVacation').textContent = `${annual.vacationDays} nap`;
  $('yearSick').textContent = `${annual.sickDays} nap`;
  $('yearNet').textContent = formatMoney(annual.estimatedNet);
  renderShiftDistribution(annual);
  renderHoursChart(annual);
  renderSalaryChart(annual);
  renderLeaveBalance(annual);
}

function renderShiftDistribution(annual) {
  const container = $('shiftDistribution');
  container.innerHTML = '';
  const entries = Object.entries(annual.shiftCounts)
    .map(([id, count]) => ({ meta: getMeta(id), count }))
    .filter(item => item.meta)
    .sort((a, b) => b.count - a.count);
  if (!entries.length) {
    container.innerHTML = '<p class="empty-state">Ebben az évben még nincs műszakadat.</p>';
    return;
  }
  entries.forEach(({ meta, count }) => {
    const item = document.createElement('article');
    item.className = 'distribution-item';
    item.style.borderTopColor = meta.color || state.settings.accentColor;
    item.innerHTML = `<span>${meta.label}</span><strong>${count} nap</strong>`;
    container.appendChild(item);
  });
}

function renderHoursChart(annual) {
  const max = Math.max(1, ...annual.months.map(item => item.stats.workHours));
  const chart = $('hoursChart');
  chart.innerHTML = '';
  annual.months.forEach((item, index) => {
    const column = document.createElement('div');
    column.className = 'bar-column';
    const height = item.stats.workHours / max * 100;
    column.innerHTML = `<span class="bar-value">${NUMBER.format(item.stats.workHours)}</span><div class="bar-track"><div class="bar-fill" style="height:${height}%"></div></div><span class="bar-label">${MONTHS_SHORT[index]}</span>`;
    chart.appendChild(column);
  });
}

function renderSalaryChart(annual) {
  const values = annual.months.flatMap(item => [item.salary.net, item.actual || 0]);
  const max = Math.max(1, ...values);
  const chart = $('salaryChart');
  chart.innerHTML = '';
  annual.months.forEach((item, index) => {
    const estimateHeight = item.salary.net / max * 100;
    const actualHeight = item.actual ? item.actual / max * 100 : 0;
    const column = document.createElement('div');
    column.className = 'bar-column';
    column.title = `Becsült: ${formatMoney(item.salary.net)}${item.actual ? ` · Tényleges: ${formatMoney(item.actual)}` : ''}`;
    column.innerHTML = `<span class="bar-value">${Math.round(item.salary.net / 1000)}e</span><div class="dual-bar-wrap"><div class="dual-bar" style="height:${estimateHeight}%"></div><div class="dual-bar actual" style="height:${actualHeight}%"></div></div><span class="bar-label">${MONTHS_SHORT[index]}</span>`;
    chart.appendChild(column);
  });
}

function renderLeaveBalance(annual) {
  const allowance = Number(state.settings.leave.annualAllowance) || 0;
  const carry = Number(state.settings.leave.carryOver) || 0;
  const total = allowance + carry;
  const used = annual.vacationDays;
  const left = Math.max(0, total - used);
  $('leaveBalanceTitle').textContent = `${left} nap maradt`;
  $('leaveBalanceDetail').textContent = `Keret: ${total} nap · Felhasználva: ${used} nap · Maradt: ${left} nap`;
  $('leaveProgress').style.width = `${total > 0 ? clamp(used / total * 100, 0, 100) : 0}%`;
}

function createIconDataUrl(text, background, foreground) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background || '#111827';
  ctx.fillRect(0, 0, 512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, 'rgba(255,255,255,.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  const cleaned = (text || 'RSRG').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const lines = cleaned.length > 9 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [cleaned];
  const longest = Math.max(...lines.map(line => line.length), 1);
  const fontSize = clamp(260 / Math.max(1, longest * .62), 42, lines.length > 1 ? 96 : 150);
  ctx.fillStyle = foreground || '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
  if (lines.length === 1) ctx.fillText(lines[0], 256, 256);
  else {
    const lineHeight = fontSize * 1.08;
    ctx.fillText(lines[0], 256, 256 - lineHeight / 2);
    ctx.fillText(lines[1], 256, 256 + lineHeight / 2);
  }
  return canvas.toDataURL('image/png');
}

function applyBranding() {
  const settings = state.settings;
  $('headerEyebrow').textContent = settings.eyebrow || DEFAULT_SETTINGS.eyebrow;
  $('headerTitle').textContent = settings.headerTitle || DEFAULT_SETTINGS.headerTitle;
  document.title = settings.headerTitle || DEFAULT_SETTINGS.headerTitle;
  $('appleAppTitle').content = settings.appName || DEFAULT_SETTINGS.appName;
  $('themeColorMeta').content = settings.iconBackground || DEFAULT_SETTINGS.iconBackground;
  document.documentElement.style.setProperty('--accent', settings.accentColor || DEFAULT_SETTINGS.accentColor);
  document.documentElement.style.setProperty('--accent-soft', `color-mix(in srgb, ${settings.accentColor || DEFAULT_SETTINGS.accentColor} 18%, transparent)`);
  applyTheme();
  const iconDataUrl = createIconDataUrl(settings.iconText, settings.iconBackground, settings.iconTextColor);
  $('iconPreview').src = iconDataUrl;
  $('favicon').href = iconDataUrl;
  $('appleTouchIcon').href = iconDataUrl;
  createDynamicManifest(iconDataUrl);
}

function applyTheme() {
  const theme = state.settings.theme || 'dark';
  const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
  document.body.dataset.theme = resolved;
}

function createDynamicManifest(iconDataUrl) {
  if (state.manifestUrl) URL.revokeObjectURL(state.manifestUrl);
  const manifest = {
    name: state.settings.headerTitle,
    short_name: state.settings.appName,
    description: 'RSRG műszaknaptár, fizetéskalkulátor és munkaidő-követő.',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: state.settings.iconBackground,
    theme_color: state.settings.iconBackground,
    lang: 'hu-HU',
    icons: [{ src: iconDataUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  state.manifestUrl = URL.createObjectURL(blob);
  $('manifestLink').href = state.manifestUrl;
}

function syncBrandingForm() {
  const s = state.settings;
  $('appNameInput').value = s.appName;
  $('iconTextInput').value = s.iconText;
  $('eyebrowInput').value = s.eyebrow;
  $('headerTitleInput').value = s.headerTitle;
  $('iconBgInput').value = s.iconBackground;
  $('iconTextColorInput').value = s.iconTextColor;
  $('accentColorInput').value = s.accentColor;
  $('themeInput').value = s.theme;
}

function previewBranding() {
  $('iconPreview').src = createIconDataUrl($('iconTextInput').value, $('iconBgInput').value, $('iconTextColorInput').value);
}

function saveBranding(event) {
  event.preventDefault();
  state.settings.appName = $('appNameInput').value.trim() || DEFAULT_SETTINGS.appName;
  state.settings.iconText = $('iconTextInput').value.trim() || DEFAULT_SETTINGS.iconText;
  state.settings.eyebrow = $('eyebrowInput').value.trim() || DEFAULT_SETTINGS.eyebrow;
  state.settings.headerTitle = $('headerTitleInput').value.trim() || DEFAULT_SETTINGS.headerTitle;
  state.settings.iconBackground = $('iconBgInput').value;
  state.settings.iconTextColor = $('iconTextColorInput').value;
  state.settings.accentColor = $('accentColorInput').value;
  state.settings.theme = $('themeInput').value;
  saveSettings();
  applyBranding();
  renderAll();
  toast('Megjelenés elmentve.');
}

function syncSalarySettingsForm() {
  const s = state.settings.salary;
  $('baseSalaryInput').value = s.baseMonthly;
  $('hourDivisorInput').value = s.hourDivisor;
  $('fixedBonusInput').value = s.fixedBonus;
  $('afternoonPremiumInput').value = s.afternoonPremium;
  $('nightPremiumInput').value = s.nightPremium;
  $('sundayPremiumInput').value = s.sundayPremium;
  $('holidayPremiumInput').value = s.holidayPremium;
  $('overtimePremiumInput').value = s.overtimePremium;
  $('restOvertimePremiumInput').value = s.restOvertimePremium;
  $('sickPercentInput').value = s.sickPercent;
  $('taxRateInput').value = s.taxRate;
  $('socialRateInput').value = s.socialRate;
  $('under25LimitInput').value = s.under25Limit;
  $('otherNetAllowanceInput').value = s.otherNetAllowance;
  $('otherDeductionInput').value = s.otherDeduction;
  $('paydayBusinessDayInput').value = String(s.paydayBusinessDay);
  $('under25EnabledInput').checked = Boolean(s.under25Enabled);
}

function saveSalarySettings(event) {
  event.preventDefault();
  state.settings.salary = {
    baseMonthly: numberValue('baseSalaryInput', 0),
    hourDivisor: numberValue('hourDivisorInput', 174),
    fixedBonus: numberValue('fixedBonusInput', 0),
    afternoonPremium: numberValue('afternoonPremiumInput', 0),
    nightPremium: numberValue('nightPremiumInput', 0),
    sundayPremium: numberValue('sundayPremiumInput', 0),
    holidayPremium: numberValue('holidayPremiumInput', 0),
    overtimePremium: numberValue('overtimePremiumInput', 0),
    restOvertimePremium: numberValue('restOvertimePremiumInput', 0),
    sickPercent: numberValue('sickPercentInput', 0),
    taxRate: numberValue('taxRateInput', 0),
    socialRate: numberValue('socialRateInput', 0),
    under25Enabled: $('under25EnabledInput').checked,
    under25Limit: numberValue('under25LimitInput', 0),
    otherNetAllowance: numberValue('otherNetAllowanceInput', 0),
    otherDeduction: numberValue('otherDeductionInput', 0),
    paydayBusinessDay: numberValue('paydayBusinessDayInput', 3)
  };
  saveSettings();
  renderAll();
  toast('Fizetési beállítások elmentve.');
}

function syncReminderSettingsForm() {
  $('annualLeaveInput').value = state.settings.leave.annualAllowance;
  $('carryLeaveInput').value = state.settings.leave.carryOver;
  $('shiftReminderMinutesInput').value = String(state.settings.reminders.shiftMinutes);
  $('shiftReminderEnabledInput').checked = Boolean(state.settings.reminders.shiftEnabled);
  $('paydayReminderEnabledInput').checked = Boolean(state.settings.reminders.paydayEnabled);
}

function saveReminderSettings(event) {
  event.preventDefault();
  state.settings.leave.annualAllowance = numberValue('annualLeaveInput', 0);
  state.settings.leave.carryOver = numberValue('carryLeaveInput', 0);
  state.settings.reminders.shiftMinutes = numberValue('shiftReminderMinutesInput', 120);
  state.settings.reminders.shiftEnabled = $('shiftReminderEnabledInput').checked;
  state.settings.reminders.paydayEnabled = $('paydayReminderEnabledInput').checked;
  saveSettings();
  renderAll();
  toast('Szabadság- és értesítési beállítások mentve.');
}

function renderSettingsLists() {
  renderCustomOptionList();
  renderSpecialDayList();
}

function updateCustomTypeFields() {
  const type = $('customType').value;
  const isWork = type === 'work';
  ['customStart', 'customEnd', 'customHours', 'customOvertimeHours'].forEach(id => $(id).disabled = !isWork);
  if (type === 'paid_leave' || type === 'sick') $('customPaidHours').value = $('customPaidHours').value || '8';
  if (type === 'unpaid_leave' || type === 'off') $('customPaidHours').value = '0';
}

function clearCustomForm() {
  $('customOptionForm').reset();
  $('customOptionId').value = '';
  $('customColor').value = '#8b5cf6';
  $('customPaidHours').value = '8';
  $('customOvertimeHours').value = '0';
  $('saveCustomOption').textContent = 'Saját opció hozzáadása';
  $('cancelCustomEdit').hidden = true;
  updateCustomTypeFields();
}

function saveCustomOption(event) {
  event.preventDefault();
  const id = $('customOptionId').value || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const type = $('customType').value;
  const label = $('customName').value.trim();
  if (!label) return;
  const start = type === 'work' ? $('customStart').value : '';
  const end = type === 'work' ? $('customEnd').value : '';
  const calculatedHours = durationBetween(start, end);
  const typedHours = $('customHours').value.trim() === '' ? NaN : Number($('customHours').value);
  const hours = type === 'work' ? (Number.isFinite(typedHours) ? typedHours : calculatedHours) : 0;
  if (type === 'work' && hours <= 0) return toast('Adj meg időt vagy ledolgozott órát.');
  const paidHours = (type === 'unpaid_leave' || type === 'off') ? 0 : numberValue('customPaidHours', type === 'work' ? hours : 8);
  const overtimeHours = type === 'work' ? numberValue('customOvertimeHours', 0) : 0;
  const option = {
    id,
    label,
    short: $('customShort').value.trim() || normalizeTimeText(start, end) || label.slice(0, 12).toUpperCase(),
    type,
    start,
    end,
    timeText: normalizeTimeText(start, end),
    hours,
    paidHours,
    overtimeHours,
    absenceHours: type === 'unpaid_leave' || type === 'sick' || type === 'paid_leave' ? 8 : 0,
    workDay: type === 'work',
    paidDay: type === 'work' || type === 'paid_leave' || type === 'sick',
    color: $('customColor').value
  };
  const index = state.settings.customOptions.findIndex(item => item.id === id);
  if (index >= 0) state.settings.customOptions[index] = option;
  else state.settings.customOptions.push(option);
  saveSettings();
  clearCustomForm();
  renderAll();
  toast(index >= 0 ? 'Saját opció frissítve.' : 'Saját opció hozzáadva.');
}

function renderCustomOptionList() {
  const list = $('customOptionList');
  if (!list) return;
  list.innerHTML = '';
  $('customOptionCount').textContent = `${state.settings.customOptions.length} db`;
  if (!state.settings.customOptions.length) {
    list.innerHTML = '<p class="empty-state">Még nincs saját műszakod vagy napopciód.</p>';
    return;
  }
  state.settings.customOptions.forEach(option => {
    const card = document.createElement('article');
    card.className = 'custom-option-card';
    card.style.borderLeftColor = option.color;
    const details = [option.timeText, option.hours ? formatHours(option.hours) : '', option.overtimeHours ? `${option.overtimeHours} túlóra` : ''].filter(Boolean).join(' · ');
    card.innerHTML = `<div><strong>${option.label}</strong><span>${details || option.type}</span></div><div class="custom-option-actions"><button class="mini-btn" type="button" data-edit-custom="${option.id}">Szerkesztés</button><button class="mini-btn delete-mini" type="button" data-delete-custom="${option.id}">Törlés</button></div>`;
    list.appendChild(card);
  });
}

function editCustomOption(id) {
  const option = state.settings.customOptions.find(item => item.id === id);
  if (!option) return;
  $('customOptionId').value = option.id;
  $('customName').value = option.label;
  $('customShort').value = option.short || '';
  $('customType').value = option.type || 'work';
  $('customColor').value = option.color || '#8b5cf6';
  $('customStart').value = option.start || '';
  $('customEnd').value = option.end || '';
  $('customHours').value = option.hours ?? '';
  $('customPaidHours').value = option.paidHours ?? 0;
  $('customOvertimeHours').value = option.overtimeHours ?? 0;
  $('saveCustomOption').textContent = 'Saját opció mentése';
  $('cancelCustomEdit').hidden = false;
  updateCustomTypeFields();
  $('customName').focus();
}

function deleteCustomOption(id) {
  const option = state.settings.customOptions.find(item => item.id === id);
  if (!option) return;
  const usage = Object.values(state.entries).filter(entry => entry.shift === id).length;
  if (!confirm(usage ? `Ez az opció ${usage} napon szerepel. Töröljem ezekről a napokról is?` : `Törlöd ezt: ${option.label}?`)) return;
  state.settings.customOptions = state.settings.customOptions.filter(item => item.id !== id);
  Object.keys(state.entries).forEach(key => {
    if (state.entries[key].shift === id) {
      const entry = { ...state.entries[key] };
      delete entry.shift;
      delete entry.overtimeHours;
      delete entry.overtimeType;
      if (Object.keys(entry).length) state.entries[key] = entry; else delete state.entries[key];
    }
  });
  saveSettings();
  saveEntries();
  renderAll();
  toast('Saját opció törölve.');
}

function saveSpecialDay(event) {
  event.preventDefault();
  const date = $('specialDayDate').value;
  if (!date) return;
  const item = { date, type: $('specialDayType').value, label: $('specialDayLabel').value.trim() || ($('specialDayType').value === 'working' ? 'Egyedi munkanap' : 'Egyedi pihenőnap') };
  state.settings.specialDays = state.settings.specialDays.filter(day => day.date !== date);
  state.settings.specialDays.push(item);
  state.settings.specialDays.sort((a, b) => a.date.localeCompare(b.date));
  saveSettings();
  $('specialDayForm').reset();
  renderAll();
  toast('Egyedi munkarendi nap elmentve.');
}

function renderSpecialDayList() {
  const list = $('specialDayList');
  if (!list) return;
  list.innerHTML = '';
  const official = Object.entries(OFFICIAL_SPECIAL_DAYS).map(([date, value]) => ({ date, ...value, official: true }));
  const all = [...official, ...state.settings.specialDays].sort((a, b) => a.date.localeCompare(b.date));
  if (!all.length) {
    list.innerHTML = '<p class="empty-state">Nincs egyedi munkarendi nap.</p>';
    return;
  }
  all.forEach(item => {
    const card = document.createElement('article');
    card.className = 'custom-option-card';
    card.style.borderLeftColor = item.type === 'working' ? '#f59e0b' : '#64748b';
    card.innerHTML = `<div><strong>${item.date} · ${item.label}</strong><span>${item.type === 'working' ? 'Munkanap' : 'Pihenőnap'}${item.official ? ' · 2026 hivatalos' : ''}</span></div>${item.official ? '' : `<button class="mini-btn delete-mini" type="button" data-delete-special="${item.date}">Törlés</button>`}`;
    list.appendChild(card);
  });
}

function deleteSpecialDay(date) {
  state.settings.specialDays = state.settings.specialDays.filter(item => item.date !== date);
  saveSettings();
  renderAll();
  toast('Egyedi nap törölve.');
}

function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function icsEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsDateTime(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`;
}

function icsDate(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function buildIcs(year, month = null) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RSRG Muszaknaptar V4//HU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const keys = Object.keys(state.entries).sort().filter(key => {
    const date = parseKey(key);
    return date.getFullYear() === year && (month === null || date.getMonth() === month);
  });
  keys.forEach(key => {
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    if (meta?.workDay && meta.start && meta.end) {
      const bounds = getShiftDateTimes(key, meta);
      lines.push('BEGIN:VEVENT', `UID:shift-${key}-${meta.id}@rsrg`, `DTSTAMP:${icsDateTime(new Date())}`, `DTSTART:${icsDateTime(bounds.start)}`, `DTEND:${icsDateTime(bounds.end)}`, `SUMMARY:${icsEscape(meta.label)} – ${icsEscape(meta.timeText || normalizeTimeText(meta.start, meta.end))}`, `DESCRIPTION:${icsEscape(entry.note || 'RSRG műszak')}`);
      if (state.settings.reminders.shiftEnabled) lines.push('BEGIN:VALARM', `TRIGGER:-PT${Number(state.settings.reminders.shiftMinutes) || 120}M`, 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(`${meta.label} műszak hamarosan`)}`, 'END:VALARM');
      lines.push('END:VEVENT');
    }
    if (entry.event?.title) {
      const base = parseKey(key);
      const startTime = entry.event.start || '09:00';
      const endTime = entry.event.end || startTime;
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm);
      const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em);
      if (end <= start) end.setHours(start.getHours() + 1);
      lines.push('BEGIN:VEVENT', `UID:event-${key}-${Math.abs(hashString(entry.event.title))}@rsrg`, `DTSTAMP:${icsDateTime(new Date())}`, `DTSTART:${icsDateTime(start)}`, `DTEND:${icsDateTime(end)}`, `SUMMARY:${icsEscape(entry.event.title)}`, `LOCATION:${icsEscape(entry.event.location || '')}`, `DESCRIPTION:${icsEscape(entry.note || '')}`);
      if (entry.event.reminderMinutes) lines.push('BEGIN:VALARM', `TRIGGER:-PT${entry.event.reminderMinutes}M`, 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(entry.event.title)}`, 'END:VALARM');
      lines.push('END:VEVENT');
    }
  });
  const months = month === null ? Array.from({ length: 12 }, (_, index) => index) : [month];
  months.forEach(m => {
    const payday = getPayday(year, m);
    lines.push('BEGIN:VEVENT', `UID:payday-${year}-${m + 1}@rsrg`, `DTSTAMP:${icsDateTime(new Date())}`, `DTSTART;VALUE=DATE:${icsDate(payday)}`, `SUMMARY:${icsEscape('Fizetésnap')}`);
    if (state.settings.reminders.paydayEnabled) lines.push('BEGIN:VALARM', 'TRIGGER:-PT8H', 'ACTION:DISPLAY', 'DESCRIPTION:Fizetésnap', 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function hashString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash) + text.charCodeAt(i) | 0;
  return hash;
}

function exportMonthIcs() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  downloadText(`RSRG-${year}-${String(month + 1).padStart(2, '0')}.ics`, buildIcs(year, month), 'text/calendar;charset=utf-8');
  toast('Havi iPhone naptárfájl elkészült.');
}

function exportYearIcs() {
  const year = state.viewDate.getFullYear();
  downloadText(`RSRG-${year}-teljes-ev.ics`, buildIcs(year, null), 'text/calendar;charset=utf-8');
  toast('Éves naptárfájl elkészült.');
}

function exportMonthCsv() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  const rows = [['Dátum', 'Nap', 'Műszak', 'Idő', 'Ledolgozott óra', 'Túlóra', 'Esemény', 'Megjegyzés']];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const key = toKey(date);
    const entry = getEntry(key);
    const meta = getMeta(entry.shift);
    rows.push([key, DATE_LONG.format(date).split(',')[0], meta?.label || '', meta ? normalizeTimeText(meta.start, meta.end) : '', meta?.hours || 0, entry.overtimeHours ?? meta?.overtimeHours ?? 0, entry.event?.title || '', entry.note || '']);
    date.setDate(date.getDate() + 1);
  }
  const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  downloadText(`RSRG-${year}-${String(month + 1).padStart(2, '0')}.csv`, csv, 'text/csv;charset=utf-8');
  toast('Havi CSV elkészült.');
}

function exportBackup() {
  const backup = { app: 'RSRG Műszaknaptár', version: APP_VERSION, exportedAt: new Date().toISOString(), entries: state.entries, settings: state.settings };
  downloadText(`RSRG-mentes-${toKey(new Date())}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
  toast('Biztonsági mentés elkészült.');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object' || !data.entries || !data.settings) throw new Error('Hibás mentés');
    if (!confirm('A visszatöltés felülírja a jelenlegi adatokat. Folytatod?')) return;
    state.entries = data.entries;
    state.settings = deepMerge(DEFAULT_SETTINGS, data.settings);
    saveEntries();
    saveSettings();
    syncAllSettingsForms();
    renderAll();
    toast('Mentés sikeresen visszatöltve.');
  } catch {
    alert('A fájl nem érvényes RSRG biztonsági mentés.');
  } finally {
    $('importBackupInput').value = '';
  }
}

function resetAllData() {
  if (!confirm('Ez minden műszakot, eseményt és beállítást végleg töröl. Biztos vagy benne?')) return;
  if (!confirm('Utolsó megerősítés: valóban mindent töröljek?')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
  state.entries = {};
  state.settings = clone(DEFAULT_SETTINGS);
  syncAllSettingsForms();
  renderAll();
  toast('Minden adat törölve.');
}

function updateNotificationStatus() {
  const supported = 'Notification' in window;
  const status = supported ? Notification.permission : 'nem támogatott';
  $('notificationStatus').textContent = `Értesítési állapot: ${status === 'granted' ? 'engedélyezve' : status === 'denied' ? 'letiltva' : status === 'default' ? 'nincs engedélyezve' : status}`;
  $('testNotificationBtn').disabled = !supported || Notification.permission !== 'granted';
}

async function requestNotifications() {
  if (!('Notification' in window)) return toast('Ez a böngésző nem támogatja az értesítést.');
  const permission = await Notification.requestPermission();
  updateNotificationStatus();
  toast(permission === 'granted' ? 'Értesítések engedélyezve.' : 'Az értesítés nincs engedélyezve.');
}

async function showNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const notificationOptions = { icon: './icon-192.png', badge: './icon-192.png', ...options };
  if (state.swRegistration?.showNotification) await state.swRegistration.showNotification(title, notificationOptions);
  else new Notification(title, notificationOptions);
  return true;
}

function getSentNotifications() {
  const data = loadJson(SENT_NOTIFICATIONS_KEY, {});
  const cutoff = Date.now() - 45 * 86400000;
  Object.keys(data).forEach(key => { if (data[key] < cutoff) delete data[key]; });
  return data;
}

function markNotificationSent(id, sent) {
  sent[id] = Date.now();
  localStorage.setItem(SENT_NOTIFICATIONS_KEY, JSON.stringify(sent));
}

async function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const sent = getSentNotifications();

  if (state.settings.reminders.shiftEnabled) {
    const next = findNextShift(now);
    if (next && !next.active) {
      const lead = (Number(state.settings.reminders.shiftMinutes) || 120) * 60000;
      const diff = next.start - now;
      const id = `shift-${next.key}-${next.meta.id}-${lead}`;
      if (diff >= 0 && diff <= lead && !sent[id]) {
        await showNotification(`${next.meta.label} műszak hamarosan`, { body: `${DATE_MEDIUM.format(next.start)} · ${normalizeTimeText(next.meta.start, next.meta.end)}`, tag: id });
        markNotificationSent(id, sent);
      }
    }
  }

  if (state.settings.reminders.paydayEnabled) {
    const payday = getPayday(now.getFullYear(), now.getMonth());
    const id = `payday-${toKey(payday)}`;
    if (toKey(payday) === toKey(now) && !sent[id]) {
      await showNotification('Fizetésnap', { body: 'Ma van a hónap beállított fizetési napja.', tag: id });
      markNotificationSent(id, sent);
    }
  }

  Object.keys(state.entries).sort().forEach(async key => {
    const event = state.entries[key]?.event;
    if (!event?.title || !event.start || !event.reminderMinutes) return;
    const base = parseKey(key);
    const [h, m] = event.start.split(':').map(Number);
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    const lead = Number(event.reminderMinutes) * 60000;
    const diff = start - now;
    const id = `event-${key}-${hashString(event.title)}-${lead}`;
    if (diff >= 0 && diff <= lead && !sent[id]) {
      await showNotification(event.title, { body: event.location || `${event.start}-kor kezdődik`, tag: id });
      markNotificationSent(id, sent);
    }
  });
}

function syncAllSettingsForms() {
  syncBrandingForm();
  syncSalarySettingsForm();
  syncReminderSettingsForm();
}

function bindEvents() {
  $$('.tab-btn').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
  $('settingsShortcut').addEventListener('click', () => switchTab('settingsTab'));
  $('todayBtn').addEventListener('click', () => {
    state.viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    switchTab('calendarTab');
  });
  $('openCalendarFromHome').addEventListener('click', () => switchTab('calendarTab'));
  $('quickTodayEdit').addEventListener('click', () => openDayEditor(toKey(new Date())));
  $('quickRotation').addEventListener('click', () => switchTab('calendarTab'));
  $('quickSalary').addEventListener('click', () => switchTab('salaryTab'));
  $('quickExportIcs').addEventListener('click', exportMonthIcs);
  $('openNextShiftDay').addEventListener('click', event => openDayEditor(event.currentTarget.dataset.date));
  $('upcomingList').addEventListener('click', event => {
    const item = event.target.closest('[data-date]');
    if (item) openDayEditor(item.dataset.date);
  });

  $('prevMonth').addEventListener('click', () => { state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1); renderCalendar(); });
  $('nextMonth').addEventListener('click', () => { state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1); renderCalendar(); });
  $('calendar').addEventListener('click', event => {
    const cell = event.target.closest('[data-date]');
    if (cell) openDayEditor(cell.dataset.date);
  });
  $('builtInShiftOptions').addEventListener('click', handleShiftOptionClick);
  $('customShiftOptions').addEventListener('click', handleShiftOptionClick);
  $('saveDayBtn').addEventListener('click', saveDayEditor);
  $('clearDayBtn').addEventListener('click', clearSelectedDay);
  $('fillRotation').addEventListener('click', fillRotation);
  $('clearMonth').addEventListener('click', clearCurrentMonth);
  $('swapDaysBtn').addEventListener('click', swapDays);
  $('exportMonthIcs').addEventListener('click', exportMonthIcs);
  $('exportYearIcs').addEventListener('click', exportYearIcs);
  $('exportMonthCsv').addEventListener('click', exportMonthCsv);

  $('salaryPrevMonth').addEventListener('click', () => { state.salaryDate = new Date(state.salaryDate.getFullYear(), state.salaryDate.getMonth() - 1, 1); renderSalary(); });
  $('salaryNextMonth').addEventListener('click', () => { state.salaryDate = new Date(state.salaryDate.getFullYear(), state.salaryDate.getMonth() + 1, 1); renderSalary(); });
  $('actualNetInput').addEventListener('input', updateActualDifference);
  $('saveActualNet').addEventListener('click', saveActualNet);
  $('clearActualNet').addEventListener('click', clearActualNet);
  $('openSalarySettings').addEventListener('click', () => { switchTab('settingsTab'); $('salarySettingsCard').open = true; $('salarySettingsCard').scrollIntoView({ behavior: 'smooth' }); });

  $('statsPrevYear').addEventListener('click', () => { state.statsYear -= 1; renderStats(); });
  $('statsNextYear').addEventListener('click', () => { state.statsYear += 1; renderStats(); });

  $('brandingForm').addEventListener('submit', saveBranding);
  ['iconTextInput', 'iconBgInput', 'iconTextColorInput'].forEach(id => $(id).addEventListener('input', previewBranding));
  $('resetBranding').addEventListener('click', () => {
    Object.assign(state.settings, {
      appName: DEFAULT_SETTINGS.appName, iconText: DEFAULT_SETTINGS.iconText, eyebrow: DEFAULT_SETTINGS.eyebrow,
      headerTitle: DEFAULT_SETTINGS.headerTitle, iconBackground: DEFAULT_SETTINGS.iconBackground,
      iconTextColor: DEFAULT_SETTINGS.iconTextColor, accentColor: DEFAULT_SETTINGS.accentColor, theme: DEFAULT_SETTINGS.theme
    });
    saveSettings(); syncBrandingForm(); renderAll(); toast('Megjelenés visszaállítva.');
  });
  $('salarySettingsForm').addEventListener('submit', saveSalarySettings);
  $('resetSalarySettings').addEventListener('click', () => { state.settings.salary = clone(DEFAULT_SETTINGS.salary); saveSettings(); syncSalarySettingsForm(); renderAll(); toast('Fizetési alapértékek visszaállítva.'); });
  $('reminderSettingsForm').addEventListener('submit', saveReminderSettings);
  $('requestNotificationsBtn').addEventListener('click', requestNotifications);
  $('testNotificationBtn').addEventListener('click', () => showNotification('RSRG tesztértesítés', { body: 'Az értesítések működnek.' }));

  $('customType').addEventListener('change', updateCustomTypeFields);
  $('customOptionForm').addEventListener('submit', saveCustomOption);
  $('cancelCustomEdit').addEventListener('click', clearCustomForm);
  $('customOptionList').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-custom]');
    const del = event.target.closest('[data-delete-custom]');
    if (edit) editCustomOption(edit.dataset.editCustom);
    if (del) deleteCustomOption(del.dataset.deleteCustom);
  });
  $('specialDayForm').addEventListener('submit', saveSpecialDay);
  $('specialDayList').addEventListener('click', event => {
    const del = event.target.closest('[data-delete-special]');
    if (del) deleteSpecialDay(del.dataset.deleteSpecial);
  });

  $('exportBackupBtn').addEventListener('click', exportBackup);
  $('importBackupInput').addEventListener('change', event => { if (event.target.files[0]) importBackup(event.target.files[0]); });
  $('resetAllBtn').addEventListener('click', resetAllData);
  $('forceUpdateBtn').addEventListener('click', forceUpdate);
  $('reloadAppBtn').addEventListener('click', () => window.location.reload());

  if (window.matchMedia) matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => { if (state.settings.theme === 'system') applyTheme(); });
}

function handleShiftOptionClick(event) {
  const button = event.target.closest('[data-shift-id]');
  if (!button) return;
  state.draftShiftId = button.dataset.shiftId === '__none__' ? '' : button.dataset.shiftId;
  renderDayShiftOptions();
  const meta = getMeta(state.draftShiftId);
  if (meta && $('dayOvertimeHours').value === '') $('dayOvertimeHours').placeholder = meta.overtimeHours ? String(meta.overtimeHours) : 'Automatikus';
}

async function forceUpdate() {
  if (!state.swRegistration) return window.location.reload();
  await state.swRegistration.update();
  if (state.swRegistration.waiting) state.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  toast('Frissítés ellenőrizve.');
  setTimeout(() => window.location.reload(), 800);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js?v=4.0.0');
    state.swRegistration = registration;
    registration.update();
    if (registration.waiting) $('updateBanner').hidden = false;
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) $('updateBanner').hidden = false;
      });
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  } catch (error) {
    console.warn('Service worker hiba:', error);
  }
}

function init() {
  $('rotationStartDate').value = toKey(startOfWeek(new Date()));
  $('swapDateA').value = toKey(new Date());
  $('swapDateB').value = toKey(addDays(new Date(), 1));
  syncAllSettingsForms();
  clearCustomForm();
  bindEvents();
  renderAll();
  registerServiceWorker();
  updateCountdown();
  checkReminders();
  setInterval(updateCountdown, 30000);
  setInterval(checkReminders, 60000);
}

init();
