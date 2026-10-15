// ─── STORAGE MODULE ───────────────────────────────────────────────────────────
// Wraps window.localStorage with error handling and JSON serialisation.
// Requirements: 8.1, 8.2, 8.4, 12.2, 12.4, 12.5, 14.1, 14.3, 15.3
const StorageModule = {
  // load(key) → any[]
  // Reads localStorage[key] and parses JSON.
  // Returns [] if key is absent, data is corrupt, or localStorage is unavailable.
  load(key) {
    if (!this.isAvailable()) return [];
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[storage] corrupt data at key "' + key + '"');
      return [];
    }
  },

  // save(key, data) → { ok: boolean, error?: string }
  // JSON-serialises data and writes it to localStorage[key].
  // Returns { ok: false, error: 'quota' } on QuotaExceededError,
  //         { ok: false, error: 'unavailable' } if localStorage is inaccessible,
  //         { ok: true } on success.
  save(key, data) {
    if (!this.isAvailable()) return { ok: false, error: 'unavailable' };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return { ok: true };
    } catch (e) {
      if (
        e instanceof DOMException && (
          e.name === 'QuotaExceededError' ||
          e.code === 22 ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        )
      ) {
        return { ok: false, error: 'quota' };
      }
      return { ok: false, error: 'unknown' };
    }
  },

  // isAvailable() → boolean
  // Probes localStorage with a test write/delete.
  // Returns false if localStorage throws (private browsing, unsupported browser).
  isAvailable() {
    try {
      localStorage.setItem('__probe__', '1');
      localStorage.removeItem('__probe__');
      return true;
    } catch (e) {
      return false;
    }
  },
};

// ─── GREETING MODULE ──────────────────────────────────────────────────────────
// Updates the DOM every second with the current time, date, and greeting string.
// Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
const GreetingModule = {
  // init(rootEl) — starts the 1-second interval to keep the widget live.
  init(rootEl) {
    const timeEl    = document.getElementById('greeting-time');
    const dateEl    = document.getElementById('greeting-date');
    const messageEl = document.getElementById('greeting-message');

    function _update() {
      const now = new Date();
      if (isNaN(now.getTime())) {
        // Req 1.4, 2.7 — invalid Date fallback
        if (timeEl)    timeEl.textContent    = '--:--:--';
        if (dateEl)    dateEl.textContent    = 'Date unavailable';
        if (messageEl) messageEl.textContent = 'Hello';
      } else {
        if (timeEl)    timeEl.textContent    = GreetingModule.formatTime(now);
        if (dateEl)    dateEl.textContent    = GreetingModule.formatDate(now);
        if (messageEl) messageEl.textContent = GreetingModule.getGreetingForHour(now.getHours());
      }
    }

    _update();                        // Req 1.3 — show immediately on load
    setInterval(_update, 1000);       // Req 2.6 — update every second
  },

  // getGreetingForHour(hour) → string  (pure, exposed for testing)
  // hour: integer 0–23
  // Returns: "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"
  getGreetingForHour(hour) {
    // Req 2.1–2.5
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 21) return 'Good Evening';
    return 'Good Night';              // 0–4 and 22–23
  },

  // formatTime(date) → string  (pure, exposed for testing)
  // Returns: "HH:MM:SS" (24-hour), e.g. "09:05:34"
  formatTime(date) {
    if (!date || isNaN(date.getTime())) return '--:--:--'; // Req 1.4
    const pad = (n) => String(n).padStart(2, '0');
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  },

  // formatDate(date) → string  (pure, exposed for testing)
  // Returns: "Wednesday, 15 October 2026"
  formatDate(date) {
    if (!date || isNaN(date.getTime())) return 'Date unavailable'; // Req 1.4
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    }).format(date);
  },
};

// ─── TIMER MODULE ─────────────────────────────────────────────────────────────
// Manages a 25-minute countdown with Start, Stop, and Reset controls.
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
const TimerModule = {
  // init(rootEl) — renders the timer widget and binds control buttons.
  init(rootEl) {
    // ── closure state ──────────────────────────────────────────────────────
    let remainingSeconds = 1500;   // 25 × 60 — Req 3.1
    let intervalId       = null;
    let isRunning        = false;

    // ── DOM references ─────────────────────────────────────────────────────
    const display      = document.getElementById('timer-display');
    const notification = document.getElementById('timer-notification');
    const btnStart     = document.getElementById('timer-start');
    const btnStop      = document.getElementById('timer-stop');
    const btnReset     = document.getElementById('timer-reset');

    // ── button state helper ─────────────────────────────────────────────────
    function _updateButtons() {
      if (btnStart) btnStart.disabled = isRunning;
      if (btnStop)  btnStop.disabled  = !isRunning;
    }

    // ── render ──────────────────────────────────────────────────────────────
    function _renderDisplay() {
      if (display) display.textContent = TimerModule.formatMMSS(remainingSeconds);
    }

    // ── on complete ─────────────────────────────────────────────────────────
    // Req 3.6 — clear interval, show role="alert" notification for ≥5 s
    function _onComplete() {
      clearInterval(intervalId);
      intervalId = null;
      isRunning  = false;
      _renderDisplay();
      _updateButtons();
      if (notification) {
        notification.removeAttribute('hidden');
        notification.classList.add('visible');
        setTimeout(() => {
          notification.setAttribute('hidden', '');
          notification.classList.remove('visible');
        }, 5000);
      }
    }

    // ── tick ────────────────────────────────────────────────────────────────
    function _tick() {
      if (remainingSeconds <= 0) {
        _onComplete();
        return;
      }
      remainingSeconds--;
      _renderDisplay();
    }

    // ── start ───────────────────────────────────────────────────────────────
    // Req 3.8 — ignore duplicate start; Req 3.7 — auto-reset when at 0
    function _start() {
      if (isRunning) return;                  // Req 3.8
      if (remainingSeconds === 0) _reset();   // Req 3.7
      isRunning  = true;
      intervalId = setInterval(_tick, 1000);
      _updateButtons();
    }

    // ── stop ────────────────────────────────────────────────────────────────
    // Req 3.4 — pause countdown, retain remaining time
    function _stop() {
      if (!isRunning) return;
      clearInterval(intervalId);
      intervalId = null;
      isRunning  = false;
      _updateButtons();
    }

    // ── reset ───────────────────────────────────────────────────────────────
    // Req 3.5 — restore to 25:00 and stop
    function _reset() {
      clearInterval(intervalId);
      intervalId       = null;
      isRunning        = false;
      remainingSeconds = 1500;
      _renderDisplay();
      _updateButtons();
    }

    // ── wire events ─────────────────────────────────────────────────────────
    if (btnStart) btnStart.addEventListener('click', _start);
    if (btnStop)  btnStop.addEventListener('click',  _stop);
    if (btnReset) btnReset.addEventListener('click', _reset);

    // ── initial render ───────────────────────────────────────────────────────
    _renderDisplay();   // shows "25:00" on load
    _updateButtons();
  },

  // formatMMSS(totalSeconds) → string  (pure, exposed for testing)
  // Returns: "MM:SS" e.g. "25:00" or "04:59"
  // Requirements: 3.1, 3.3
  formatMMSS(totalSeconds) {
    const pad = (n) => String(n).padStart(2, '0');
    const mm  = Math.floor(totalSeconds / 60);
    const ss  = totalSeconds % 60;
    return pad(mm) + ':' + pad(ss);
  },
};

// ─── TODO MODULE ──────────────────────────────────────────────────────────────
// Full CRUD for tasks with LocalStorage persistence.
// Requirements: 4.1–4.5, 5.1–5.6, 6.1–6.4, 7.1–7.4, 8.1–8.4
const TodoModule = {
  // validateTaskDescription(raw) → { ok, trimmed?, error? }  (pure, exposed for testing)
  // Rejects empty / whitespace-only strings.
  // Returns error if trimmed length > 200.
  // Requirements: 4.2, 4.3, 5.3, 5.4
  validateTaskDescription(raw) {
    const trimmed = (raw || '').trim();
    if (trimmed.length === 0) return { ok: false, error: 'Task description cannot be empty.' };
    if (trimmed.length > 200) return { ok: false, error: 'Task description cannot exceed 200 characters.' };
    return { ok: true, trimmed };
  },

  // init(rootEl) — loads tasks from storage, renders the list, binds form events.
  // Requirements: 4.1–4.5, 5.1–5.6, 6.1–6.4, 7.1–7.4, 8.1–8.4
  init(rootEl) {
    let tasks     = [];
    let editingId = null;

    // ── DOM refs ────────────────────────────────────────────────────────────
    const form           = document.getElementById('todo-form');
    const input          = document.getElementById('todo-input');
    const validationMsg  = document.getElementById('todo-validation');
    const listEl         = document.getElementById('todo-list');
    const storageWarning = document.getElementById('storage-warning');

    // ── validation helpers ──────────────────────────────────────────────────
    function _showValidation(msg) {
      validationMsg.textContent = msg;
      validationMsg.removeAttribute('hidden');
    }

    function _clearValidation() {
      validationMsg.textContent = '';
      validationMsg.setAttribute('hidden', '');
    }

    // ── persist ─────────────────────────────────────────────────────────────
    // Req 8.1–8.4 — write tasks array to localStorage; surface storage errors
    function _persist() {
      const result = StorageModule.save('tasks', tasks);
      if (!result.ok) {
        if (result.error === 'quota') {
          _showValidation('Storage limit reached — data was not saved.');
        } else if (result.error !== 'unavailable') {
          _showValidation('Could not save tasks. Changes may be lost on reload.');
        }
      }
      return result;
    }

    // ── ID generator ────────────────────────────────────────────────────────
    function _genId() {
      return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).slice(2);
    }

    // ── add task ─────────────────────────────────────────────────────────────
    // Req 4.1–4.5 — validate, enforce 100-task cap, push, persist
    function _addTask(description) {
      const validation = TodoModule.validateTaskDescription(description);
      if (!validation.ok) {
        _showValidation(validation.error);
        return;
      }
      if (tasks.length >= 100) {
        _showValidation('Maximum task limit (100) reached.');
        return;
      }
      tasks.push({
        id:        _genId(),
        text:      validation.trimmed,
        completed: false,
        createdAt: Date.now(),
      });
      _clearValidation();
      input.value = '';
      _renderList();
      _persist();
    }

    // ── toggle complete ───────────────────────────────────────────────────────
    // Req 6.1–6.4 — flip completed flag, re-render, persist; revert on failure
    function _toggleComplete(id) {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      task.completed = !task.completed;
      _renderList();
      const result = _persist();
      if (result && !result.ok) {
        task.completed = !task.completed; // revert
        _renderList();
      }
    }

    // ── delete task ──────────────────────────────────────────────────────────
    // Req 7.1–7.4 — remove from array, re-render, persist; revert on failure
    function _deleteTask(id) {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return;
      const removed = tasks.splice(idx, 1)[0];
      _renderList();
      const result = _persist();
      if (result && !result.ok) {
        tasks.splice(idx, 0, removed); // revert
        _renderList();
      }
    }

    // ── edit mode ────────────────────────────────────────────────────────────
    // Req 5.6 — cancel any existing edit before opening another
    function _activateEdit(id) {
      if (editingId !== null && editingId !== id) {
        editingId = null; // silently cancel previous edit
      }
      editingId = id;
      _renderList();
    }

    // Req 5.3–5.5 — validate, update text, close edit mode, persist
    function _saveEdit(id) {
      const editInput = listEl.querySelector('input[data-edit-id="' + id + '"]');
      if (!editInput) return;
      const validation = TodoModule.validateTaskDescription(editInput.value);
      if (!validation.ok) {
        const errEl = editInput.closest('li').querySelector('.edit-validation');
        if (errEl) errEl.textContent = validation.error;
        return;
      }
      const task = tasks.find(t => t.id === id);
      if (task) task.text = validation.trimmed;
      editingId = null;
      _renderList();
      _persist();
    }

    function _cancelEdit() {
      editingId = null;
      _renderList();
    }

    // ── full DOM re-render ────────────────────────────────────────────────────
    // Req 5.1–5.6, 6.1–6.4, 7.1–7.4 — build list from in-memory tasks[]
    function _renderList() {
      listEl.innerHTML = '';
      tasks.forEach(task => {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed-task');

        if (editingId === task.id) {
          // ── edit mode row ─────────────────────────────────────────────────
          const editInput = document.createElement('input');
          editInput.type = 'text';
          editInput.maxLength = 512;
          editInput.value = task.text;
          editInput.setAttribute('data-edit-id', task.id);
          editInput.setAttribute('aria-label', 'Edit task');

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn-primary';
          saveBtn.setAttribute('aria-label', 'Save task edit');

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn-secondary';
          cancelBtn.setAttribute('aria-label', 'Cancel task edit');

          const errEl = document.createElement('span');
          errEl.className = 'edit-validation validation-msg';
          errEl.setAttribute('role', 'alert');

          saveBtn.addEventListener('click', () => _saveEdit(task.id));
          cancelBtn.addEventListener('click', _cancelEdit);
          editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')  _saveEdit(task.id);
            if (e.key === 'Escape') _cancelEdit();
          });

          li.appendChild(editInput);
          li.appendChild(saveBtn);
          li.appendChild(cancelBtn);
          li.appendChild(errEl);

        } else {
          // ── normal row ────────────────────────────────────────────────────
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = task.completed;
          checkbox.setAttribute('aria-label', 'Mark task complete');
          checkbox.addEventListener('change', () => _toggleComplete(task.id));

          const span = document.createElement('span');
          span.className = 'task-text';
          span.textContent = task.text;

          const editBtn = document.createElement('button');
          editBtn.textContent = '✏';
          editBtn.className = 'btn-icon';
          editBtn.setAttribute('aria-label', 'Edit task: ' + task.text);
          editBtn.addEventListener('click', () => _activateEdit(task.id));

          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = '✕';
          deleteBtn.className = 'btn-icon btn-danger';
          deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
          deleteBtn.addEventListener('click', () => _deleteTask(task.id));

          li.appendChild(checkbox);
          li.appendChild(span);
          li.appendChild(editBtn);
          li.appendChild(deleteBtn);
        }

        listEl.appendChild(li);
      });
    }

    // ── load from storage ─────────────────────────────────────────────────────
    // Req 8.1–8.2 — warn if unavailable; otherwise hydrate from JSON
    if (!StorageModule.isAvailable()) {
      if (storageWarning) {
        storageWarning.textContent = 'LocalStorage is unavailable. Data will not be saved.';
        storageWarning.removeAttribute('hidden');
      }
    } else {
      tasks = StorageModule.load('tasks');
    }

    // ── wire form ─────────────────────────────────────────────────────────────
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      _addTask(input.value);
    });

    // ── initial render ────────────────────────────────────────────────────────
    _renderList();
  },
};

// ─── QUICKLINKS MODULE ────────────────────────────────────────────────────────
// CRUD for quick links with LocalStorage persistence.
// Requirements: 9.1–9.5, 10.1–10.2, 11.1–11.4, 12.1–12.5
const QuickLinksModule = {
  // validateLink(label, url) → { ok, errors[] }  (pure, exposed for testing)
  // label: 1–50 chars (after trim)
  // url: 1–2048 chars, must start with "http://" or "https://"
  // Requirements: 9.2, 9.5
  validateLink(label, url) {
    const errors = [];
    const tLabel = (label || '').trim();
    const tUrl   = (url   || '').trim();
    if (tLabel.length === 0)      errors.push('Label is required.');
    if (tLabel.length > 50)       errors.push('Label cannot exceed 50 characters.');
    if (tUrl.length === 0)        errors.push('URL is required.');
    else if (tUrl.length > 2048)  errors.push('URL cannot exceed 2048 characters.');
    else if (!/^https?:\/\//i.test(tUrl)) errors.push('URL must start with http:// or https://.');
    return { ok: errors.length === 0, errors };
  },

  // init(rootEl) — loads links from storage, renders the panel, binds form events.
  // Requirements: 9.1–9.5, 10.1–10.2, 11.1–11.4, 12.1–12.5
  init(rootEl) {
    let links = [];

    // ── DOM refs ──────────────────────────────────────────────────────────
    const form           = document.getElementById('quicklinks-form');
    const labelInput     = document.getElementById('quicklinks-label-input');
    const urlInput       = document.getElementById('quicklinks-url-input');
    const validationMsg  = document.getElementById('quicklinks-validation');
    const listEl         = document.getElementById('quicklinks-list');
    const storageWarning = document.getElementById('storage-warning');

    // ── validation helpers ────────────────────────────────────────────────
    function _showValidation(msgs) {
      validationMsg.textContent = Array.isArray(msgs) ? msgs.join(' ') : msgs;
      validationMsg.removeAttribute('hidden');
    }

    function _clearValidation() {
      validationMsg.textContent = '';
      validationMsg.setAttribute('hidden', '');
    }

    // ── persist ───────────────────────────────────────────────────────────
    // Req 12.1–12.5 — write links array to localStorage; surface storage errors
    function _persist() {
      const result = StorageModule.save('quicklinks', links);
      if (!result.ok) {
        if (result.error === 'quota') {
          _showValidation('Storage limit reached — link was not saved.');
        } else {
          _showValidation('Could not save links. Changes may be lost on reload.');
        }
      }
      return result;
    }

    // ── ID generator ──────────────────────────────────────────────────────
    function _genId() {
      return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).slice(2);
    }

    // ── launch link ───────────────────────────────────────────────────────
    // Req 10.1–10.2 — validate URL before opening; show error if invalid
    function _launchLink(url) {
      if (!url || !/^https?:\/\//i.test(url.trim())) {
        _showValidation('Cannot open link: invalid URL.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // ── delete link ───────────────────────────────────────────────────────
    // Req 11.1–11.4 — remove from array, re-render, persist; revert on failure
    function _deleteLink(id) {
      const idx = links.findIndex(l => l.id === id);
      if (idx === -1) return;
      const removed = links.splice(idx, 1)[0];
      _renderLinks();
      const result = _persist();
      if (result && !result.ok) {
        links.splice(idx, 0, removed); // revert
        _renderLinks();
      }
    }

    // ── full DOM re-render ─────────────────────────────────────────────────
    // Req 9.3, 10.1, 11.1 — build link items from in-memory links[]
    function _renderLinks() {
      listEl.innerHTML = '';
      links.forEach(link => {
        const item = document.createElement('div');
        item.className = 'quicklink-item';

        const launchBtn = document.createElement('button');
        launchBtn.textContent = link.label;
        launchBtn.className = 'btn-primary quicklink-launch';
        launchBtn.setAttribute('aria-label', 'Open ' + link.label);
        launchBtn.addEventListener('click', () => _launchLink(link.url));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.className = 'btn-icon btn-danger';
        deleteBtn.setAttribute('aria-label', 'Delete ' + link.label);
        deleteBtn.addEventListener('click', () => _deleteLink(link.id));

        item.appendChild(launchBtn);
        item.appendChild(deleteBtn);
        listEl.appendChild(item);
      });
    }

    // ── add link ──────────────────────────────────────────────────────────
    // Req 9.1–9.5 — validate, push, persist, re-render
    function _addLink(label, url) {
      const validation = QuickLinksModule.validateLink(label, url);
      if (!validation.ok) {
        _showValidation(validation.errors);
        return;
      }
      links.push({ id: _genId(), label: label.trim(), url: url.trim() });
      _clearValidation();
      labelInput.value = '';
      urlInput.value   = '';
      _renderLinks();
      _persist();
    }

    // ── load from storage ─────────────────────────────────────────────────
    // Req 12.1–12.2 — warn if unavailable; otherwise hydrate from JSON
    if (!StorageModule.isAvailable()) {
      if (storageWarning) {
        storageWarning.textContent = 'LocalStorage is unavailable. Data will not be saved.';
        storageWarning.removeAttribute('hidden');
      }
    } else {
      links = StorageModule.load('quicklinks');
    }

    // ── wire form ─────────────────────────────────────────────────────────
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      _addLink(labelInput.value, urlInput.value);
    });

    // ── initial render ────────────────────────────────────────────────────
    _renderLinks();
  },
};

// ─── BOOTSTRAP ────────────────────────────────────────────────────────────────
// Initialises all widgets once the DOM is fully parsed.
// Requirements: 14.1, 15.2
document.addEventListener('DOMContentLoaded', () => {
  GreetingModule.init(document.getElementById('greeting-widget'));
  TimerModule.init(document.getElementById('timer-widget'));
  TodoModule.init(document.getElementById('todo-widget'));
  QuickLinksModule.init(document.getElementById('quicklinks-widget'));
});

// ─── TEST NAMESPACE ───────────────────────────────────────────────────────────
// Exposes pure functions for unit / property-based tests (fast-check + Vitest).
// Only attached when the test harness sets window.__TEST_MODE__ = true before
// loading this script, so production page loads are unaffected.
if (typeof window !== 'undefined' && window.__TEST_MODE__) {
  window.__test = {
    // StorageModule
    storageLoad:             StorageModule.load.bind(StorageModule),
    storageSave:             StorageModule.save.bind(StorageModule),
    storageIsAvailable:      StorageModule.isAvailable.bind(StorageModule),
    // GreetingModule
    getGreetingForHour:      GreetingModule.getGreetingForHour.bind(GreetingModule),
    formatTime:              GreetingModule.formatTime.bind(GreetingModule),
    formatDate:              GreetingModule.formatDate.bind(GreetingModule),
    // TimerModule
    formatMMSS:              TimerModule.formatMMSS.bind(TimerModule),
    // TodoModule
    validateTaskDescription: TodoModule.validateTaskDescription.bind(TodoModule),
    // QuickLinksModule
    validateLink:            QuickLinksModule.validateLink.bind(QuickLinksModule),
  };
}
