// ============================================================
// CHILDREN TRACKER — вся логика
// ============================================================

// ---------- Конфиг ----------
const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbwY0Y4t7ALcGFKVXddVHHkMjtXEwoOpoNLNgZwqrHD9fYbqU0Fdy9Xg4WpLUo1s0N7J/exec",
  parentPassword: "Oleg2026!",

  baseDay: 21,
  floor: -15,
  goalPoints: 300,
  periodDays: 14,

  levels: [
    { name: "Новичок",         emoji: "🌱" },
    { name: "Ученица",         emoji: "🌿" },
    { name: "Помощница",       emoji: "🌳" },
    { name: "Организованная",  emoji: "⭐" },
    { name: "Мастер",          emoji: "🏆" }
  ],

  goalEmojis: ["🎒","🚶","🚲","🛴","🚪","🐱","🐶","🐹","🐰","🌱","🎮","🎨","🎬","🎢","🎠","🏕️","🎡","🏖️","🎪","🏆","⭐","🎁","🎯"],

  defaultMetrics: [
    { id: "n1",  icon: "🤥", text: "Соврала",                                       points: -10 },
    { id: "n2",  icon: "🔥", text: "Оставила плиту/чайник включённой",              points: -5  },
    { id: "n3",  icon: "🔑", text: "Ключи в неположенном месте",                     points: -6  },
    { id: "n4",  icon: "📵", text: "Не предупредила о приходе",                      points: -6  },
    { id: "n5",  icon: "🥊", text: "Драка с сестрой",                               points: -5  },
    { id: "n6",  icon: "🗣️", text: "Крики/грубость с сестрой",                      points: -4  },
    { id: "n7",  icon: "😤", text: "Спор с родителями",                             points: -5  },
    { id: "n8",  icon: "🚫", text: "Отказ помочь по просьбе",                       points: -3  },
    { id: "n9",  icon: "🎒", text: "Рюкзак не собран с вечера",                     points: -3  },
    { id: "n10", icon: "📚", text: "Не сделала уроки",                              points: -4  },
    { id: "n11", icon: "🧸", text: "Потеряла вещь",                                 points: -3  },
    { id: "n12", icon: "🚿", text: "Не подмылась / не сменила трусики",             points: -2  },
    { id: "n13", icon: "🏃", text: "Опоздала / выбежала в спешке",                   points: -3  },
    { id: "n14", icon: "🍽️", text: "Посуда не убрана",                              points: -3  },
    { id: "n15", icon: "🚰", text: "Кран не закрыт",                                points: -3  },
    { id: "n16", icon: "👖", text: "Вещи на полу или стуле",                        points: -3  },
    { id: "n17", icon: "💡", text: "Свет оставлен включённым",                      points: -3  },
    { id: "n18", icon: "🧹", text: "Не выполнила обязанность по дому",              points: -2  },
    { id: "n19", icon: "😴", text: "Легла спать позже на час",                      points: -2  },
    { id: "n20", icon: "🗑️", text: "Мусор не выброшен",                            points: -3  },
    { id: "n21", icon: "🦷", text: "Не почистила зубы",                             points: -2  },
    { id: "n22", icon: "🧦", text: "Грязные носки спрятаны по углам",               points: -3  },
    { id: "n23", icon: "🧺", text: "Чистые вещи не разобраны",                      points: -2  },
    { id: "n24", icon: "📖", text: "Учебники не на месте",                          points: -2  },
    { id: "n25", icon: "🍽️", text: "Не помыла руки перед едой",                     points: -2  },
    { id: "n26", icon: "🛏️", text: "Не убрала постель",                            points: -3  },
    { id: "n27", icon: "🧽", text: "Стол не вытерт",                                points: -2  },
    { id: "n28", icon: "👟", text: "Обувь не на месте",                             points: -2  },
    { id: "n29", icon: "🧴", text: "Не расчесалась",                                points: -1  },
    { id: "n30", icon: "📱", text: "Телефон без разрешения",                         points: -3  },
    { id: "n31", icon: "📱", text: "Продление телефона на 1 час",                    points: -1  }
  ]
};

// ============================================================
// API
// ============================================================
const API = {
  data: { children: [], periods: [], goals: [], metrics: [], days: [], bonuses: [] },

  async load() {
    const res = await fetch(CONFIG.apiUrl + "?t=" + Date.now());
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    this.data = json;
    return json;
  },

  async save(sheet, data) {
    await fetch(CONFIG.apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", sheet, data })
    });
    // Небольшая пауза, чтобы Apps Script успел записать
    await new Promise(r => setTimeout(r, 300));
    await this.load();
  },

  async remove(sheet, key, value) {
    await fetch(CONFIG.apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", sheet, key, value })
    });
    await new Promise(r => setTimeout(r, 300));
    await this.load();
  }
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

  parseDate(str) {
    if (!str) return null;
    // "2026-10-18T21:00:00.000Z" → "2026-10-18"
    if (str.includes("T")) return str.slice(0, 10);
    return str;
  },

  formatShort(dateStr) {
    const s = this.parseDate(dateStr);
    if (!s) return "?";
    return Number(s.slice(8, 10));
  },

  formatFull(dateStr) {
    const s = this.parseDate(dateStr);
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${Number(d)} ${months[Number(m)-1]} ${y}`;
  },

  formatHuman(dateStr) {
    const s = this.parseDate(dateStr);
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    const months = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
    return `${Number(d)} ${months[Number(m)-1]}`;
  },

  monthName() {
    const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    return months[new Date().getMonth()] + " " + new Date().getFullYear();
  },

  // Уровни
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
    if (this._resolve) {
      this._resolve(null);
      this._resolve = null;
    }
  },

  confirm(title, message, okLabel = "Подтвердить", danger = false) {
    return new Promise(resolve => {
      this._resolve = resolve;
      this.open({
        title,
        bodyHtml: `<p>${message}</p>`,
        actions: [
          { label: "Отмена", className: "btn-secondary", onClick: () => resolve(false) },
          { label: okLabel, className: danger ? "btn-danger" : "btn-primary", onClick: () => resolve(true) }
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
            ${f.options.map(o => `<option value="${o.value}" ${o.value == f.value ? "selected" : ""}>${o.label}</option>`).join("")}
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
          { label: "Отмена", className: "btn-secondary", onClick: () => resolve(null) },
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
              this._resolve = null;
            }
          }
        ]
      });
    });
  }
};

// ============================================================
// ТОСТ
// ============================================================
const Toast = {
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
  periodId: null,
  date: null,
  tab: "mark",

  init() {
    const params = new URLSearchParams(location.search);
    const urlChild = params.get("child");

    const children = API.data.children.filter(c => c.active);
    if (urlChild && children.some(c => c.id === urlChild)) {
      this.childId = urlChild;
    } else if (children.length > 0) {
      this.childId = children[0].id;
    }

    const period = API.data.periods.find(p => p.active);
    if (period) this.periodId = period.id;

    this.date = U.today();
  },

  get child() { return API.data.children.find(c => c.id === this.childId); },
  get period() { return API.data.periods.find(p => p.id === this.periodId); },

  getGoal(childId, periodId) {
    return API.data.goals.find(g => g.childId === childId && g.periodId === periodId);
  },

  getMetrics(childId) {
    const personal = API.data.metrics.filter(m => m.childId === childId && m.active);
    if (personal.length > 0) return personal;
    return CONFIG.defaultMetrics.map(m => ({ ...m, childId, active: true }));
  },

  getDay(childId, periodId, date) {
    const cleanDate = U.parseDate(date);
    return API.data.days.find(d =>
      d.childId === childId && d.periodId === periodId && U.parseDate(d.date) === cleanDate
    );
  },

  getDays(childId, periodId) {
    return API.data.days.filter(d => d.childId === childId && d.periodId === periodId);
  },

  getTotal(childId, periodId) {
    return this.getDays(childId, periodId).reduce((s, d) => s + (d.dayTotal || 0), 0);
  },

  getBonusCount() {
    return API.data.bonuses.filter(b => b.status === "pending").length;
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
    this.renderChildSelector();
    this.bindTabs();
    this.renderTab();
    this.updateBadges();
  },

  logout() {
    sessionStorage.removeItem("auth");
    location.reload();
  },

  renderChildSelector() {
    const el = document.getElementById("childSelector");
    el.innerHTML = "";
    API.data.children.filter(c => c.active).forEach(c => {
      const btn = document.createElement("button");
      btn.className = "child-btn" + (c.id === State.childId ? " active" : "");
      btn.textContent = c.name;
      btn.onclick = () => {
        State.childId = c.id;
        this.renderChildSelector();
        this.renderTab();
      };
      el.appendChild(btn);
    });
  },

  bindTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        State.tab = tab.dataset.tab;
        this.renderTab();
      };
    });
  },

  renderTab() {
    const fn = {
      mark: () => this.renderMark(),
      bonuses: () => this.renderBonuses(),
      settings: () => this.renderSettings(),
      archive: () => this.renderArchive(),
      analytics: () => this.renderAnalytics(),
      notifications: () => this.renderNotifications()
    }[State.tab];
    if (fn) fn();
    this.updateBadges();
  },

  updateBadges() {
    const bonusBadge = document.getElementById("bonusBadge");
    const notifBadge = document.getElementById("notifBadge");

    const pendingBonuses = API.data.bonuses.filter(b => b.status === "pending").length;
    const unreadNotifs = 0; // TODO если понадобится

    if (pendingBonuses > 0) {
      bonusBadge.textContent = pendingBonuses;
      bonusBadge.classList.remove("hidden");
    } else bonusBadge.classList.add("hidden");
  },

  // ---------- Отметки ----------
  renderMark() {
    const el = document.getElementById("tabContent");
    const child = State.child;
    const period = State.period;

    if (!child || !period) {
      el.innerHTML = `<div class="card"><p class="muted">Сначала добавь ребёнка и создай активный период во вкладке «Настройки».</p></div>`;
      return;
    }

    const startDate = U.parseDate(period.startDate);
    const endDate = U.parseDate(period.endDate);

    el.innerHTML = `
      <div class="calendar-strip" id="calStrip"></div>
      <div class="card">
        <h2>❌ Штрафы</h2>
        <div id="metricsList"></div>
      </div>
      <div class="card">
        <h3>➕ Прочие штрафы</h3>
        <div id="extrasList"></div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <input type="text" id="extraText" placeholder="Что случилось?">
          <input type="number" id="extraPoints" value="-2" min="-20" max="-1" style="max-width:90px;">
          <button class="btn-danger btn-sm" onclick="Parent.addExtra()">−</button>
        </div>
      </div>
      <div class="summary">
        <div>
          <div class="summary__numbers">
            <span class="summary__base">${child.baseDay}</span>
            <span class="summary__pen" id="sumPen">0</span>
            <span class="summary__bon" id="sumBon">+0</span>
            <span>=</span>
            <span class="summary__total" id="sumTotal">${child.baseDay}</span>
          </div>
        </div>
        <div class="summary__actions">
          <button class="btn-secondary" onclick="Parent.saveDay(false)">Сохранить</button>
          <button class="btn-primary" onclick="Parent.closeDay()">Закрыть день</button>
        </div>
      </div>
    `;

    this.renderCalendar();
    this.renderMetrics();
    this.renderExtras();
    this.updateSummary();
  },

  renderCalendar() {
    const el = document.getElementById("calStrip");
    const period = State.period;
    const startDate = U.parseDate(period.startDate);
    const endDate = U.parseDate(period.endDate);
    const days = State.getDays(State.childId, State.periodId);

    el.innerHTML = "";
    let date = startDate;
    while (date <= endDate) {
      const d = days.find(x => U.parseDate(x.date) === date);
      const cell = document.createElement("div");
      cell.className = "cal-day";
      if (date === State.date) cell.classList.add("selected");
      if (date === U.today()) cell.classList.add("today");

      let dotClass = "";
      if (d && d.closed) dotClass = d.dayTotal >= 15 ? "green" : "yellow";
      else if (d) dotClass = "gray";

      cell.innerHTML = `
        <div class="cal-day__num">${U.formatShort(date)}</div>
        <div class="cal-day__dot ${dotClass}"></div>
      `;
      cell.onclick = () => {
        State.date = date;
        this.renderTab();
      };
      el.appendChild(cell);
      date = U.addDays(date, 1);
    }
  },

  renderMetrics() {
    const el = document.getElementById("metricsList");
    const metrics = State.getMetrics(State.childId);
    const day = this.getCurrentDay();

    const sorted = [...metrics].sort((a, b) => {
      const aSel = day.penaltyIds.includes(a.id) ? 1 : 0;
      const bSel = day.penaltyIds.includes(b.id) ? 1 : 0;
      return bSel - aSel;
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
    const existing = State.getDay(State.childId, State.periodId, State.date);
    if (existing) {
      return {
        ...existing,
        penaltyIds: existing.penaltyIds || [],
        extras: existing.extras || [],
        bonuses: existing.bonuses || []
      };
    }
    return {
      childId: State.childId,
      periodId: State.periodId,
      date: State.date,
      penaltyIds: [],
      extras: [],
      bonuses: [],
      dayTotal: State.child.baseDay,
      closed: false
    };
  },

  setCurrentDay(day) {
    // Локально обновляем в API.data для мгновенного отображения
    const list = API.data.days;
    const idx = list.findIndex(d =>
      d.childId === day.childId && d.periodId === day.periodId && U.parseDate(d.date) === U.parseDate(day.date)
    );
    if (idx >= 0) list[idx] = day;
    else list.push(day);
  },

  togglePenalty(id) {
    const day = this.getCurrentDay();
    const idx = day.penaltyIds.indexOf(id);
    if (idx >= 0) day.penaltyIds.splice(idx, 1);
    else day.penaltyIds.push(id);
    this.setCurrentDay(day);
    this.renderMetrics();
    this.updateSummary();
  },

  addExtra() {
    const text = document.getElementById("extraText").value.trim();
    const points = Number(document.getElementById("extraPoints").value);
    if (!text || !points) return;
    const day = this.getCurrentDay();
    day.extras.push({ text, points });
    this.setCurrentDay(day);
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
          <button class="btn-secondary btn-sm" onclick="Parent.removeExtra(${i})">×</button>
        </div>
      `;
      el.appendChild(row);
    });
  },

  removeExtra(i) {
    const day = this.getCurrentDay();
    day.extras.splice(i, 1);
    this.setCurrentDay(day);
    this.renderExtras();
    this.updateSummary();
  },

  updateSummary() {
    const day = this.getCurrentDay();
    const child = State.child;
    const metrics = State.getMetrics(State.childId);

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
    this.setCurrentDay(day);

    document.getElementById("sumPen").textContent = pen;
    document.getElementById("sumBon").textContent = bon >= 0 ? "+" + bon : bon;
    document.getElementById("sumTotal").textContent = total;
  },

  async saveDay(close) {
    const day = this.getCurrentDay();
    if (close) day.closed = true;
    try {
      await API.save("days", day);
      Toast.success(close ? "День закрыт!" : "Сохранено");
      if (close) this.renderTab();
    } catch (e) {
      Toast.error("Ошибка: " + e.message);
    }
  },

  closeDay() {
    return this.saveDay(true);
  },

  // ---------- Предложения ----------
  renderBonuses() {
    const el = document.getElementById("tabContent");
    const bonuses = [...API.data.bonuses].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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
        ${b.status === "pending" ? `
          <div class="bonus-card__actions">
            <input type="number" id="bp-${b.id}" value="${b.proposed}" min="1" max="30">
            <button class="btn-success btn-sm" onclick="Parent.approveBonus('${b.id}')">✓ Принять</button>
            <button class="btn-secondary btn-sm" onclick="Parent.postponeBonus('${b.id}')">⏸ Отложить</button>
            <button class="btn-danger btn-sm" onclick="Parent.rejectBonus('${b.id}')">✗ Отклонить</button>
          </div>
        ` : ""}
      `;
      list.appendChild(card);
    });
  },

  async approveBonus(id) {
    const bonus = API.data.bonuses.find(b => b.id === id);
    if (!bonus) return;
    const points = Number(document.getElementById("bp-" + id).value);

    await API.save("bonuses", { ...bonus, status: "approved", approved: points });

    // Добавляем бонус в день
    const day = State.getDay(bonus.childId, bonus.periodId, bonus.date) || {
      childId: bonus.childId,
      periodId: bonus.periodId,
      date: U.parseDate(bonus.date),
      penaltyIds: [],
      extras: [],
      bonuses: [],
      closed: false
    };
    day.bonuses = day.bonuses || [];
    day.bonuses.push({ text: bonus.text, points });

    // Пересчитываем итог
    const metrics = State.getMetrics(bonus.childId);
    const child = API.data.children.find(c => c.id === bonus.childId);
    let pen = 0;
    (day.penaltyIds || []).forEach(id => {
      const m = metrics.find(x => x.id === id);
      if (m) pen += m.points;
    });
    (day.extras || []).forEach(e => pen += e.points);
    let bon = 0;
    day.bonuses.forEach(b => bon += b.points);
    let total = child.baseDay + pen + bon;
    if (total < child.floor) total = child.floor;
    day.dayTotal = total;

    await API.save("days", day);
    Toast.success("Бонус принят!");
    this.renderTab();
  },

  async postponeBonus(id) {
    const bonus = API.data.bonuses.find(b => b.id === id);
    await API.save("bonuses", { ...bonus, status: "postponed" });
    Toast.info("Отложено");
    this.renderTab();
  },

  async rejectBonus(id) {
    const bonus = API.data.bonuses.find(b => b.id === id);
    const ok = await Modal.confirm("Отклонить?", "Ребёнок увидит, что предложение отклонено.", "Отклонить", true);
    if (!ok) return;
    await API.save("bonuses", { ...bonus, status: "rejected", approved: 0 });
    Toast.info("Отклонено");
    this.renderTab();
  },

  // ---------- Настройки ----------
  renderSettings() {
    const el = document.getElementById("tabContent");
    el.innerHTML = `
      <div class="card">
        <h2>👧 Дети</h2>
        <button class="btn-primary btn-sm mb" onclick="Parent.addChild()">+ Добавить ребёнка</button>
        <div id="childrenList"></div>
      </div>
      <div class="card">
        <h2>📅 Периоды</h2>
        <button class="btn-primary btn-sm mb" onclick="Parent.addPeriod()">+ Создать период</button>
        <div id="periodsList"></div>
      </div>
      <div class="card">
        <h2>🎯 Цели на активный период</h2>
        <div id="goalsList"></div>
      </div>
      <div class="card">
        <h2>📋 Метрики для <span id="metricsChildName"></span></h2>
        <div id="metricsSettings"></div>
      </div>
    `;
    this.renderChildren();
    this.renderPeriods();
    this.renderGoals();
    this.renderMetricsSettings();
  },

  renderChildren() {
    const el = document.getElementById("childrenList");
    const children = API.data.children;
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
          <button class="btn-secondary btn-sm" onclick="Parent.editChild('${c.id}')">✎</button>
          <button class="btn-danger btn-sm" onclick="Parent.deleteChild('${c.id}')">×</button>
        </div>
      `;
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

    if (!/^[a-z][a-z0-9_-]*$/.test(data.id)) {
      Toast.error("ID должен быть латиницей, начинаться с буквы");
      return;
    }

    await API.save("children", {
      id: data.id.toLowerCase(),
      name: data.name,
      baseDay: Number(data.baseDay),
      floor: Number(data.floor),
      active: true
    });

    // Сразу копируем метрики из справочника
    for (const m of CONFIG.defaultMetrics) {
      await API.save("metrics", { ...m, childId: data.id.toLowerCase(), active: true });
    }

    Toast.success("Добавлено");
    this.renderTab();
  },

  async editChild(id) {
    const child = API.data.children.find(c => c.id === id);
    if (!child) return;
    const data = await Modal.form("Редактировать ребёнка", [
      { name: "name", label: "Имя", type: "text", value: child.name },
      { name: "baseDay", label: "Базовый день", type: "number", value: child.baseDay },
      { name: "floor", label: "Минимум за день", type: "number", value: child.floor }
    ]);
    if (!data) return;
    await API.save("children", { ...child, name: data.name, baseDay: Number(data.baseDay), floor: Number(data.floor) });
    Toast.success("Сохранено");
    this.renderTab();
  },

  async deleteChild(id) {
    const child = API.data.children.find(c => c.id === id);
    const ok = await Modal.confirm(`Удалить ${child.name}?`, "Все данные ребёнка останутся в таблице, но скроются.", "Удалить", true);
    if (!ok) return;
    await API.remove("children", "id", id);
    Toast.success("Удалено");
    this.renderTab();
  },

  renderPeriods() {
    const el = document.getElementById("periodsList");
    const periods = [...API.data.periods].sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
    if (periods.length === 0) {
      el.innerHTML = `<p class="muted">Пока нет периодов.</p>`;
      return;
    }
    el.innerHTML = "";
    periods.forEach(p => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.style.borderLeft = p.active ? "4px solid var(--success)" : "4px solid var(--border)";
      item.innerHTML = `
        <div class="list-item__info">
          <div class="list-item__title">${p.name} ${p.active ? "🟢" : ""}</div>
          <div class="list-item__meta">${U.formatFull(p.startDate)} — ${U.formatFull(p.endDate)} · цель ${p.goalPoints}</div>
        </div>
        <div class="list-item__actions">
          ${!p.active ? `<button class="btn-primary btn-sm" onclick="Parent.activatePeriod('${p.id}')">Сделать активным</button>` : ""}
        </div>
      `;
      el.appendChild(item);
    });
  },

  async addPeriod() {
    const today = U.today();
    const end = U.addDays(today, CONFIG.periodDays - 1);
    const data = await Modal.form("Новый период", [
      { name: "name", label: "Название", type: "text", value: U.monthName() },
      { name: "startDate", label: "Начало", type: "date", value: today },
      { name: "endDate", label: "Конец", type: "date", value: end },
      { name: "goalPoints", label: "Цель (баллов)", type: "number", value: CONFIG.goalPoints }
    ], "Создать");
    if (!data) return;

    const id = "p" + Date.now();
    await API.save("periods", {
      id,
      name: data.name,
      startDate: data.startDate.slice(0, 10),
      endDate: data.endDate.slice(0, 10),
      goalPoints: Number(data.goalPoints),
      active: false
    });

    Toast.success("Период создан");
    this.renderTab();
  },

  async activatePeriod(id) {
    const ok = await Modal.confirm("Сделать активным?", "Прошлый активный период станет архивным.", "Сделать");
    if (!ok) return;

    // Снимаем active со всех
    for (const p of API.data.periods) {
      if (p.active) await API.save("periods", { ...p, active: false });
    }
    // Активируем выбранный
    const period = API.data.periods.find(p => p.id === id);
    await API.save("periods", { ...period, active: true });
    State.periodId = id;
    Toast.success("Период активен");
    this.renderTab();
  },

  renderGoals() {
    const el = document.getElementById("goalsList");
    const period = State.period;
    if (!period) {
      el.innerHTML = `<p class="muted">Нет активного периода.</p>`;
      return;
    }
    const children = API.data.children.filter(c => c.active);
    if (children.length === 0) {
      el.innerHTML = `<p class="muted">Сначала добавь детей.</p>`;
      return;
    }
    el.innerHTML = "";
    children.forEach(c => {
      const goal = State.getGoal(c.id, period.id);
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="list-item__info">
          <div class="list-item__title">${c.name}</div>
          <div class="list-item__meta">${goal ? `${goal.emoji} ${goal.text}` : "Цель не задана"}</div>
        </div>
        <div class="list-item__actions">
          <button class="btn-primary btn-sm" onclick="Parent.setGoal('${c.id}')">${goal ? "Изменить" : "Задать"}</button>
        </div>
      `;
      el.appendChild(item);
    });
  },

  async setGoal(childId) {
    const period = State.period;
    if (!period) return;
    const existing = State.getGoal(childId, period.id) || {};
    const child = API.data.children.find(c => c.id === childId);

    const data = await Modal.form(`Цель для ${child.name}`, [
      { name: "text", label: "Цель словами", type: "text", value: existing.text || "", placeholder: "Ходить в школу одна" },
      { name: "emoji", label: "Эмодзи", type: "select", value: existing.emoji || "🎯",
        options: CONFIG.goalEmojis.map(e => ({ value: e, label: e })) }
    ]);
    if (!data) return;

    await API.save("goals", {
      childId,
      periodId: period.id,
      text: data.text,
      emoji: data.emoji
    });
    Toast.success("Цель сохранена");
    this.renderTab();
  },

  renderMetricsSettings() {
    const el = document.getElementById("metricsSettings");
    const child = State.child;
    document.getElementById("metricsChildName").textContent = child ? child.name : "—";
    if (!child) {
      el.innerHTML = `<p class="muted">Выбери ребёнка.</p>`;
      return;
    }
    const metrics = State.getMetrics(child.id);
    el.innerHTML = `<button class="btn-primary btn-sm mb" onclick="Parent.addMetric()">+ Добавить метрику</button>`;

    metrics.forEach(m => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="list-item__info">
          <div class="list-item__title">${m.icon} ${m.text}</div>
          <div class="list-item__meta">${m.points} баллов</div>
        </div>
        <div class="list-item__actions">
          <button class="btn-secondary btn-sm" onclick="Parent.editMetric('${m.id}')">✎</button>
          <button class="btn-danger btn-sm" onclick="Parent.deleteMetric('${m.id}')">×</button>
        </div>
      `;
      el.appendChild(item);
    });
  },

  async addMetric() {
    const data = await Modal.form("Новая метрика", [
      { name: "icon", label: "Эмодзи", type: "text", value: "❗" },
      { name: "text", label: "Текст", type: "text" },
      { name: "points", label: "Баллы (отрицательные)", type: "number", value: -1 }
    ], "Добавить");
    if (!data) return;
    const id = "n" + Date.now();
    await API.save("metrics", {
      childId: State.childId,
      id,
      icon: data.icon,
      text: data.text,
      points: Number(data.points),
      active: true
    });
    Toast.success("Метрика добавлена");
    this.renderTab();
  },

  async editMetric(id) {
    const m = API.data.metrics.find(x => x.childId === State.childId && x.id === id);
    if (!m) return;
    const data = await Modal.form("Редактировать", [
      { name: "icon", label: "Эмодзи", type: "text", value: m.icon },
      { name: "text", label: "Текст", type: "text", value: m.text },
      { name: "points", label: "Баллы", type: "number", value: m.points }
    ]);
    if (!data) return;
    await API.save("metrics", { ...m, icon: data.icon, text: data.text, points: Number(data.points) });
    Toast.success("Сохранено");
    this.renderTab();
  },

  async deleteMetric(id) {
    const m = API.data.metrics.find(x => x.childId === State.childId && x.id === id);
    const ok = await Modal.confirm("Удалить метрику?", `«${m.text}» будет скрыта.`, "Удалить", true);
    if (!ok) return;
    await API.save("metrics", { ...m, active: false });
    Toast.success("Скрыто");
    this.renderTab();
  },

  // ---------- Архив ----------
  renderArchive() {
    const el = document.getElementById("tabContent");
    const periods = API.data.periods.filter(p => !p.active);

    if (periods.length === 0) {
      el.innerHTML = `<div class="card"><h2>📦 Архив</h2><p class="muted">Нет архивных периодов.</p></div>`;
      return;
    }

    let html = `<div class="card"><h2>📦 Архив</h2>`;
    periods.forEach(p => {
      html += `<h3 class="mt">${p.name}</h3>`;
      html += `<div class="muted text-sm mb">${U.formatFull(p.startDate)} — ${U.formatFull(p.endDate)}</div>`;
      API.data.children.forEach(c => {
        const days = State.getDays(c.id, p.id);
        const total = days.reduce((s, d) => s + (d.dayTotal || 0), 0);
        const goal = State.getGoal(c.id, p.id);
        html += `<div class="list-item">
          <div class="list-item__info">
            <div class="list-item__title">${c.name}</div>
            <div class="list-item__meta">${goal ? goal.emoji + " " + goal.text : "—"} · ${total} из ${p.goalPoints}</div>
          </div>
        </div>`;
      });
    });
    html += `</div>`;
    el.innerHTML = html;
  },

  // ---------- Аналитика ----------
  renderAnalytics() {
    const el = document.getElementById("tabContent");
    const child = State.child;
    const period = State.period;

    if (!child || !period) {
      el.innerHTML = `<div class="card"><p class="muted">Нужен ребёнок и период.</p></div>`;
      return;
    }

    const days = State.getDays(child.id, period.id);
    if (days.length === 0) {
      el.innerHTML = `<div class="card"><h2>📊 Аналитика</h2><p class="muted">Нет данных за период.</p></div>`;
      return;
    }

    const metrics = State.getMetrics(child.id);
    const total = days.reduce((s, d) => s + (d.dayTotal || 0), 0);
    const avg = Math.round(total / days.length);

    // Считаем проблемы
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
  },

  // ---------- Уведомления ----------
  renderNotifications() {
    document.getElementById("tabContent").innerHTML = `<div class="card"><h2>🔔 Уведомления</h2><p class="muted">Пока нет уведомлений.</p></div>`;
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

    if (!child || !period) {
      document.getElementById("childContent").innerHTML = `<p class="muted">Профиль не настроен.</p>`;
      return;
    }

    document.getElementById("childGreeting").textContent = `Привет, ${child.name}! 👋`;
    document.getElementById("childDate").textContent = U.formatFull(U.today());

    const goal = State.getGoal(child.id, period.id);
    const days = State.getDays(child.id, period.id);
    const total = days.reduce((s, d) => s + (d.dayTotal || 0), 0);
    const goalPoints = period.goalPoints;
    const level = U.currentLevel(total, goalPoints);
    const percent = Math.min(100, Math.round(total / goalPoints * 100));

    let html = "";

    if (goal) {
      html += `<div class="goal-card">
        <div class="goal-card__label">🎯 Моя цель</div>
        <div class="goal-card__text">
          <span class="goal-card__emoji">${goal.emoji}</span>
          <span>${goal.text}</span>
        </div>
      </div>`;
    }

    html += `<div class="level-card">
      <div class="level-card__emoji">${level.emoji}</div>
      <div class="level-card__name">${level.name}</div>
      <div class="level-card__sub">Уровень ${level.index + 1} из ${CONFIG.levels.length}</div>
      <div class="progress"><div class="progress__bar" style="width:${percent}%;">${percent}%</div></div>
      <div class="text-sm muted">${total} из ${goalPoints} баллов</div>
    </div>`;

    html += `<div class="stats">
      <div class="stat"><div class="stat__emoji">⭐</div><div class="stat__value">${total}</div><div class="stat__label">Мои баллы</div></div>
      <div class="stat"><div class="stat__emoji">📅</div><div class="stat__value">${days.length}</div><div class="stat__label">Дней</div></div>
      <div class="stat"><div class="stat__emoji">🎯</div><div class="stat__value">${goalPoints}</div><div class="stat__label">Цель</div></div>
    </div>`;

    // Календарь
    html += `<div class="card"><h3>📅 Мой период</h3><div class="cal-grid">`;
    let date = U.parseDate(period.startDate);
    const end = U.parseDate(period.endDate);
    while (date <= end) {
      const d = days.find(x => U.parseDate(x.date) === date);
      let cls = "";
      if (d) {
        if (d.dayTotal >= 18) cls = "green";
        else if (d.dayTotal >= 10) cls = "yellow";
        else cls = "red";
      }
      html += `<div class="cal-cell ${cls}">${U.formatShort(date)}</div>`;
      date = U.addDays(date, 1);
    }
    html += `</div></div>`;

    // Форма бонуса
    html += `<div class="card">
      <h3>💡 Предложить бонус</h3>
      <p class="text-sm muted mb">Сделала что-то сверх обычного? Расскажи папе.</p>
      <input type="text" id="bonusText" placeholder="Что ты сделала?" class="mb">
      <input type="number" id="bonusPoints" placeholder="Сколько баллов?" min="1" max="20" class="mb">
      <button class="btn-primary btn-block" onclick="Child.submitBonus()">Отправить</button>
      <div id="bonusMsg" class="text-sm mt"></div>
    </div>`;

    // Мои предложения
    const myBonuses = API.data.bonuses.filter(b => b.childId === child.id).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
    if (myBonuses.length > 0) {
      html += `<div class="card"><h3>Мои предложения</h3>`;
      myBonuses.forEach(b => {
        const statusText = { pending: "На рассмотрении", approved: `Принято +${b.approved}`, rejected: "Отклонено", postponed: "Отложено" }[b.status];
        html += `<div class="list-item">
          <div class="list-item__info">${b.text}</div>
          <div class="text-sm muted">${statusText}</div>
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById("childContent").innerHTML = html;
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

    await API.save("bonuses", {
      id: "b" + Date.now(),
      childId: State.childId,
      periodId: State.periodId,
      date: U.today(),
      text,
      proposed: points,
      approved: "",
      status: "pending"
    });

    msg.textContent = "Отправлено!";
    msg.style.color = "var(--success)";
    document.getElementById("bonusText").value = "";
    document.getElementById("bonusPoints").value = "";
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

  // Определяем режим по URL: если ?child=..., это детский режим
  const params = new URLSearchParams(location.search);
  const isChild = params.has("child");

  if (isChild) {
    try {
      await API.load();
      loginScreen.classList.add("hidden");
      Child.start();
    } catch (e) {
      loginScreen.innerHTML = `<p style="color:red;">Ошибка загрузки: ${e.message}</p>`;
    }
    return;
  }

  // Родительский режим
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
        alert("Ошибка загрузки: " + e.message);
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