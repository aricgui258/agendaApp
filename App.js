/* ── app.js ── */
'use strict';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const state = {
  reminders: JSON.parse(localStorage.getItem('reminders') || '[]'),
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  events: JSON.parse(localStorage.getItem('events') || '[]'),
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calSelected: new Date().toISOString().slice(0, 10),
  activeTab: 'reminders',
  reminderFilter: 'all',
  selectedEventColor: '#3b82f6',
};

function save() {
  localStorage.setItem('reminders', JSON.stringify(state.reminders));
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
  localStorage.setItem('events', JSON.stringify(state.events));
}

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function formatDateTime(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

// ─────────────────────────────────────────────
// Header date
// ─────────────────────────────────────────────
function renderHeaderDate() {
  const el = document.getElementById('header-date');
  el.textContent = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    state.activeTab = tab;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`section-${tab}`).classList.add('active');

    // Show/hide FAB
    document.getElementById('fab-reminder').classList.toggle('hidden', tab !== 'reminders');
  });
});

// ─────────────────────────────────────────────
// REMINDERS
// ─────────────────────────────────────────────
function renderReminders() {
  const list = document.getElementById('reminder-list');
  const empty = document.getElementById('reminders-empty');
  const count = document.getElementById('reminders-count');
  const filter = state.reminderFilter;

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  let items = [...state.reminders];
  if (filter === 'today') items = items.filter(r => r.datetime && r.datetime.slice(0, 10) === today);
  if (filter === 'week') items = items.filter(r => r.datetime && r.datetime.slice(0, 10) <= weekEnd);
  if (filter === 'done') items = items.filter(r => r.done);
  if (filter !== 'done') items = items.sort((a, b) => Number(a.done) - Number(b.done));

  count.textContent = state.reminders.filter(r => !r.done).length;
  list.innerHTML = '';

  if (items.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  items.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="reminder-card prio-${r.priority} ${r.done ? 'done-card' : ''}">
        <button class="r-check ${r.done ? 'checked' : ''}" data-id="${r.id}" title="Completar">
          ${r.done ? '✓' : ''}
        </button>
        <div class="r-body">
          <div class="r-title" style="${r.done ? 'text-decoration:line-through;color:var(--text-sub)' : ''}">${r.title}</div>
          ${r.desc ? `<div class="r-desc">${r.desc}</div>` : ''}
          <div class="r-meta">
            ${r.datetime ? `<span class="r-time">📅 ${formatDateTime(r.datetime)}</span>` : ''}
            <span class="r-prio-tag ${r.priority}">${r.priority === 'high' ? 'Alta' : r.priority === 'med' ? 'Media' : 'Baja'}</span>
          </div>
        </div>
        <button class="r-delete" data-id="${r.id}" title="Eliminar">🗑</button>
      </div>`;
    list.appendChild(li);
  });

  list.querySelectorAll('.r-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = state.reminders.find(x => x.id === btn.dataset.id);
      if (r) { r.done = !r.done; save(); renderReminders(); }
    });
  });
  list.querySelectorAll('.r-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      state.reminders = state.reminders.filter(x => x.id !== btn.dataset.id);
      save(); renderReminders();
    });
  });
}

// Filter chips
document.querySelectorAll('#section-reminders .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#section-reminders .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.reminderFilter = chip.dataset.filter;
    renderReminders();
  });
});

// FAB → open modal
document.getElementById('fab-reminder').addEventListener('click', () => openModal('modal-reminder'));

// Save reminder
document.getElementById('save-reminder').addEventListener('click', () => {
  const title = document.getElementById('r-title').value.trim();
  if (!title) { document.getElementById('r-title').focus(); return; }
  state.reminders.unshift({
    id: uid(),
    title,
    desc: document.getElementById('r-desc').value.trim(),
    datetime: document.getElementById('r-datetime').value,
    priority: document.querySelector('input[name="r-priority"]:checked').value,
    done: false,
  });
  save(); renderReminders();
  closeModal('modal-reminder');
});

// ─────────────────────────────────────────────
// PLANNING
// ─────────────────────────────────────────────
function renderPlanning() {
  const pendingList = document.getElementById('pending-list');
  const progressList = document.getElementById('progress-list');
  const doneList = document.getElementById('done-list');
  const empty = document.getElementById('planning-empty');

  pendingList.innerHTML = progressList.innerHTML = doneList.innerHTML = '';

  const pending = state.tasks.filter(t => t.status === 'pending');
  const progress = state.tasks.filter(t => t.status === 'progress');
  const done = state.tasks.filter(t => t.status === 'done');

  document.getElementById('pending-count').textContent = pending.length;
  document.getElementById('progress-count').textContent = progress.length;
  document.getElementById('done-count').textContent = done.length;

  empty.classList.toggle('hidden', state.tasks.length > 0);

  function renderTaskCard(t, listEl) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="task-card">
        <div class="task-body">
          <div class="task-title">${t.title}</div>
          ${t.desc ? `<div class="task-desc">${t.desc}</div>` : ''}
        </div>
        <div class="task-actions">
          ${t.status !== 'done' ? `<button class="task-action-btn" data-id="${t.id}" data-action="advance" title="Avanzar">▶</button>` : ''}
          ${t.status !== 'pending' ? `<button class="task-action-btn" data-id="${t.id}" data-action="back" title="Retroceder">◀</button>` : ''}
          <button class="task-action-btn" data-id="${t.id}" data-action="delete" title="Eliminar">🗑</button>
        </div>
      </div>`;
    listEl.appendChild(li);

    li.querySelectorAll('.task-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = state.tasks.find(x => x.id === btn.dataset.id);
        if (!task) return;
        const act = btn.dataset.action;
        if (act === 'advance') task.status = task.status === 'pending' ? 'progress' : 'done';
        if (act === 'back') task.status = task.status === 'done' ? 'progress' : 'pending';
        if (act === 'delete') state.tasks = state.tasks.filter(x => x.id !== btn.dataset.id);
        save(); renderPlanning();
      });
    });
  }

  pending.forEach(t => renderTaskCard(t, pendingList));
  progress.forEach(t => renderTaskCard(t, progressList));
  done.forEach(t => renderTaskCard(t, doneList));
}

document.getElementById('add-task-btn').addEventListener('click', () => openModal('modal-task'));

document.getElementById('save-task').addEventListener('click', () => {
  const title = document.getElementById('t-title').value.trim();
  if (!title) { document.getElementById('t-title').focus(); return; }
  state.tasks.push({
    id: uid(),
    title,
    desc: document.getElementById('t-desc').value.trim(),
    status: document.getElementById('t-status').value,
  });
  save(); renderPlanning();
  closeModal('modal-task');
});

// ─────────────────────────────────────────────
// MINI CALENDAR
// ─────────────────────────────────────────────
function renderCalendar() {
  const cal = document.getElementById('mini-calendar');
  const year = state.calYear, month = state.calMonth;
  const today = new Date().toISOString().slice(0, 10);

  const eventDays = new Set(state.events.map(e => e.date));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Monday start

  const monthName = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  let html = `
    <div class="cal-nav">
      <button class="cal-nav-btn" id="cal-prev">‹</button>
      <span class="cal-month">${monthName}</span>
      <button class="cal-nav-btn" id="cal-next">›</button>
    </div>
    <div class="cal-grid">
      ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<div class="cal-day-name">${d}</div>`).join('')}
  `;

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevDays - i;
    html += `<div class="cal-day other-month">${d}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === state.calSelected;
    const hasEvent = eventDays.has(dateStr);
    html += `<div class="cal-day${isToday ? ' today' : ''}${isSelected && !isToday ? ' selected' : ''}${hasEvent ? ' has-event' : ''}" data-date="${dateStr}">${d}</div>`;
  }

  const remaining = 42 - (startOffset + daysInMonth);
  for (let d = 1; d <= remaining && remaining < 7; d++) {
    html += `<div class="cal-day other-month">${d}</div>`;
  }

  html += '</div>';
  cal.innerHTML = html;

  cal.querySelector('#cal-prev').addEventListener('click', () => {
    if (--state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });
  cal.querySelector('#cal-next').addEventListener('click', () => {
    if (++state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });
  cal.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      state.calSelected = el.dataset.date;
      renderCalendar();
      renderAgendaTimeline();
    });
  });
}

// ─────────────────────────────────────────────
// AGENDA TIMELINE
// ─────────────────────────────────────────────
function renderAgendaTimeline() {
  const timeline = document.getElementById('agenda-timeline');
  const empty = document.getElementById('agenda-empty');

  const dayEvents = state.events
    .filter(e => e.date === state.calSelected)
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  timeline.innerHTML = '';

  const label = document.createElement('div');
  label.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-sub);padding:4px 0 8px;text-transform:capitalize';
  label.textContent = new Date(state.calSelected + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  timeline.appendChild(label);

  if (dayEvents.length === 0) {
    const em = empty.cloneNode(true);
    em.removeAttribute('id');
    em.classList.remove('hidden');
    timeline.appendChild(em);
    return;
  }

  dayEvents.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-color-bar" style="background:${ev.color}"></div>
      <div class="event-body">
        <div class="event-title">${ev.title}</div>
        <div class="event-time">${ev.start ? formatTime(ev.start) : ''}${ev.end ? ' – ' + formatTime(ev.end) : ''}</div>
      </div>
      <button class="event-delete" data-id="${ev.id}" title="Eliminar">🗑</button>`;
    timeline.appendChild(card);

    card.querySelector('.event-delete').addEventListener('click', () => {
      state.events = state.events.filter(x => x.id !== ev.id);
      save(); renderCalendar(); renderAgendaTimeline();
    });
  });
}

// Event modal
document.getElementById('add-event-btn').addEventListener('click', () => {
  document.getElementById('e-date').value = state.calSelected;
  openModal('modal-event');
});

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    state.selectedEventColor = dot.dataset.color;
  });
});

document.getElementById('save-event').addEventListener('click', () => {
  const title = document.getElementById('e-title').value.trim();
  if (!title) { document.getElementById('e-title').focus(); return; }
  const date = document.getElementById('e-date').value || state.calSelected;
  state.events.push({
    id: uid(),
    title,
    date,
    start: document.getElementById('e-start').value,
    end: document.getElementById('e-end').value,
    color: state.selectedEventColor,
  });
  save(); renderCalendar(); renderAgendaTimeline();
  closeModal('modal-event');
});

// ─────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────
function openModal(id) {
  resetModal(id);
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function resetModal(id) {
  document.querySelectorAll(`#${id} input, #${id} textarea`).forEach(el => el.value = '');
  document.querySelectorAll(`#${id} select`).forEach(el => el.selectedIndex = 0);
  const radioLow = document.querySelector('input[name="r-priority"][value="low"]');
  if (radioLow) radioLow.checked = true;
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
renderHeaderDate();
renderReminders();
renderPlanning();
renderCalendar();
renderAgendaTimeline();
