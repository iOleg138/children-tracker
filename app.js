// ============================================================
// CHILDREN TRACKER — вся логика
// ============================================================

const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbwY0Y4t7ALcGFKVXddVHHkMjtXEwoOpoNLNgZwqrHD9fYbqU0Fdy9Xg4WpLUo1s0N7J/exec",
  parentPassword: "ulyana2024",

  baseDay: 21,
  floor: -15,
  goalPoints: 300,
  periodDays: 14,

  levels: [
    { name: "Новичок",        emoji: "🌱" },
    { name: "Ученица",        emoji: "🌿" },
    { name: "Помощница",      emoji: "🌳" },
    { name: "Организованная", emoji: "⭐" },
    { name: "Мастер",         emoji: "🏆" }
  ],

  goalEmojis: ["🎒","🚶","🚲","🛴","🚪","🐱","🐶","🐹","🐰","🌱","🎮","🎨","🎬","🎢","🎠","🏕️","🎡","🏖️","🎪","🏆","⭐","🎁","🎯"],

  defaultMetrics: [
    { id: "n1",  icon: "🤥", text: "Соврала",                                  points: -10 },
    { id: "n2",  icon: "🔥", text: "Оставила плиту/чайник включённой",          points: -5  },
    { id: "n3",  icon: "🔑", text: "Ключи в неположенном месте",                points: -6  },
    { id: "n4",  icon: "📵", text: "Не предупредила о приходе",                 points: -6  },
    { id: "n5",  icon: "🥊", text: "Драка с сестрой",                          points: -5  },
    { id: "n6",  icon: "🗣️", text: "Крики/грубость с сестрой",                 points: -4  },
    { id: "n7",  icon: "😤", text: "Спор с родителями",                        points: -5  },
    { id: "n8",  icon: "🚫", text: "Отказ помочь по просьбе",                  points: -3  },
    { id: "n9",  icon: "🎒", text: "Рюкзак не собран с вечера",                points: -3  },
    { id: "n10", icon: "📚", text: "Не сделала уроки",                         points: -4  },
    { id: "n11", icon: "🧸", text: "Потеряла вещь",                            points: -3  },
    { id: "n12", icon: "🚿", text: "Не подмылась / не сменила трусики",        points: -2  },
    { id: "n13", icon: "🏃", text: "Опоздала / выбежала в спешке",              points: -3  },
    { id: "n14", icon: "🍽️", text: "Посуда не убрана",                         points: -3  },
    { id: "n15", icon: "🚰", text: "Кран не закрыт",                           points: -3  },
    { id: "n16", icon: "👖", text: "Вещи на полу или стуле",                   points: -3  },
    { id: "n17", icon: "💡", text: "Свет оставлен включённым",                 points: -3  },
    { id: "n18", icon: "🧹", text: "Не выполнила обязанность по дому",         points: -2  },
    { id: "n19", icon: "😴", text: "Легла спать позже на час",                 points: -2  },
    { id: "n20", icon: "🗑️", text: "Мусор не выброшен",                       points: -3  },
    { id: "n21", icon: "🦷", text: "Не почистила зубы",                        points: -2  },
    { id: "n22", icon: "🧦", text: "Грязные носки спрятаны по углам",          points: -3  },
    { id: "n23", icon: "🧺", text: "Чистые вещи не разобраны",                 points: -2  },
    { id: "n24", icon: "📖", text: "Учебники не на месте",                     points: -2  },
    { id: "n25", icon: "🍽️", text: "Не помыла руки перед едой",                points: -2  },
    { id: "n26", icon: "🛏️", text: "Не убрала постель",                       points: -3  },
    { id: "n27", icon: "🧽", text: "Стол не вытерт",                           points: -2  },
    { id: "n28", icon: "👟", text: "Обувь не на месте",                        points: -2  },
    { id: "n29", icon: "🧴", text: "Не расчесалась",                           points: -1  },
    { id: "n30", icon: "📱", text: "Телефон без разрешения",                    points: -3  },
    { id: "n31", icon: "📱", text: "Продление телефона на 1 час",               points: -1  }
  ]
};

// ============================================================
// УТИЛИТЫ
// ============================================================
const U = {
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  },

  addDays(dateStr, days) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  },

  cleanDate(str) {
    if (!str) return "";
    if (str.includes("T")) return str.slice(0, 10);
    return String(str);
  },

  formatFull(dateStr) {
    const s = this.cleanDate(dateStr);
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${Number(d)} ${months[Number(m)-1]} ${y}`;
  },

  formatHuman(dateStr) {
    const s = this.cleanDate(dateStr);
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    const months = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
    return `${Number(d)} ${months[Number(m)-1]}`;
  },

  dayNum(dateStr) {
    return Number(this.cleanDate(dateStr).slice(8, 10));
  },

  monthName() {
    const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    return months[new Date().getMonth()] + " " + new Date().getFullYear();
  },

  getLevels(goalPoints) {
    const step = goalPoints / CONFIG.levels.length;
    return CONFIG.levels.map((l, i) => ({
      index: i,
      min: Math.round(i * step),
      max: Math.round((i + 1) * step) - 1,
      name: l.name,
      emoji: l.emoji
    }));
  },

  currentLevel(points, goalPoints) {
    const levels = this.getLevels(goalPoints);
    for (const lvl of levels) {
      if (points >= lvl.min && points <= lvl.max) return lvl;
    }
    return levels[levels.length - 1];
  }
};

// ============================================================
// API
// ============================================================
const API = {
  data: { children: [], periods: [], metrics: [], days: [], bonuses: [] },

  async load() {
    const res = await fetch(CONFIG.apiUrl + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    this.data = json;
    return json;
  },

  async save(sheet, data) {
    const res = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "save", sheet, data })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Save failed");
    return json;
  },

  async remove(sheet, key, value) {
    const res = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "delete", sheet, key, value })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Delete failed");
    return json;
  }
};

// ============================================================
// МОДАЛКА
// ============================================================
const Modal = {
  _resolve: null,

  open({ title, bodyHtml, actions }) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").innerHTML = bodyHtml;
    const actionsEl = document.getElementById("modalActions");
    actionsEl.innerHTML = "";
    actions.forEach(a => {
      const btn = document.createElement("button");
      btn.className = a.className || "btn-secondary";
      btn.textContent = a.label;
      btn.onclick = () => {
        if (a.onClick) {
          const r = a.onClick();
          if (r === false) return;
        }
        this.close();
      };
      actionsEl.appendChild(btn);
    });
    document.getElementById("modal").classList.remove("hidden");
  },

  close() {
    document.getElementById("modal").classList.add("hidden");
    this._resolve = null;
  },

  confirm(title, message, okLabel = "OK", danger = false) {
    return new Promise(resolve => {
      this._resolve = resolve;
      this.open({
        title,
        bodyHtml: `<p>${message}</p>`,
        actions: [
          { label: "Отмена", className: "btn-secondary", onClick: () => { resolve(false); return true; } },
          { label: okLabel, className: danger ? "btn-danger" : "btn-primary", onClick: () => { resolve(true); return true; } }
        ]
      });
    });
  },

  form(title, fields, submitLabel = "Сохранить") {
    return new Promise(resolve => {
      this._resolve = resolve;

      const formHtml = fields.map(f => {
        let input;
        if (f.type === "select") {
          input = `<select name="${f.name}" class="field-input">
            ${f.options.map(o => `<option value="${o.value}" ${String(o.value) === String(f.value) ? "selected" : ""}>${o.label}</option>`).join("")}
          </select>`;
        } else if (f.type === "textarea") {
          input = `<textarea name="${f.name}" rows="3" class="field-input">${f.value || ""}</textarea>`;
        } else {
          input = `<input type="${f.type || "text"}" name="${f.name}" value="${f.value ?? ""}" placeholder="${f.placeholder || ""}" class="field-input" ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""}>`;
        }
        return `<div class="field"><label>${f.label}</label>${input}</div>`;
      }).join("");

      this.open({
        title,
        bodyHtml: `<form id="modalForm">${formHtml}</form>`,
        actions: [
          { label: "Отмена", className: "btn-secondary", onClick: () => { resolve(null); return true; } },
          {
            label: submitLabel,
            className: "btn-primary",
            onClick: () => {
              const form = document.getElementById("modalForm");
              const data = {};
              fields.forEach(f => {
                const el = form.querySelector(`[name="${f.name}"]`);
                let val = el.value;
                if (f.type === "number") val = Number(val);
                data[f.name] = val;
              });
              resolve(data);
              return true;
            }
          }
        ]
      });
    });
  }
};

// ============================================================
// TOAST
// ============================================================
const Toast = {
  _t: null,
  show(msg, type = "info", duration = 2500) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast toast--" + type;
    el.classList.remove("hidden");
    clearTimeout(this._t);
    this._t = setTimeout(() => el.classList.add("hidden"), duration);
  },
  success(m) { this.show(m, "success"); },
  error(m) { this.show(m, "error", 4000); },
  info(m) { this.show(m, "info"); }
};

// ============================================================
// СОСТОЯНИЕ
// ============================================================
const State = {
  childId: null,
  date: null,
  tab: "mark",

  // Текущий ребёнок
  get child() {
    return API.data.children.find(c => c.id === this.childId && c.active) || null;
  },

  // Активный период текущего ребёнка
  get period() {
    const child = this.child;
    if (!child || !child.activePeriodId) return null;
    return API.data.periods.find(p => p.id === child.activePeriodId && p.childId === child.id) || null;
  },

  // Все периоды текущего ребёнка
  get allPeriods() {
    return API.data.periods.filter(p => p.childId === this.childId);
  },

  // Метрики текущего периода
  get metrics() {
    const period = this.period;
    if (!period) return [];
    return API.data.metrics
      .filter(m => m.childId === this.childId && m.periodId === period.id && m.active)
      .sort((a, b) => (a.points - b.points) || a.text.localeCompare(b.text));
  },

  // Все дни текущего периода
  get days() {
    const period = this.period;
    if (!period) return [];
    return API.data.days.filter(d => d.childId === this.childId && d.periodId === period.id);
  },

  // Итог за период
  get total() {
    return this.days.reduce((s, d) => s + (d.dayTotal || 0), 0);
  },

  // День по текущей дате
  get currentDay() {
    const period = this.period;
    if (!period) return null;
    const cleanDate = U.cleanDate(this.date);
    return API.data.days.find(d =>
      d.childId === this.childId &&
      d.periodId === period.id &&
      U.cleanDate(d.date) === cleanDate
    ) || null;
  },

  // Инициализация
  init() {
    const params = new URLSearchParams(location.search);
    const urlChild = params.get("child");
    const children = API.data.children.filter(c => c.active);

    if (urlChild && children.some(c => c.id === urlChild)) {
      this.childId = urlChild;
    } else if (children.length > 0) {
      this.childId = children[0].id;
    }

    this.date = U.today();
  },

  setChild(id) {
    this.childId = id;
    const child = this.child;
    // Если сегодня вне периода — ставим дату начала периода
    if (child && child.activePeriodId) {
      const period = API.data.periods.find(p => p.id === child.activePeriodId);
      if (period) {
        const today = U.today();
        const start = U.cleanDate(period.startDate);
        const end = U.cleanDate(period.endDate);
        if (today < start) this.date = start;
        else if (today > end) this.date = end;
        else this.date = today;
      }
    }
  }
};

// ============================================================
// РОДИТЕЛЬСКИЙ ИНТЕРФЕЙС
// ============================================================
const Parent = {

  async start() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("parentApp").classList.remove("hidden");
    State.init();
    this.renderAll();
  },

  logout() {
    sessionStorage.removeItem("auth");
    location.reload();
  },

  // ============================================================
  // ГЛАВНЫЙ РЕНДЕР
  // ============================================================
  renderAll() {
    this.renderChildSelector();
    this.renderTabs();
    this.renderTabContent();
    this.updateBadges();
  },

  renderChildSelector() {
    const el = document.getElementById("childSelector");
    const children = API.data.children.filter(c => c.active);

    if (children.length === 0) {
      el.innerHTML = `<span class="muted text-sm">Нет детей</span>`;
      return;
    }

    el.innerHTML = "";
    children.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "child-btn" + (c.id === State.childId ? " active" : "");
      btn.textContent = c.name;
      btn.onclick = () => {
        State.setChild(c.id);
        this.renderAll();
      };
      el.appendChild(btn);
    });
  },

  renderTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === State.tab);
      tab.onclick = () => {
        State.tab = tab.dataset.tab;
        this.renderAll();
      };
    });
  },

  renderTabContent() {
    const el = document.getElementById("tabContent");
    const fn = {
      mark: () => this.renderMark(el),
      bonuses: () => this.renderBonuses(el),
      settings: () => this.renderSettings(el),
      archive: () => this.renderArchive(el),
      analytics: () => this.renderAnalytics(el)
    }[State.tab];
    if (fn) fn();
  },

  updateBadges() {
    const badge = document.getElementById("bonusBadge");
    const count = API.data.bonuses.filter(b => b.status === "pending").length;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  },

  // ============================================================
  // ОТМЕТКИ
  // ============================================================
  renderMark(el) {
    const child = State.child;
    const period = State.period;

    if (!child) {
      el.innerHTML = `<div class="card"><p class="muted">Добавь ребёнка в настройках.</p></div>`;
      return;
    }

    if (!period) {
      el.innerHTML = `<div class="card">
        <p class="muted">У ${child.name} нет активного периода.</p>
        <p class="muted mt">Создай период в настройках и активируй его.</p>
      </div>`;
      return;
    }

    el.innerHTML = `
      <div class="calendar-strip" id="calStrip"></div>
      <div class="card">
        <h2>❌ Штрафы — ${U.formatFull(State.date)}</h2>
        <div id="metricsList"></div>
      </div>
      <div class="card">
        <h3>➕ Прочие штрафы</h3>
        <div id="extrasList"></div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <input type="text" id="extraText" placeholder="Что случилось?">
          <input type="number" id="extraPoints" value="-2" min="-20" max="-1" style="max-width:90px;">
          <button class="btn-danger btn-sm" id="addExtraBtn">−</button>
        </div>
      </div>
      <div class="summary">
        <div class="summary__numbers">
          <span class="summary__base">${child.baseDay}</span>
          <span class="summary__pen" id="sumPen">0</span>
          <span class="summary__bon" id="sumBon">+0</span>
          <span>=</span>
          <span class="summary__total" id="sumTotal">${child.baseDay}</span>
        </div>
        <div class="summary__actions">
          <button class="btn-secondary" id="saveDayBtn">Сохранить</button>
          <button class="btn-primary" id="closeDayBtn">Закрыть день</button>
        </div>
      </div>
    `;

    this.renderCalendar();
    this.renderMetrics();
    this.renderExtras();
    this.updateSummary();

    document.getElementById("addExtraBtn").onclick = () => this.addExtra();
    document.getElementById("saveDayBtn").onclick = () => this.saveDay(false);
    document.getElementById("closeDayBtn").onclick = () => this.saveDay(true);
  },

  renderCalendar() {
    const el = document.getElementById("calStrip");
    const period = State.period;
    const days = State.days;

    const start = U.cleanDate(period.startDate);
    const end = U.cleanDate(period.endDate);

    el.innerHTML = "";
    let date = start;
    while (date <= end) {
      const d = days.find(x => U.cleanDate(x.date) === date);
      const cell = document.createElement("div");
      cell.className = "cal-day";
      if (date === U.cleanDate(State.date)) cell.classList.add("selected");
      if (date === U.today()) cell.classList.add("today");

      let dot = "";
      if (d && d.closed) dot = (d.dayTotal >= 15) ? "green" : "yellow";
      else if (d) dot = "gray";

      cell.innerHTML = `
        <div class="cal-day__num">${U.dayNum(date)}</div>
        <div class="cal-day__dot ${dot}"></div>
      `;
      cell.onclick = () => {
        State.date = date;
        this.renderTabContent();
      };
      el.appendChild(cell);
      date = U.addDays(date, 1);
    }
  },

  renderMetrics() {
    const el = document.getElementById("metricsList");
    const metrics = State.metrics;
    const day = this.getCurrentDay();

    const sorted = [...metrics].sort((a, b) => {
      const aSel = day.penaltyIds.includes(a.id) ? 1 : 0;
      const bSel = day.penaltyIds.includes(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      return 0;
    });

    el.innerHTML = "";
    sorted.forEach(m => {
      const tile = document.createElement("div");
      tile.className = "metric" + (day.penaltyIds.includes(m.id) ? " selected" : "");
      tile.innerHTML = `
        <span class="metric__icon">${m.icon}</span>
        <span class="metric__text">${m.text}</span>
        <span class="metric__points">${m.points}</span>
      `;
      tile.onclick = () => this.togglePenalty(m.id);
      el.appendChild(tile);
    });
  },

  getCurrentDay() {
    const existing = State.currentDay;
    if (existing) {
      return {
        childId: existing.childId,
        periodId: existing.periodId,
        date: U.cleanDate(existing.date),
        penaltyIds: existing.penaltyIds || [],
        extras: existing.extras || [],
        bonuses: existing.bonuses || [],
        dayTotal: existing.dayTotal || 0,
        closed: existing.closed || false
      };
    }
    return {
      childId: State.childId,
      periodId: State.period.id,
      date: U.cleanDate(State.date),
      penaltyIds: [],
      extras: [],
      bonuses: [],
      dayTotal: State.child.baseDay,
      closed: false
    };
  },

  togglePenalty(id) {
    const day = this.getCurrentDay();
    const idx = day.penaltyIds.indexOf(id);
    if (idx >= 0) day.penaltyIds.splice(idx, 1);
    else day.penaltyIds.push(id);
    this._localDay = day;
    this.renderMetrics();
    this.updateSummary();
  },

  get _dayForUI() {
    return this._localDay && this._localDay.date === U.cleanDate(State.date) ? this._localDay : this.getCurrentDay();
  },

  addExtra() {
    const text = document.getElementById("extraText").value.trim();
    const points = Number(document.getElementById("extraPoints").value);
    if (!text || !points) return;
    const day = this.getCurrentDay();
    day.extras.push({ text, points });
    this._localDay = day;
    document.getElementById("extraText").value = "";
    this.renderExtras();
    this.updateSummary();
  },

  renderExtras() {
    const el = document.getElementById("extrasList");
    const day = this.getCurrentDay();
    el.innerHTML = "";
    day.extras.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <div class="list-item__info">${item.text}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="metric__points" style="background:#fed7d7;color:#742a2a;">${item.points}</span>
          <button class="btn-secondary btn-sm" data-idx="${i}">×</button>
        </div>
      `;
      row.querySelector("button").onclick = () => {
        day.extras.splice(i, 1);
        this._localDay = day;
        this.renderExtras();
        this.updateSummary();
      };
      el.appendChild(row);
    });
  },

  updateSummary() {
    const day = this.getCurrentDay();
    const child = State.child;
    const metrics = State.metrics;

    let pen = 0;
    day.penaltyIds.forEach(id => {
      const m = metrics.find(x => x.id === id);
      if (m) pen += m.points;
    });
    day.extras.forEach(e => pen += e.points);

    let bon = 0;
    (day.bonuses || []).forEach(b => bon += b.points);

    let total = child.baseDay + pen + bon;
    if (total < child.floor) total = child.floor;

    day.dayTotal = total;
    this._localDay = day;

    document.getElementById("sumPen").textContent = pen;
    document.getElementById("sumBon").textContent = (bon >= 0 ? "+" : "") + bon;
    document.getElementById("sumTotal").textContent = total;
  },

  async saveDay(close) {
    const day = this.getCurrentDay();
    if (close) day.closed = true;
    this.updateSummary();
    try {
      await API.save("days", day);
      await API.load();
      this._localDay = null;
      Toast.success(close ? "День закрыт!" : "Сохранено");
      this.renderAll();
    } catch (e) {
      Toast.error("Ошибка: " + e.message);
    }
  },

  // ============================================================
  // ПРЕДЛОЖЕНИЯ
  // ============================================================
  renderBonuses(el) {
    const bonuses = [...API.data.bonuses].sort((a, b) =>
      (b.date || "").localeCompare(a.date || "")
    );

    if (bonuses.length === 0) {
      el.innerHTML = `<div class="card"><h2>💡 Предложения</h2><p class="muted">Пока нет предложений.</p></div>`;
      return;
    }

    el.innerHTML = `<div class="card"><h2>💡 Предложения</h2><div id="bonusList"></div></div>`;
    const list = document.getElementById("bonusList");

    bonuses.forEach(b => {
      const child = API.data.children.find(c => c.id === b.childId);
      const card = document.createElement("div");
      card.className = "bonus-card " + b.status;

      const statusLabel = {
        pending: "На рассмотрении",
        approved: `Принято +${b.approved}`,
        rejected: "Отклонено",
        postponed: "Отложено"
      }[b.status] || b.status;

      card.innerHTML = `
        <div class="bonus-card__head">
          <div>
            <div class="text-sm muted">👧 ${child ? child.name : b.childId}</div>
            <div class="text-sm muted">${U.formatHuman(b.date)}</div>
          </div>
          <span class="bonus-card__status ${b.status}">${statusLabel}</span>
        </div>
        <div class="bonus-card__text">${b.text}</div>
        <div class="text-sm muted mb">Предложено: <b>+${b.proposed}</b></div>
      `;

      if (b.status === "pending") {
        const actions = document.createElement("div");
        actions.className = "bonus-card__actions";
        actions.innerHTML = `
          <input type="number" id="bp-${b.id}" value="${b.proposed}" min="1" max="30">
          <button class="btn-success btn-sm" data-action="approve">✓ Принять</button>
          <button class="btn-secondary btn-sm" data-action="postpone">⏸ Отложить</button>
          <button class="btn-danger btn-sm" data-action="reject">✗ Отклонить</button>
        `;
        actions.querySelector('[data-action="approve"]').onclick = () => this.approveBonus(b);
        actions.querySelector('[data-action="postpone"]').onclick = () => this.postponeBonus(b);
        actions.querySelector('[data-action="reject"]').onclick = () => this.rejectBonus(b);
        card.appendChild(actions);
      }

      list.appendChild(card);
    });
  },

  async approveBonus(bonus) {
    const points = Number(document.getElementById("bp-" + bonus.id).value);

    // Обновляем бонус
    await API.save("bonuses", { ...bonus, status: "approved", approved: points });

    // Добавляем в день
    const cleanDate = U.cleanDate(bonus.date);
    const day = API.data.days.find(d =>
      d.childId === bonus.childId && d.periodId === bonus.periodId && U.cleanDate(d.date) === cleanDate
    ) || {
      childId: bonus.childId,
      periodId: bonus.periodId,
      date: cleanDate,
      penaltyIds: [],
      extras: [],
      bonuses: [],
      dayTotal: 0,
      closed: false
    };

    day.bonuses = day.bonuses || [];
    day.bonuses.push({ text: bonus.text, points });

    // Пересчёт
    const metrics = API.data.metrics.filter(m => m.childId === bonus.childId && m.periodId === bonus.periodId && m.active);
    const child = API.data.children.find(c => c.id === bonus.childId);
    let pen = 0;
    (day.penaltyIds || []).forEach(id => {
      const m = metrics.find(x => x.id === id);
      if (m) pen += m.points;
    });
    (day.extras || []).forEach(e => pen += e.points);
    let bon = 0;
    day.bonuses.forEach(x => bon += x.points);
    let total = child.baseDay + pen + bon;
    if (total < child.floor) total = child.floor;
    day.dayTotal = total;

    await API.save("days", day);
    await API.load();
    Toast.success("Принято!");
    this.renderAll();
  },

  async postponeBonus(bonus) {
    await API.save("bonuses", { ...bonus, status: "postponed" });
    await API.load();
    Toast.info("Отложено");
    this.renderAll();
  },

  async rejectBonus(bonus) {
    const ok = await Modal.confirm("Отклонить?", "Ребёнок увидит отказ.", "Отклонить", true);
    if (!ok) return;
    await API.save("bonuses", { ...bonus, status: "rejected", approved: 0 });
    await API.load();
    Toast.info("Отклонено");
    this.renderAll();
  },

  // ============================================================
  // НАСТРОЙКИ
  // ============================================================
  renderSettings(el) {
    el.innerHTML = `
      <div class="card">
        <h2>👧 Дети</h2>
        <button class="btn-primary btn-sm mb" id="addChildBtn">+ Добавить ребёнка</button>
        <div id="childrenList"></div>
      </div>
      <div class="card">
        <h2>📅 Периоды ${State.child ? State.child.name : ""}</h2>
        ${State.child ? `<button class="btn-primary btn-sm mb" id="addPeriodBtn">+ Создать период</button>` : `<p class="muted">Сначала выбери ребёнка.</p>`}
        <div id="periodsList"></div>
      </div>
      <div class="card">
        <h2>📋 Метрики периода</h2>
        <div id="metricsSettings"></div>
      </div>
    `;

    this.renderChildrenList();
    this.renderPeriodsList();
    this.renderMetricsSettings();

    document.getElementById("addChildBtn").onclick = () => this.addChild();
    const addPeriodBtn = document.getElementById("addPeriodBtn");
    if (addPeriodBtn) addPeriodBtn.onclick = () => this.addPeriod();
  },

  renderChildrenList() {
    const el = document.getElementById("childrenList");
    const children = API.data.children.filter(c => c.active);

    if (children.length === 0) {
      el.innerHTML = `<p class="muted">Пока нет детей.</p>`;
      return;
    }

    el.innerHTML = "";
    children.forEach(c => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="list-item__info">
          <div class="list-item__title">${c.name}</div>
          <div class="list-item__meta">ID: ${c.id} · база ${c.baseDay} · флор ${c.floor}</div>
        </div>
        <div class="list-item__actions">
          <button class="btn-secondary btn-sm" data-action="edit">✎</button>
          <button class="btn-danger btn-sm" data-action="delete">×</button>
        </div>
      `;
      item.querySelector('[data-action="edit"]').onclick = () => this.editChild(c);
      item.querySelector('[data-action="delete"]').onclick = () => this.deleteChild(c);
      el.appendChild(item);
    });
  },

  async addChild() {
    const data = await Modal.form("Новый ребёнок", [
      { name: "name", label: "Имя", type: "text", placeholder: "Варвара" },
      { name: "id", label: "ID (латиницей)", type: "text", placeholder: "varvara" },
      { name: "baseDay", label: "Базовый день", type: "number", value: CONFIG.baseDay },
      { name: "floor", label: "Минимум за день", type: "number", value: CONFIG.floor }
    ], "Добавить");
    if (!data) return;

    const id = data.id.toLowerCase().trim();
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
      Toast.error("ID должен быть латиницей, начинаться с буквы");
      return;
    }

    if (API.data.children.some(c => c.id === id)) {
      Toast.error("Ребёнок с таким ID уже есть");
      return;
    }

    await API.save("children", {
      id,
      name: data.name,
      baseDay: Number(data.baseDay),
      floor: Number(data.floor),
      active: true,
      activePeriodId: ""
    });

    await API.load();
    Toast.success("Добавлено");
    this.renderAll();
  },

  async editChild(child) {
    const data = await Modal.form("Редактировать", [
      { name: "name", label: "Имя", type: "text", value: child.name },
      { name: "baseDay", label: "Базовый день", type: "number", value: child.baseDay },
      { name: "floor", label: "Минимум за день", type: "number", value: child.floor }
    ]);
    if (!data) return;

    await API.save("children", {
      ...child,
      name: data.name,
      baseDay: Number(data.baseDay),
      floor: Number(data.floor)
    });
    await API.load();
    Toast.success("Сохранено");
    this.renderAll();
  },

  async deleteChild(child) {
    const ok = await Modal.confirm(`Удалить ${child.name}?`, "Все данные останутся в таблице, но скроются.", "Удалить", true);
    if (!ok) return;
    await API.save("children", { ...child, active: false, activePeriodId: "" });
    await API.load();
    Toast.success("Скрыто");
    this.renderAll();
  },

  renderPeriodsList() {
    const el = document.getElementById("periodsList");
    if (!State.child) {
      el.innerHTML = `<p class="muted">Выбери ребёнка вверху.</p>`;
      return;
    }

    const periods = State.allPeriods.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

    if (periods.length === 0) {
      el.innerHTML = `<p class="muted">Пока нет периодов у ${State.child.name}.</p>`;
      return;
    }

    el.innerHTML = "";
    periods.forEach(p => {
      const isActive = State.child.activePeriodId === p.id;
      const item = document.createElement("div");
      item.className = "list-item";
      item.style.borderLeft = isActive ? "4px solid var(--success)" : "4px solid var(--border)";
      item.innerHTML = `
        <div class="list-item__info">
          <div class="list-item__title">${p.name} ${isActive ? "🟢 активный" : ""}</div>
          <div class="list-item__meta">${U.formatFull(p.startDate)} — ${U.formatFull(p.endDate)} · цель ${p.goalPoints}</div>
          <div class="list-item__meta">${p.goalEmoji || ""} ${p.goalText || ""}</div>
        </div>
        <div class="list-item__actions">
          ${!isActive ? `<button class="btn-primary btn-sm" data-action="activate">Активировать</button>` : ""}
          <button class="btn-secondary btn-sm" data-action="edit">✎</button>
          <button class="btn-danger btn-sm" data-action="delete">×</button>
        </div>
      `;

      if (!isActive) {
        item.querySelector('[data-action="activate"]').onclick = () => this.activatePeriod(p);
      }
      item.querySelector('[data-action="edit"]').onclick = () => this.editPeriod(p);
      item.querySelector('[data-action="delete"]').onclick = () => this.deletePeriod(p);

      el.appendChild(item);
    });
  },

  async addPeriod() {
    const today = U.today();
    const end = U.addDays(today, CONFIG.periodDays - 1);

    const data = await Modal.form("Новый период для " + State.child.name, [
      { name: "name", label: "Название", type: "text", value: U.monthName() },
      { name: "startDate", label: "Начало", type: "date", value: today },
      { name: "endDate", label: "Конец", type: "date", value: end },
      { name: "goalPoints", label: "Цель (баллов)", type: "number", value: CONFIG.goalPoints },
      { name: "goalText", label: "Цель словами", type: "text", placeholder: "Ходить в школу одна" },
      { name: "goalEmoji", label: "Эмодзи цели", type: "select", value: "🎯",
        options: CONFIG.goalEmojis.map(e => ({ value: e, label: e })) }
    ], "Создать");
    if (!data) return;

    const periodId = "p" + Date.now();

    // 1. Создаём период
    await API.save("periods", {
      id: periodId,
      childId: State.childId,
      name: data.name,
      startDate: U.cleanDate(data.startDate),
      endDate: U.cleanDate(data.endDate),
      goalPoints: Number(data.goalPoints),
      goalText: data.goalText,
      goalEmoji: data.goalEmoji,
      active: false
    });

    // 2. Копируем метрики из справочника
    for (const m of CONFIG.defaultMetrics) {
      await API.save("metrics", {
        childId: State.childId,
        periodId,
        id: m.id,
        icon: m.icon,
        text: m.text,
        points: m.points,
        active: true
      });
    }

    await API.load();
    Toast.success("Период создан");
    this.renderAll();
  },

  async activatePeriod(period) {
    const ok = await Modal.confirm("Активировать?", "Прошлый активный период этого ребёнка станет архивным.", "Активировать");
    if (!ok) return;

    // Деактивируем все периоды ребёнка
    for (const p of State.allPeriods) {
      if (p.active) {
        await API.save("periods", { ...p, active: false });
      }
    }
    // Активируем выбранный
    await API.save("periods", { ...period, active: true });

    // Обновляем ребёнка
    const child = State.child;
    await API.save("children", { ...child, activePeriodId: period.id });

    await API.load();
    State.setChild(State.childId);
    Toast.success("Период активирован");
    this.renderAll();
  },

  async editPeriod(period) {
    const data = await Modal.form("Редактировать период", [
      { name: "name", label: "Название", type: "text", value: period.name },
      { name: "goalPoints", label: "Цель (баллов)", type: "number", value: period.goalPoints },
      { name: "goalText", label: "Цель словами", type: "text", value: period.goalText || "" },
      { name: "goalEmoji", label: "Эмодзи", type: "select", value: period.goalEmoji || "🎯",
        options: CONFIG.goalEmojis.map(e => ({ value: e, label: e })) }
    ]);
    if (!data) return;

    await API.save("periods", {
      ...period,
      name: data.name,
      goalPoints: Number(data.goalPoints),
      goalText: data.goalText,
      goalEmoji: data.goalEmoji
    });
    await API.load();
    Toast.success("Сохранено");
    this.renderAll();
  },

  async deletePeriod(period) {
    const ok = await Modal.confirm(
      `Удалить период «${period.name}»?`,
      "Все дни и метрики этого периода останутся в таблице, но период исчезнет из интерфейса.",
      "Удалить",
      true
    );
    if (!ok) return;

    await API.remove("periods", "id", period.id);

    // Если был активным — снимаем с ребёнка
    if (State.child.activePeriodId === period.id) {
      await API.save("children", { ...State.child, activePeriodId: "" });
    }

    await API.load();
    Toast.success("Удалено");
    this.renderAll();
  },

  renderMetricsSettings() {
    const el = document.getElementById("metricsSettings");
    const period = State.period;

    if (!period) {
      el.innerHTML = `<p class="muted">Нет активного периода. Создай и активируй его выше.</p>`;
      return;
    }

    const metrics = API.data.metrics
      .filter(m => m.childId === State.childId && m.periodId === period.id && m.active);

    el.innerHTML = `
      <p class="text-sm muted mb">Метрики периода «${period.name}» (${metrics.length} шт.)</p>
      <button class="btn-primary btn-sm mb" id="addMetricBtn">+ Добавить</button>
      <div id="metricsSettingsList"></div>
    `;

    document.getElementById("addMetricBtn").onclick = () => this.addMetric();

    const list = document.getElementById("metricsSettingsList");
    metrics.forEach(m => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="list-item__info">
          <div class="list-item__title">${m.icon} ${m.text}</div>
          <div class="list-item__meta">${m.points} баллов</div>
        </div>
        <div class="list-item__actions">
          <button class="btn-secondary btn-sm" data-action="edit">✎</button>
          <button class="btn-danger btn-sm" data-action="delete">×</button>
        </div>
      `;
      item.querySelector('[data-action="edit"]').onclick = () => this.editMetric(m);
      item.querySelector('[data-action="delete"]').onclick = () => this.deleteMetric(m);
      list.appendChild(item);
    });
  },

  async addMetric() {
    const period = State.period;
    if (!period) return;

    const data = await Modal.form("Новая метрика", [
      { name: "icon", label: "Эмодзи", type: "text", value: "❗" },
      { name: "text", label: "Текст", type: "text" },
      { name: "points", label: "Баллы (отрицательные)", type: "number", value: -1 }
    ], "Добавить");
    if (!data) return;

    await API.save("metrics", {
      childId: State.childId,
      periodId: period.id,
      id: "n" + Date.now(),
      icon: data.icon,
      text: data.text,
      points: Number(data.points),
      active: true
    });
    await API.load();
    Toast.success("Добавлена");
    this.renderAll();
  },

  async editMetric(m) {
    const data = await Modal.form("Редактировать", [
      { name: "icon", label: "Эмодзи", type: "text", value: m.icon },
      { name: "text", label: "Текст", type: "text", value: m.text },
      { name: "points", label: "Баллы", type: "number", value: m.points }
    ]);
    if (!data) return;

    await API.save("metrics", {
      ...m,
      icon: data.icon,
      text: data.text,
      points: Number(data.points)
    });
    await API.load();
    Toast.success("Сохранено");
    this.renderAll();
  },

  async deleteMetric(m) {
    const ok = await Modal.confirm("Скрыть метрику?", `«${m.text}» больше не будет отображаться.`, "Скрыть", true);
    if (!ok) return;

    await API.save("metrics", { ...m, active: false });
    await API.load();
    Toast.success("Скрыто");
    this.renderAll();
  },

  // ============================================================
  // АРХИВ
  // ============================================================
  renderArchive(el) {
    const child = State.child;

    if (!child) {
      el.innerHTML = `<div class="card"><p class="muted">Выбери ребёнка.</p></div>`;
      return;
    }

    const periods = State.allPeriods.filter(p => !p.active)
      .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

    if (periods.length === 0) {
      el.innerHTML = `<div class="card"><h2>📦 Архив</h2><p class="muted">Нет архивных периодов у ${child.name}.</p></div>`;
      return;
    }

    let html = `<div class="card"><h2>📦 Архив — ${child.name}</h2>`;
    periods.forEach(p => {
      const days = API.data.days.filter(d => d.childId === child.id && d.periodId === p.id);
      const total = days.reduce((s, d) => s + (d.dayTotal || 0), 0);
      const percent = Math.min(100, Math.round(total / p.goalPoints * 100));
      const level = U.currentLevel(total, p.goalPoints);

      html += `<div class="list-item" style="margin-bottom:16px;">
        <div class="list-item__info">
          <div class="list-item__title">${p.name}</div>
          <div class="list-item__meta">${U.formatFull(p.startDate)} — ${U.formatFull(p.endDate)}</div>
          <div class="list-item__meta">${p.goalEmoji || ""} ${p.goalText || ""}</div>
          <div class="list-item__meta mt">
            Итог: <b>${total}</b> / ${p.goalPoints} (${percent}%) · ${level.emoji} ${level.name}
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
    el.innerHTML = html;
  },

  // ============================================================
  // АНАЛИТИКА
  // ============================================================
  renderAnalytics(el) {
    const child = State.child;
    const period = State.period;

    if (!child || !period) {
      el.innerHTML = `<div class="card"><p class="muted">Нужен активный период.</p></div>`;
      return;
    }

    const days = State.days;
    if (days.length === 0) {
      el.innerHTML = `<div class="card"><h2>📊 Аналитика</h2><p class="muted">Нет данных за период.</p></div>`;
      return;
    }

    const metrics = State.metrics;
    const total = State.total;
    const avg = Math.round(total / days.length);

    const counts = {};
    days.forEach(d => {
      (d.penaltyIds || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      (d.extras || []).forEach(e => { counts["x:" + e.text] = (counts["x:" + e.text] || 0) + 1; });
    });
    const topProblems = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    let html = `<div class="card"><h2>📊 Аналитика — ${child.name}</h2>
      <ul style="list-style:none;">
        <li>Дней: <b>${days.length}</b></li>
        <li>Сумма: <b>${total}</b></li>
        <li>Средний балл: <b>${avg}</b></li>
        <li>Прогресс: <b>${Math.min(100, Math.round(total / period.goalPoints * 100))}%</b></li>
      </ul></div>`;

    if (topProblems.length > 0) {
      html += `<div class="card"><h3>🔥 Топ проблем</h3>`;
      topProblems.forEach(([key, count]) => {
        let label;
        if (key.startsWith("x:")) label = key.slice(2);
        else {
          const m = metrics.find(x => x.id === key);
          label = m ? `${m.icon} ${m.text}` : key;
        }
        html += `<div class="list-item"><div class="list-item__info">${label}</div><div class="metric__points">${count}</div></div>`;
      });
      html += `</div>`;
    }

    el.innerHTML = html;
  }
};

// ============================================================
// ДЕТСКИЙ ИНТЕРФЕЙС
// ============================================================
const Child = {
  async start() {
    State.init();
    document.getElementById("childApp").classList.remove("hidden");
    this.render();
  },

  render() {
    const child = State.child;
    const period = State.period;

    if (!child) {
      document.getElementById("childContent").innerHTML = `<p class="muted">Профиль не найден.</p>`;
      return;
    }
    if (!period) {
      document.getElementById("childContent").innerHTML = `<p class="muted">Период пока не начался.</p>`;
      return;
    }

    document.getElementById("childGreeting").textContent = `Привет, ${child.name}! 👋`;
    document.getElementById("childDate").textContent = U.formatFull(U.today());

    const days = State.days;
    const total = State.total;
    const level = U.currentLevel(total, period.goalPoints);
    const percent = Math.min(100, Math.round(total / period.goalPoints * 100));

    let html = "";

    // Цель
    if (period.goalText) {
      html += `<div class="goal-card">
        <div class="goal-card__label">🎯 Моя цель</div>
        <div class="goal-card__text">
          <span class="goal-card__emoji">${period.goalEmoji || "🎯"}</span>
          <span>${period.goalText}</span>
        </div>
      </div>`;
    }

    // Уровень
    html += `<div class="level-card">
      <div class="level-card__emoji">${level.emoji}</div>
      <div class="level-card__name">${level.name}</div>
      <div class="level-card__sub">Уровень ${level.index + 1} из ${CONFIG.levels.length}</div>
      <div class="progress"><div class="progress__bar" style="width:${percent}%;">${percent}%</div></div>
      <div class="text-sm muted">${total} из ${period.goalPoints} баллов</div>
    </div>`;

    // Статы
    html += `<div class="stats">
      <div class="stat"><div class="stat__emoji">⭐</div><div class="stat__value">${total}</div><div class="stat__label">Мои баллы</div></div>
      <div class="stat"><div class="stat__emoji">📅</div><div class="stat__value">${days.length}</div><div class="stat__label">Дней</div></div>
      <div class="stat"><div class="stat__emoji">🎯</div><div class="stat__value">${period.goalPoints}</div><div class="stat__label">Цель</div></div>
    </div>`;

    // Календарь
    html += `<div class="card"><h3>📅 Мой период</h3><div class="cal-grid">`;
    let date = U.cleanDate(period.startDate);
    const end = U.cleanDate(period.endDate);
    while (date <= end) {
      const d = days.find(x => U.cleanDate(x.date) === date);
      let cls = "";
      if (d) {
        if (d.dayTotal >= 18) cls = "green";
        else if (d.dayTotal >= 10) cls = "yellow";
        else cls = "red";
      }
      html += `<div class="cal-cell ${cls}">${U.dayNum(date)}</div>`;
      date = U.addDays(date, 1);
    }
    html += `</div></div>`;

    // Бонус
    html += `<div class="card">
      <h3>💡 Предложить бонус</h3>
      <p class="text-sm muted mb">Сделала что-то сверх обычного? Расскажи папе.</p>
      <input type="text" id="bonusText" placeholder="Что ты сделала?" class="mb">
      <input type="number" id="bonusPoints" placeholder="Сколько баллов?" min="1" max="20" class="mb">
      <button class="btn-primary btn-block" id="submitBonusBtn">Отправить</button>
      <div id="bonusMsg" class="text-sm mt"></div>
    </div>`;

    // Мои предложения
    const myBonuses = API.data.bonuses
      .filter(b => b.childId === child.id && b.periodId === period.id)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);

    if (myBonuses.length > 0) {
      html += `<div class="card"><h3>Мои предложения</h3>`;
      myBonuses.forEach(b => {
        const statusText = {
          pending: "На рассмотрении",
          approved: `Принято +${b.approved}`,
          rejected: "Отклонено",
          postponed: "Отложено"
        }[b.status];
        html += `<div class="list-item">
          <div class="list-item__info">${b.text}</div>
          <div class="text-sm muted">${statusText}</div>
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById("childContent").innerHTML = html;

    document.getElementById("submitBonusBtn").onclick = () => this.submitBonus();
  },

  async submitBonus() {
    const text = document.getElementById("bonusText").value.trim();
    const points = Number(document.getElementById("bonusPoints").value);
    const msg = document.getElementById("bonusMsg");

    if (!text || !points) {
      msg.textContent = "Заполни оба поля";
      msg.style.color = "var(--danger)";
      return;
    }

    const period = State.period;
    if (!period) return;

    await API.save("bonuses", {
      id: "b" + Date.now(),
      childId: State.childId,
      periodId: period.id,
      date: U.today(),
      text,
      proposed: points,
      approved: "",
      status: "pending"
    });

    await API.load();
    Toast.success("Отправлено!");
    this.render();
  }
};

// ============================================================
// ЗАПУСК
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const loginScreen = document.getElementById("loginScreen");
  const loginBtn = document.getElementById("loginBtn");
  const passwordInput = document.getElementById("passwordInput");
  const loginError = document.getElementById("loginError");

  const params = new URLSearchParams(location.search);
  const isChild = params.has("child");

  if (isChild) {
    try {
      await API.load();
      loginScreen.classList.add("hidden");
      Child.start();
    } catch (e) {
      loginScreen.innerHTML = `<p style="color:red;">Ошибка: ${e.message}</p>`;
    }
    return;
  }

  if (sessionStorage.getItem("auth") === "1") {
    try {
      await API.load();
      Parent.start();
    } catch (e) {
      alert("Ошибка загрузки: " + e.message);
    }
  }

  loginBtn.onclick = async () => {
    if (passwordInput.value === CONFIG.parentPassword) {
      sessionStorage.setItem("auth", "1");
      loginError.classList.add("hidden");
      try {
        await API.load();
        Parent.start();
      } catch (e) {
        alert("Ошибка: " + e.message);
      }
    } else {
      loginError.classList.remove("hidden");
      passwordInput.value = "";
    }
  };

  passwordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") loginBtn.click();
  });
});
