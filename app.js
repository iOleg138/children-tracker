/* ===== Конфигурация ===== */
const CFG = {
  URL: 'https://script.google.com/macros/s/AKfycbyUUQtVkboc1vMkDogRfguWbfHcnfjyWkzpFp9i3ZJ4lYWS61CzqiLsawGPi7HitEsWIw/exec',
  BASE: 21, FLOOR: -15,
  EMOJI: ['🎯', '🏆', '🎮', '🎀', '🚲', '🍦', '📱', '🐶'],
  LEVELS: ['Новичок', 'Ученик', 'Мастер', 'Эксперт', 'Чемпион'],
  CATALOG: [['🤥', 'Соврала', -10], ['🔥', 'Оставила плиту/чайник/микроволновку включённой', -5], ['🔑', 'Ключи в неположенном месте', -6], ['📵', 'Не предупредила о приходе домой/в школу', -6], ['🥊', 'Драка с сестрой', -5], ['🗣️', 'Крики/грубость с сестрой', -4], ['😤', 'Спор с родителями / огрызание', -5], ['🚫', 'Отказ помочь по просьбе', -3], ['🎒', 'Рюкзак не собран с вечера', -3], ['📚', 'Не сделала уроки', -4], ['🧸', 'Потеряла вещь', -3], ['🚿', 'Не подмылась / не сменила трусики', -2], ['🏃', 'Опоздала / выбежала в спешке', -3], ['🍽️', 'Посуда не убрана за собой', -3], ['🚰', 'Кран не закрыт', -3], ['👖', 'Вещи на полу или стуле', -3], ['💡', 'Свет оставлен включённым', -3], ['🧹', 'Не выполнила обязанность по дому', -2], ['😴', 'Легла спать позже на час и больше', -2], ['🗑️', 'Мусор не выброшен', -3], ['🦷', 'Не почистила зубы', -2], ['🧦', 'Грязные носки/трусы/майки спрятаны по углам', -3], ['🧺', 'Чистые вещи не разобраны по местам', -2], ['📖', 'Учебники и тетради не на месте', -2], ['🍽️', 'Не помыла руки перед едой', -2], ['🛏️', 'Не убрала постель', -3], ['🧽', 'Стол не вытерт после еды', -2], ['👟', 'Обувь не на месте', -2], ['🧴', 'Не расчесалась / не привела себя в порядок', -1], ['📱', 'Села за телефон/планшет без разрешения', -3], ['📱', 'Продление времени телефона на 1 час', -1]]
};

/* ===== Утилиты ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymd = v => { const m = String(v || '').match(/^\d{4}-\d{2}-\d{2}/); return m ? m[0] : ''; };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const J = (s, d) => { try { return JSON.parse(s) || d; } catch (e) { return d; } };
const levelIdx = (sum, goal) => goal > 0 ? Math.max(0, Math.min(4, Math.floor(sum / goal * 5))) : 0;
const pctOf = (sum, goal) => goal > 0 ? Math.max(0, Math.min(100, Math.round(sum / goal * 100))) : 0;
const fail = m => { throw new Error(m); };

/* ===== API-слой ===== */
const CH = new URLSearchParams(location.search).get('child');
const PW = () => sessionStorage.getItem('pw') || '';
let D = {};
async function load() {
  const q = CH ? '?child=' + encodeURIComponent(CH) : '?t=' + encodeURIComponent(PW());
  const r = await fetch(CFG.URL + q);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  D = j;
}
async function post(action, sheet, record) {
  const r = await fetch(CFG.URL, { method: 'POST', body: JSON.stringify({ action, sheet, record, token: CH ? '' : PW() }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Сервер отклонил запись');
  await load();
}

/* ===== Состояние ===== */
const S = { child: null, date: today(), tab: 'marks' };
const kids = () => (D.children || []).filter(c => c.active !== 'false');
const kid = () => (D.children || []).find(c => c.id == S.child);
const periods = () => (D.periods || []).filter(p => p.childId == S.child);
const active = () => periods().find(p => p.active == 'true');
const mets = p => (D.metrics || []).filter(m => m.childId == S.child && m.periodId == p.id);
const days = p => (D.days || []).filter(d => d.childId == S.child && d.periodId == p.id);
const sum = p => days(p).reduce((a, d) => a + Number(d.total || 0), 0);
function getDay(p, date) {
  const r = days(p).find(d => ymd(d.date) == date);
  return { childId: S.child, periodId: p.id, date, penalties: J(r && r.penalties, []), extra: J(r && r.extra, []), bonuses: J(r && r.bonuses, []), closed: r ? r.closed : 'false' };
}
function calc(p, d) {
  const k = kid(), ms = mets(p);
  const pen = d.penalties.reduce((a, id) => a + Number((ms.find(m => m.id == id) || {}).points || 0), 0);
  const ex = d.extra.reduce((a, x) => a + Number(x.points), 0);
  const bo = d.bonuses.reduce((a, x) => a + Number(x.points), 0);
  return Math.max(Number(k.floor), Number(k.base) + pen + ex + bo);
}
const saveDay = (p, d) => { d.total = calc(p, d); return post('save', 'days', { ...d, penalties: JSON.stringify(d.penalties), extra: JSON.stringify(d.extra), bonuses: JSON.stringify(d.bonuses) }); };

/* ===== UI-компоненты ===== */
function toast(t, bad) { const e = $('#toast'); e.textContent = t; e.className = bad ? 'bad show' : 'show'; setTimeout(() => e.className = '', 2500); }
async function act(fn, msg) {
  try { await fn(); render(); toast(msg || 'Сохранено'); } catch (e) { toast('Ошибка: ' + e.message, 1); }
}
function modal(title, fields, cb) {
  const m = $('#modal');
  m.innerHTML = `<div class="box"><h3>${esc(title)}</h3>${fields.map(f => `<label>${esc(f.l)}<input name="${f.k}" type="${f.t || 'text'}" value="${esc(f.v ?? '')}"></label>`).join('')}<div class="row"><button id="ok">OK</button><button id="no" class="sec">Отмена</button></div></div>`;
  m.hidden = false;
  $('#no').onclick = () => m.hidden = true;
  $('#ok').onclick = () => { const o = {}; m.querySelectorAll('input').forEach(i => o[i.name] = i.value.trim()); m.hidden = true; act(() => cb(o)); };
}
const prog = p => { const s = sum(p), L = levelIdx(s, Number(p.goal)); return `<div class="card">${esc(p.emoji)} <b>${esc(p.dream)}</b><div class="bar"><i style="width:${pctOf(s, Number(p.goal))}%"></i></div><small>${s} / ${p.goal} · ${CFG.LEVELS[L]}</small><div class="lv">${CFG.LEVELS.map((n, i) => `<span class="${i <= L ? 'on' : ''}">${n}</span>`).join('')}</div></div>`; };

/* ===== Родительский интерфейс ===== */
const TABS = { marks: 'Отметки', bonus: 'Предложения', notes: 'Уведомления', set: 'Настройки', cat: 'Справочник', arch: 'Архив', stat: 'Аналитика' };
const pendB = () => (D.bonuses || []).filter(x => x.childId == S.child && x.status == 'new');
const pendN = () => (D.notifications || []).filter(x => x.childId == S.child && (x.status == 'new' || x.status == 'later'));
const badge = t => { const n = t == 'bonus' ? pendB().length : t == 'notes' ? pendN().length : 0; return n ? `<span class="badge">${n}</span>` : ''; };
const mut = f => act(() => { const p = active(), d = getDay(p, S.date); f(d, p); return saveDay(p, d); });
const tog = id => mut(d => { const i = d.penalties.indexOf(id); i < 0 ? d.penalties.push(id) : d.penalties.splice(i, 1); });
const delExtra = i => mut(d => d.extra.splice(i, 1));
const closeDay = () => mut(d => d.closed = d.closed == 'true' ? 'false' : 'true');
const addExtra = () => modal('Прочий штраф', [{ k: 'text', l: 'За что' }, { k: 'pts', l: 'Баллы', t: 'number' }], o => { if (!o.text) fail('Укажите, за что'); return mut(d => d.extra.push({ text: o.text, points: -Math.abs(Number(o.pts) || 0) })); });
const bon = id => D.bonuses.find(b => b.id == id);
const approveWithPoints = (id, pts) => act(async () => {
  const b = bon(id), p = periods().find(x => x.id == b.periodId), d = getDay(p, ymd(b.date));
  const pt = Number(pts ?? b.points);
  d.bonuses.push({ id, text: b.text, points: pt });
  await saveDay(p, d);
  await post('save', 'bonuses', { ...b, points: pt, status: 'ok' });
});
const okB = id => approveWithPoints(id);
const editB = id => modal('Баллы бонуса', [{ k: 'pts', l: 'Баллы', t: 'number', v: bon(id).points }], o => approveWithPoints(id, Number(o.pts)));
const noB = id => act(() => post('save', 'bonuses', { ...bon(id), status: 'no' }));
const nst = (id, st) => act(() => post('save', 'notifications', { ...D.notifications.find(n => n.id == id), status: st }));

const addKid = () => modal('Новый ребёнок', [{ k: 'name', l: 'Имя' }, { k: 'id', l: 'Идентификатор для ссылки (латиница, можно пустым)' }, { k: 'base', l: 'Базовый день', t: 'number', v: CFG.BASE }, { k: 'floor', l: 'Флор', t: 'number', v: CFG.FLOOR }], async o => {
  const id = o.id || uid();
  if (!o.name) fail('Укажите имя');
  if (!/^[a-z][a-z0-9_-]*$/.test(id)) fail('ID: латиница, начинается с буквы, без пробелов');
  if ((D.children || []).some(c => c.id == id)) fail('Такой ID уже есть');
  await post('save', 'children', { ...o, id, active: 'true' });
  S.child = id;
});
const editKid = () => { const k = kid(); modal('Ребёнок', [{ k: 'name', l: 'Имя', v: k.name }, { k: 'base', l: 'Базовый день', t: 'number', v: k.base }, { k: 'floor', l: 'Флор', t: 'number', v: k.floor }], o => post('save', 'children', { ...k, ...o })); };
const hideKid = () => modal('Скрыть ребёнка? Данные сохранятся.', [], async () => { await post('save', 'children', { ...kid(), active: 'false' }); S.child = (kids()[0] || {}).id; });

const addPeriod = () => modal('Новый период', [{ k: 'name', l: 'Название' }, { k: 'start', l: 'Начало', t: 'date', v: today() }, { k: 'end', l: 'Конец', t: 'date' }, { k: 'goal', l: 'Цель (баллы)', t: 'number' }, { k: 'dream', l: 'Мечта' }, { k: 'emoji', l: 'Эмодзи', v: CFG.EMOJI[0] }], async o => {
  if (!o.name || !o.start || !o.end) fail('Заполните название и даты');
  if (o.end < o.start) fail('Конец раньше начала');
  if (!(Number(o.goal) > 0)) fail('Цель должна быть больше 0');
  if (!(D.catalog || []).length) fail('Справочник пуст — заполните его');
  const id = uid();
  await post('save', 'periods', { ...o, id, childId: S.child, active: 'false', archived: 'false' });
  await post('save', 'metrics', D.catalog.map(c => ({ childId: S.child, periodId: id, id: uid(), icon: c.icon, name: c.name, points: Number(c.points) })));
});
const activate = id => act(async () => {
  const old = periods().find(p => p.active == 'true');
  if (old) await post('save', 'periods', { ...old, active: 'false', archived: 'true' });
  await post('save', 'periods', { ...periods().find(p => p.id == id), active: 'true', archived: 'false' });
});
const metricForm = (title, c, save) => modal(title, [{ k: 'icon', l: 'Эмодзи', v: c.icon }, { k: 'name', l: 'Название', v: c.name }, { k: 'points', l: 'Баллы (минус)', t: 'number', v: c.points }], o => {
  if (!o.name) fail('Укажите название');
  return save({ ...c, ...o, points: -Math.abs(Number(o.points) || 0) });
});
const editM = id => { const p = active(), m = id ? mets(p).find(x => x.id == id) : { childId: S.child, periodId: p.id, id: uid(), icon: '❗', name: '', points: -1 }; metricForm('Штраф периода', m, r => post('save', 'metrics', r)); };
const delM = id => modal('Удалить штраф из периода?', [], () => post('delete', 'metrics', mets(active()).find(x => x.id == id)));
const editCat = id => { const c = id ? D.catalog.find(x => x.id == id) : { id: uid(), icon: '❗', name: '', points: -1 }; metricForm('Нарушение в справочнике', c, r => post('save', 'catalog', r)); };
const delCat = id => modal('Удалить из справочника? Периоды не изменятся.', [], () => post('delete', 'catalog', D.catalog.find(x => x.id == id)));
const fillCatalog = () => act(async () => {
  if ((D.catalog || []).length) fail('Справочник не пуст');
  await post('save', 'catalog', CFG.CATALOG.map(([icon, name, points], i) => ({ id: 'c' + (i + 1), icon, name, points })));
}, 'Справочник заполнен');

const line = (txt, pts, id, ed, del) => `<div class="line"><span class="grow">${txt}</span><b>${pts}</b><a onclick="${ed}('${id}')">✎</a><a onclick="${del}('${id}')">✕</a></div>`;
const P = {
  marks(k, p) {
    if (!p) return '<p>Нет активного периода — создайте и активируйте его в «Настройках».</p>';
    const d = getDay(p, S.date), ms = mets(p), tot = calc(p, d);
    return `<input type="date" value="${S.date}" min="${ymd(p.start)}" max="${ymd(p.end)}" onchange="S.date=this.value;render()">${prog(p)}
<div class="card">${ms.map(m => `<label class="line chk"><input type="checkbox" ${d.penalties.includes(m.id) ? 'checked' : ''} onchange="tog('${m.id}')"><span class="grow">${esc(m.icon || '')} ${esc(m.name)}</span><b>${m.points}</b></label>`).join('')}
${d.extra.map((x, i) => `<div class="line"><span class="grow">${esc(x.text)}</span><b>${x.points}</b><a onclick="delExtra(${i})">✕</a></div>`).join('')}
<div class="row"><button class="sec" onclick="addExtra()">+ Прочий штраф</button></div></div>
${d.bonuses.length ? `<div class="card">${d.bonuses.map(b => `<div class="line"><span class="grow">⭐ ${esc(b.text)}</span><b>+${b.points}</b></div>`).join('')}</div>` : ''}
<p class="tot">Итог дня: ${tot} ${d.closed == 'true' ? '✔' : ''}</p><button onclick="closeDay()">${d.closed == 'true' ? 'Открыть день' : 'Закрыть день'}</button>`;
  },
  bonus() { const b = pendB(); return b.length ? b.map(x => `<div class="card">${esc(ymd(x.date))}: ${esc(x.text)} <b>+${x.points}</b><div class="row"><button onclick="okB('${x.id}')">Принять</button><button class="sec" onclick="editB('${x.id}')">Изменить</button><button class="sec" onclick="noB('${x.id}')">Отклонить</button></div></div>`).join('') : '<p>Нет предложений</p>'; },
  notes(k) { const n = pendN(); return n.length ? n.map(x => `<div class="card">🎉 ${esc(k.name)} справилась с целью! (${x.status == 'later' ? 'отложено' : 'новое'})<div class="row"><button onclick="nst('${x.id}','ok')">Подтвердить</button><button class="sec" onclick="nst('${x.id}','later')">Отложить</button><button class="sec" onclick="nst('${x.id}','no')">Отклонить</button></div></div>`).join('') : '<p>Нет уведомлений</p>'; },
  set(k, p) {
    return `<div class="card"><b>${esc(k.name)}</b>: база ${k.base}, флор ${k.floor}<div class="row"><button class="sec" onclick="editKid()">Изменить</button><button class="sec" onclick="hideKid()">Скрыть</button></div><p>Ссылка ребёнка:<code>${esc(location.origin + location.pathname)}?child=${esc(k.id)}</code></p></div>
<h4>Периоды</h4>${periods().filter(x => x.archived != 'true').map(x => `<div class="card">${esc(x.emoji)} <b>${esc(x.name)}</b><br>${ymd(x.start)} → ${ymd(x.end)}, цель ${x.goal}<div class="row">${x == p ? '<b>Активный</b>' : `<button onclick="activate('${x.id}')">Активировать</button>`}</div></div>`).join('')}<button onclick="addPeriod()">+ Период</button>
${p ? `<h4>Штрафы активного периода</h4><div class="card">${mets(p).map(m => line(esc(m.icon || '') + ' ' + esc(m.name), m.points, m.id, 'editM', 'delM')).join('')}<div class="row"><button class="sec" onclick="editM()">+ Штраф</button></div></div>` : ''}`;
  },
  cat() {
    const c = D.catalog || [];
    return `<p>Шаблон для новых периодов. Уже созданные периоды не меняются.</p><div class="card">${c.map(x => line(esc(x.icon) + ' ' + esc(x.name), x.points, x.id, 'editCat', 'delCat')).join('') || 'Пусто'}<div class="row"><button class="sec" onclick="editCat()">+ Нарушение</button>${c.length ? '' : '<button onclick="fillCatalog()">Заполнить из шаблона</button>'}</div></div>`;
  },
  arch() { const a = periods().filter(p => p.archived == 'true'); return a.length ? a.map(p => `<div class="card">${esc(p.emoji)} <b>${esc(p.name)}</b><br>${ymd(p.start)} → ${ymd(p.end)}<br>${sum(p)} / ${p.goal} (${pctOf(sum(p), Number(p.goal))}%)</div>`).join('') : '<p>Архив пуст</p>'; },
  stat(k, p) {
    if (!p) return '<p>Нет активного периода</p>';
    const ds = days(p), s = sum(p), cnt = {};
    ds.forEach(d => J(d.penalties, []).forEach(id => cnt[id] = (cnt[id] || 0) + 1));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => { const m = mets(p).find(x => x.id == id) || {}; return `${esc(m.icon || '')} ${esc(m.name || id)} — ${n}`; });
    const avg = ds.length ? (s / ds.length).toFixed(1) : 0;
    const left = Math.max(0, Math.round((new Date(ymd(p.end)) - new Date(today())) / 864e5) + 1);
    const need = left ? ((Number(p.goal) - s) / left).toFixed(1) : '—';
    return `${prog(p)}<div class="card">Дней отмечено: <b>${ds.length}</b><br>Сумма: <b>${s}</b><br>Средний балл: <b>${avg}</b><br>Топ проблем:<br>${top.length ? top.join('<br>') : '—'}<br><br>${s >= p.goal ? 'Цель достигнута — обсудите награду.' : `Осталось дней: ${left}, нужно в среднем ${need} в день.`}</div>`;
  }
};
function renderParent() {
  const k = kid(), p = active();
  $('#app').innerHTML = `<header><select id="ks">${kids().map(c => `<option value="${esc(c.id)}" ${c.id == S.child ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button onclick="addKid()">+ Ребёнок</button></header>
<nav>${Object.entries(TABS).map(([t, n]) => `<button class="${S.tab == t ? 'on' : ''}" onclick="S.tab='${t}';render()">${n}${badge(t)}</button>`).join('')}</nav>${k && S.tab != 'cat' ? P[S.tab](k, p) : S.tab == 'cat' ? P.cat() : '<p>Добавьте первого ребёнка</p>'}`;
  const s = $('#ks'); if (s) s.onchange = () => { S.child = s.value; render(); };
}

/* ===== Детский интерфейс ===== */
const sendBonus = () => modal('Что ты сделала сверх нормы?', [{ k: 'text', l: 'Что сделала' }, { k: 'points', l: 'Сколько баллов предлагаешь', t: 'number' }], o => {
  if (!o.text) fail('Напиши, что сделала');
  return post('save', 'bonuses', { id: uid(), childId: S.child, periodId: active().id, date: today(), text: o.text, points: Math.abs(Number(o.points) || 0), status: 'new' });
});
const imDone = () => act(() => post('save', 'notifications', { id: uid(), childId: S.child, periodId: active().id, status: 'new', created: today() }), 'Родитель получил сообщение!');
function renderChild() {
  const k = kid(), p = active();
  if (!k) { $('#app').innerHTML = '<p class="err">Ребёнок не найден</p>'; return; }
  if (!p) { $('#app').innerHTML = `<h2>Привет, ${esc(k.name)}!</h2><p>Пока нет активного периода.</p>`; return; }
  const s = sum(p), cells = [];
  for (let t = Date.parse(ymd(p.start)), i = 0; t <= Date.parse(ymd(p.end)) && i < 100; t += 864e5, i++) {
    const dt = new Date(t).toISOString().slice(0, 10), r = days(p).find(d => ymd(d.date) == dt);
    cells.push(`<div>${dt.slice(8)}<b>${r ? r.total : '·'}</b></div>`);
  }
  const notified = (D.notifications || []).some(n => n.periodId == p.id && n.status != 'no');
  $('#app').innerHTML = `<h2>Привет, ${esc(k.name)}!</h2>${prog(p)}
${s >= Number(p.goal) && !notified ? '<button onclick="imDone()">🎉 Я справилась!</button>' : ''}
<h4>Календарь</h4><div class="cal">${cells.join('')}</div><p><button onclick="sendBonus()">⭐ Предложить бонус</button></p>`;
}

/* ===== Точка входа ===== */
const render = () => CH ? renderChild() : renderParent();
function login(msg) {
  $('#app').innerHTML = `<div class="card login"><h3>Вход для родителя</h3>${msg ? `<div class="err">${esc(msg)}</div>` : ''}<input id="pw" type="password" placeholder="Пароль"><button id="go">Войти</button></div>`;
  const go = () => { sessionStorage.setItem('pw', $('#pw').value); start(); };
  $('#go').onclick = go; $('#pw').onkeydown = e => e.key == 'Enter' && go();
}
async function start() {
  if (!CH && !PW()) return login();
  try {
    if (CH) S.child = CH;
    await load();
    if (!CH) {
      S.child = S.child || (kids()[0] || {}).id;
      if (!(D.catalog || []).length) await post('save', 'catalog', CFG.CATALOG.map(([icon, name, points], i) => ({ id: 'c' + (i + 1), icon, name, points })));
    }
    render();
  } catch (e) {
    if (e.message == 'AUTH') { sessionStorage.removeItem('pw'); return login('Неверный пароль'); }
    $('#app').innerHTML = '<p class="err">Не удалось загрузить данные: ' + esc(e.message) + '</p>';
  }
}
start();
