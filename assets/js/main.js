/* ==========================================================================
   Driftline Travel Co. — shared behaviour
   Vanilla JS, no dependencies. Every module is defensive: if its markup is not
   on the page, it exits quietly.
   --------------------------------------------------------------------------
   1.  Boot flags
   2.  Photo fallback (remote images)
   3.  Mobile navigation
   4.  Header dropdown
   5.  Accordions
   6.  Scroll reveal
   7.  Back to top
   8.  Cookie consent (Accept / Reject / Manage)
   9.  Form validation
   10. Newsletter forms
   11. Pricing billing toggle
   12. Filter chips
   13. Hero search widget
   14. Trip planner builder
   15. Packing checklist
   16. Budget estimator
   17. Footer year
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Boot flags -------------------------------------------------------- */
  document.documentElement.classList.add('js');

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function usd(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  /* 2. Photo fallback ----------------------------------------------------- */
  /* Remote photography can fail (offline, blocked host). Rather than showing a
     broken image icon we let the coastal gradient stand in and keep the alt
     text available to assistive tech. */
  function guardPhotos() {
    $$('.photo img').forEach(function (img) {
      function fail() {
        var wrap = img.closest('.photo');
        if (!wrap) { return; }
        wrap.classList.add('is-fallback');
        if (!wrap.getAttribute('data-label')) {
          wrap.setAttribute('data-label', img.getAttribute('alt') || '');
        }
      }
      if (img.complete && img.naturalWidth === 0) { fail(); }
      img.addEventListener('error', fail);
    });
  }

  /* 3. Mobile navigation -------------------------------------------------- */
  function mobileNav() {
    var toggle = $('[data-nav-toggle]');
    var drawer = $('[data-nav-drawer]');
    if (!toggle || !drawer) { return; }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('data-open', String(open));
      document.body.classList.toggle('nav-open', open);
      if (open) {
        var first = drawer.querySelector('a, button');
        if (first) { first.focus(); }
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { setOpen(false); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
      }
    });
  }

  /* 4. Header dropdown ---------------------------------------------------- */
  function dropdowns() {
    $$('.nav-drop').forEach(function (drop) {
      var btn = $('.nav-drop__btn', drop);
      var menu = $('.nav-drop__menu', drop);
      if (!btn || !menu) { return; }

      function close() {
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('data-open', 'false');
      }
      function open() {
        btn.setAttribute('aria-expanded', 'true');
        menu.setAttribute('data-open', 'true');
      }

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (btn.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
      });
      drop.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { close(); btn.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (!drop.contains(e.target)) { close(); }
      });
      drop.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!drop.contains(document.activeElement)) { close(); }
        }, 0);
      });
    });
  }

  /* 5. Accordions --------------------------------------------------------- */
  function accordions() {
    $$('.acc-btn').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) { return; }
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.setAttribute('data-open', String(!open));
      });
    });
  }

  /* 6. Scroll reveal ------------------------------------------------------ */
  /* Content is visible by default in CSS; the reveal only engages when JS runs
     and the visitor has not asked for reduced motion. */
  function reveals() {
    var items = $$('.reveal');
    if (!items.length) { return; }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* 7. Back to top -------------------------------------------------------- */
  function backToTop() {
    var btn = $('[data-to-top]');
    if (!btn) { return; }
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:600px;height:1px;width:1px;';
    document.body.appendChild(sentinel);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        btn.setAttribute('data-visible', String(!entries[0].isIntersecting));
      });
      io.observe(sentinel);
    } else {
      btn.setAttribute('data-visible', 'true');
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var skip = $('.skip-link');
      if (skip) { skip.focus(); }
    });
  }

  /* 8. Cookie consent ----------------------------------------------------- */
  /* Non-essential storage stays off until the visitor opts in. Planner and
     checklist data are strictly functional and are only written to
     localStorage after consent is recorded, or when the visitor explicitly
     asks to save. */
  var CONSENT_KEY = 'driftline_consent_v1';

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
  }

  function writeConsent(obj) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));
    } catch (err) { /* storage blocked; consent stays session-only */ }
    window.DriftlineConsent = obj;
  }

  window.DriftlineConsent = readConsent();

  function consentAllows(category) {
    var c = window.DriftlineConsent;
    return !!(c && c[category]);
  }

  function cookieBanner() {
    var banner = $('[data-cookie-banner]');
    var dialog = $('[data-prefs-dialog]');
    if (!banner) { return; }

    var existing = readConsent();
    if (!existing) {
      // Shown at the bottom of the viewport so it never blocks page content.
      banner.setAttribute('data-open', 'true');
    }

    function save(prefs) {
      prefs.date = new Date().toISOString();
      writeConsent(prefs);
      banner.setAttribute('data-open', 'false');
      if (dialog && dialog.open) { dialog.close(); }
    }

    $$('[data-consent]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-consent');
        if (action === 'accept') {
          save({ essential: true, analytics: true, ads: true, functional: true });
        } else if (action === 'reject') {
          save({ essential: true, analytics: false, ads: false, functional: false });
        } else if (action === 'manage' && dialog) {
          var cur = readConsent() || {};
          var a = $('#pref-analytics'); if (a) { a.checked = !!cur.analytics; }
          var d = $('#pref-ads'); if (d) { d.checked = !!cur.ads; }
          var f = $('#pref-functional'); if (f) { f.checked = !!cur.functional; }
          if (typeof dialog.showModal === 'function') { dialog.showModal(); }
        }
      });
    });

    if (dialog) {
      var saveBtn = $('[data-prefs-save]', dialog);
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          save({
            essential: true,
            analytics: !!($('#pref-analytics') && $('#pref-analytics').checked),
            ads: !!($('#pref-ads') && $('#pref-ads').checked),
            functional: !!($('#pref-functional') && $('#pref-functional').checked)
          });
        });
      }
      var cancelBtn = $('[data-prefs-cancel]', dialog);
      if (cancelBtn) { cancelBtn.addEventListener('click', function () { dialog.close(); }); }
    }

    // Any "cookie settings" link anywhere on the site reopens the manager.
    $$('[data-open-prefs]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var cur = readConsent() || {};
        var a = $('#pref-analytics'); if (a) { a.checked = !!cur.analytics; }
        var d = $('#pref-ads'); if (d) { d.checked = !!cur.ads; }
        var f = $('#pref-functional'); if (f) { f.checked = !!cur.functional; }
        if (dialog && typeof dialog.showModal === 'function') { dialog.showModal(); }
        else { banner.setAttribute('data-open', 'true'); }
      });
    });
  }

  /* 9. Form validation ---------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  var PHONE_RE = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

  function fieldOf(input) { return input.closest('.field') || input.parentElement; }

  function showError(input, message) {
    var wrap = fieldOf(input);
    if (!wrap) { return; }
    wrap.classList.add('has-error');
    var msg = wrap.querySelector('.error-msg');
    if (msg) { msg.textContent = message; }
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    var wrap = fieldOf(input);
    if (!wrap) { return; }
    wrap.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  }

  function validateInput(input) {
    var value = (input.value || '').trim();
    var label = input.getAttribute('data-label') || 'This field';

    if (input.hasAttribute('required') && !value && input.type !== 'checkbox') {
      showError(input, label + ' is required.');
      return false;
    }
    if (input.type === 'checkbox' && input.hasAttribute('required') && !input.checked) {
      showError(input, label + ' is required.');
      return false;
    }
    if (value && input.type === 'email' && !EMAIL_RE.test(value)) {
      showError(input, 'Enter a valid email address, for example name@example.com.');
      return false;
    }
    if (value && input.type === 'tel' && !PHONE_RE.test(value)) {
      showError(input, 'Enter a US phone number, for example +1 (310) 555-0147.');
      return false;
    }
    if (value && input.hasAttribute('minlength') && value.length < Number(input.getAttribute('minlength'))) {
      showError(input, label + ' needs at least ' + input.getAttribute('minlength') + ' characters.');
      return false;
    }
    clearError(input);
    return true;
  }

  function forms() {
    $$('form[data-validate]').forEach(function (form) {
      var status = form.querySelector('.form-status');
      var inputs = $$('input, select, textarea', form).filter(function (el) {
        return el.type !== 'hidden' && el.type !== 'submit';
      });

      inputs.forEach(function (input) {
        input.addEventListener('blur', function () {
          if (input.value || input.hasAttribute('required')) { validateInput(input); }
        });
        input.addEventListener('input', function () {
          if (fieldOf(input) && fieldOf(input).classList.contains('has-error')) { validateInput(input); }
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstBad = null;
        inputs.forEach(function (input) {
          if (!validateInput(input) && !firstBad) { firstBad = input; }
        });

        if (firstBad) {
          if (status) {
            status.classList.add('form-status--error');
            status.setAttribute('data-visible', 'true');
            status.textContent = 'Please fix the highlighted fields and send again.';
          }
          firstBad.focus();
          return;
        }

        if (status) {
          status.classList.remove('form-status--error');
          status.setAttribute('data-visible', 'true');
          status.textContent = form.getAttribute('data-success') ||
            'Thanks. Your message reached our Santa Monica team. We reply to every message within one business day.';
        }
        form.reset();
        inputs.forEach(clearError);
      });
    });
  }

  /* 10. Newsletter forms -------------------------------------------------- */
  function newsletters() {
    $$('form[data-newsletter]').forEach(function (form) {
      var input = $('input[type="email"]', form);
      var status = $('.form-status', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!input) { return; }
        if (!EMAIL_RE.test((input.value || '').trim())) {
          showError(input, 'Enter a valid email address so we can send the guide.');
          if (status) {
            status.classList.add('form-status--error');
            status.setAttribute('data-visible', 'true');
            status.textContent = 'That email address does not look right.';
          }
          input.focus();
          return;
        }
        clearError(input);
        if (status) {
          status.classList.remove('form-status--error');
          status.setAttribute('data-visible', 'true');
          status.textContent = 'You are on the list. Check your inbox for a confirmation link.';
        }
        form.reset();
      });
    });
  }

  /* 11. Pricing billing toggle -------------------------------------------- */
  function billingToggle() {
    var row = $('[data-billing-toggle]');
    if (!row) { return; }
    var buttons = $$('button', row);

    function apply(cycle) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-cycle') === cycle));
      });
      $$('[data-price-monthly]').forEach(function (el) {
        var monthly = el.getAttribute('data-price-monthly');
        var annual = el.getAttribute('data-price-annual');
        el.textContent = cycle === 'annual' ? annual : monthly;
      });
      $$('[data-cycle-label]').forEach(function (el) {
        el.textContent = cycle === 'annual'
          ? el.getAttribute('data-label-annual')
          : el.getAttribute('data-label-monthly');
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-cycle')); });
    });
    apply('monthly');
  }

  /* 12. Filter chips ------------------------------------------------------ */
  function filters() {
    $$('[data-filter-bar]').forEach(function (bar) {
      var targetSel = bar.getAttribute('data-filter-bar');
      var items = $$(targetSel + ' [data-tags]');
      var empty = $(targetSel + ' ~ [data-filter-empty]') || $('[data-filter-empty]');

      $$('.filter-chip', bar).forEach(function (chip) {
        chip.addEventListener('click', function () {
          var value = chip.getAttribute('data-filter');
          $$('.filter-chip', bar).forEach(function (c) {
            c.setAttribute('aria-pressed', String(c === chip));
          });
          var shown = 0;
          items.forEach(function (item) {
            var tags = (item.getAttribute('data-tags') || '').toLowerCase();
            var match = value === 'all' || tags.indexOf(value.toLowerCase()) > -1;
            item.style.display = match ? '' : 'none';
            if (match) { shown += 1; }
          });
          if (empty) { empty.style.display = shown ? 'none' : 'block'; }
        });
      });
    });
  }

  /* 13. Hero search widget ------------------------------------------------ */
  function heroSearch() {
    var form = $('[data-trip-search]');
    if (!form) { return; }
    var status = $('.form-status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var where = $('#search-where', form);
      var days = $('#search-days', form);
      var style = $('#search-style', form);
      if (where && !(where.value || '').trim()) {
        showError(where, 'Tell us a city, country or region to start.');
        where.focus();
        return;
      }
      if (where) { clearError(where); }
      var params = new URLSearchParams();
      if (where) { params.set('where', where.value.trim()); }
      if (days) { params.set('days', days.value); }
      if (style) { params.set('style', style.value); }
      if (status) {
        status.setAttribute('data-visible', 'true');
        status.textContent = 'Opening the planner with your starting point.';
      }
      window.location.href = 'trip-planner.html?' + params.toString();
    });
  }

  /* 14. Trip planner builder ---------------------------------------------- */
  var PLANNER_KEY = 'driftline_trip_v1';

  function planner() {
    var root = $('[data-planner]');
    if (!root) { return; }

    var listEl = $('[data-planner-days]', root);
    var addDayBtn = $('[data-add-day]', root);
    var titleInput = $('#trip-title');
    var travellersInput = $('#trip-travellers');
    var saveBtn = $('[data-planner-save]', root);
    var clearBtn = $('[data-planner-clear]', root);
    var exportBtn = $('[data-planner-export]', root);
    var saveNote = $('[data-planner-note]', root);

    var state = {
      title: 'My trip',
      travellers: 2,
      days: []
    };

    function blankDay(n) {
      return { title: 'Day ' + n, stops: [] };
    }

    function load() {
      var params = new URLSearchParams(window.location.search);
      var stored = null;
      try {
        var raw = window.localStorage.getItem(PLANNER_KEY);
        stored = raw ? JSON.parse(raw) : null;
      } catch (err) { stored = null; }

      if (stored && stored.days && stored.days.length) {
        state = stored;
      } else {
        var count = Math.min(Math.max(parseInt(params.get('days'), 10) || 3, 1), 14);
        state.title = params.get('where') ? params.get('where') + ' trip' : 'My trip';
        for (var i = 1; i <= count; i += 1) { state.days.push(blankDay(i)); }
        seedExample();
      }
      if (titleInput) { titleInput.value = state.title; }
      if (travellersInput) { travellersInput.value = state.travellers; }
    }

    // A first-run example so the builder is never an empty box.
    function seedExample() {
      if (!state.days.length) { return; }
      state.days[0].stops = [
        { time: '09:30 AM', name: 'Coffee and city orientation walk', cost: 18, hop: '10 min walk' },
        { time: '12:00 PM', name: 'Lunch near the waterfront', cost: 32, hop: '15 min transit' },
        { time: '02:30 PM', name: 'Museum or landmark visit', cost: 26, hop: '20 min transit' },
        { time: '07:00 PM', name: 'Dinner reservation', cost: 55, hop: '' }
      ];
    }

    function persist(explicit) {
      state.title = titleInput ? titleInput.value : state.title;
      state.travellers = travellersInput ? Number(travellersInput.value) || 1 : state.travellers;
      if (!explicit && !consentAllows('functional')) { return; }
      try {
        window.localStorage.setItem(PLANNER_KEY, JSON.stringify(state));
        if (saveNote) {
          saveNote.textContent = 'Saved to this browser on ' +
            new Date().toLocaleDateString('en-US') + '. Free accounts keep up to 2 trips.';
        }
      } catch (err) {
        if (saveNote) { saveNote.textContent = 'This browser blocked local storage, so the trip was not saved.'; }
      }
    }

    function dayCost(day) {
      return day.stops.reduce(function (sum, s) { return sum + (Number(s.cost) || 0); }, 0);
    }

    function tripCost() {
      return state.days.reduce(function (sum, d) { return sum + dayCost(d); }, 0);
    }

    function renderSummary() {
      var stops = state.days.reduce(function (n, d) { return n + d.stops.length; }, 0);
      var perPerson = tripCost();
      var people = travellersInput ? (Number(travellersInput.value) || 1) : 1;
      var set = function (sel, text) { var el = $(sel, root); if (el) { el.textContent = text; } };
      set('[data-sum-days]', String(state.days.length));
      set('[data-sum-stops]', String(stops));
      set('[data-sum-perday]', state.days.length ? usd(perPerson / state.days.length) : '$0');
      set('[data-sum-person]', usd(perPerson));
      set('[data-sum-total]', usd(perPerson * people));
    }

    function render() {
      if (!listEl) { return; }
      listEl.innerHTML = '';

      state.days.forEach(function (day, dIdx) {
        var wrap = document.createElement('article');
        wrap.className = 'builder-day';

        var head = document.createElement('div');
        head.className = 'builder-day__head';
        head.innerHTML =
          '<h3>Day ' + (dIdx + 1) + '<span class="visually-hidden"> plan</span></h3>' +
          '<span class="pill">' + usd(dayCost(day)) + ' per person</span>';

        var removeDay = document.createElement('button');
        removeDay.type = 'button';
        removeDay.className = 'icon-btn icon-btn--danger';
        removeDay.setAttribute('aria-label', 'Remove day ' + (dIdx + 1));
        removeDay.textContent = '×';
        removeDay.addEventListener('click', function () {
          state.days.splice(dIdx, 1);
          render();
          persist();
        });
        head.appendChild(removeDay);
        wrap.appendChild(head);

        var ul = document.createElement('ul');
        ul.className = 'builder-stops';

        if (!day.stops.length) {
          var li = document.createElement('li');
          li.className = 'builder-empty';
          li.textContent = 'No stops yet. Add a museum, a hike, a long lunch.';
          li.style.gridTemplateColumns = '1fr';
          ul.appendChild(li);
        }

        day.stops.forEach(function (stop, sIdx) {
          var li = document.createElement('li');

          var time = document.createElement('span');
          time.className = 'stop-time';
          time.textContent = stop.time;

          var body = document.createElement('div');
          body.innerHTML = '<strong>' + escapeHtml(stop.name) + '</strong>' +
            (stop.hop ? '<span class="day-hop">→ ' + escapeHtml(stop.hop) + '</span>' : '');

          var right = document.createElement('div');
          right.style.display = 'flex';
          right.style.alignItems = 'center';
          right.style.gap = '0.5rem';

          var cost = document.createElement('span');
          cost.className = 'stop-cost';
          cost.textContent = usd(stop.cost);

          var del = document.createElement('button');
          del.type = 'button';
          del.className = 'icon-btn icon-btn--danger';
          del.setAttribute('aria-label', 'Remove ' + stop.name);
          del.textContent = '×';
          del.addEventListener('click', function () {
            day.stops.splice(sIdx, 1);
            render();
            persist();
          });

          right.appendChild(cost);
          right.appendChild(del);
          li.appendChild(time);
          li.appendChild(body);
          li.appendChild(right);
          ul.appendChild(li);
        });

        wrap.appendChild(ul);

        var form = document.createElement('form');
        form.className = 'builder-add';
        form.style.padding = '0 1.5rem 1.25rem';
        form.innerHTML =
          '<div class="grid grid--4" style="gap:0.6rem">' +
          '<label class="field" style="margin:0"><span class="field-label">Time</span>' +
          '<input type="text" value="10:00 AM" aria-label="Stop time for day ' + (dIdx + 1) + '"></label>' +
          '<label class="field" style="margin:0;grid-column:span 2"><span class="field-label">Stop</span>' +
          '<input type="text" placeholder="Blue Lagoon soak" aria-label="Stop name for day ' + (dIdx + 1) + '"></label>' +
          '<label class="field" style="margin:0"><span class="field-label">Cost (USD)</span>' +
          '<input type="number" min="0" step="1" value="0" aria-label="Stop cost for day ' + (dIdx + 1) + '"></label>' +
          '</div>' +
          '<label class="field" style="margin:0 0 0.75rem"><span class="field-label">Travel time to the next stop</span>' +
          '<input type="text" placeholder="25 min drive" aria-label="Travel time after this stop on day ' + (dIdx + 1) + '"></label>' +
          '<button class="btn btn--sm btn--primary" type="submit">Add stop</button>';

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var f = $$('input', form);
          var name = (f[1].value || '').trim();
          if (!name) { f[1].focus(); return; }
          day.stops.push({
            time: (f[0].value || '').trim() || '10:00 AM',
            name: name,
            cost: Number(f[2].value) || 0,
            hop: (f[3].value || '').trim()
          });
          render();
          persist();
        });

        wrap.appendChild(form);
        listEl.appendChild(wrap);
      });

      renderSummary();
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    }

    if (addDayBtn) {
      addDayBtn.addEventListener('click', function () {
        if (state.days.length >= 14) { return; }
        state.days.push(blankDay(state.days.length + 1));
        render();
        persist();
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', function () { persist(true); });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!window.confirm('Clear every day and stop in this trip?')) { return; }
        state = { title: 'My trip', travellers: 2, days: [blankDay(1)] };
        if (titleInput) { titleInput.value = state.title; }
        try { window.localStorage.removeItem(PLANNER_KEY); } catch (err) { /* ignore */ }
        render();
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', function () { window.print(); });
    }
    if (travellersInput) {
      travellersInput.addEventListener('input', function () { renderSummary(); persist(); });
    }
    if (titleInput) {
      titleInput.addEventListener('input', function () { persist(); });
    }

    load();
    render();
  }

  /* 15. Packing checklist ------------------------------------------------- */
  function checklists() {
    $$('[data-checklist]').forEach(function (list) {
      var key = 'driftline_check_' + list.getAttribute('data-checklist');
      var boxes = $$('input[type="checkbox"]', list);
      var bar = $('[data-checklist-progress="' + list.getAttribute('data-checklist') + '"]');
      var count = $('[data-checklist-count="' + list.getAttribute('data-checklist') + '"]');

      function paint() {
        var done = boxes.filter(function (b) { return b.checked; }).length;
        if (bar) { bar.style.width = boxes.length ? (done / boxes.length * 100) + '%' : '0%'; }
        if (count) { count.textContent = done + ' of ' + boxes.length + ' packed'; }
      }

      if (consentAllows('functional')) {
        try {
          var saved = JSON.parse(window.localStorage.getItem(key) || '[]');
          boxes.forEach(function (b, i) { b.checked = !!saved[i]; });
        } catch (err) { /* ignore */ }
      }

      boxes.forEach(function (b) {
        b.addEventListener('change', function () {
          paint();
          if (consentAllows('functional')) {
            try {
              window.localStorage.setItem(key, JSON.stringify(boxes.map(function (x) { return x.checked; })));
            } catch (err) { /* ignore */ }
          }
        });
      });

      var reset = $('[data-checklist-reset="' + list.getAttribute('data-checklist') + '"]');
      if (reset) {
        reset.addEventListener('click', function () {
          boxes.forEach(function (b) { b.checked = false; });
          try { window.localStorage.removeItem(key); } catch (err) { /* ignore */ }
          paint();
        });
      }
      var printBtn = $('[data-checklist-print="' + list.getAttribute('data-checklist') + '"]');
      if (printBtn) { printBtn.addEventListener('click', function () { window.print(); }); }

      paint();
    });
  }

  /* 16. Budget estimator -------------------------------------------------- */
  function budgetTool() {
    var tool = $('[data-budget-tool]');
    if (!tool) { return; }
    var out = $('[data-budget-out]', tool);

    function recalc() {
      var nights = Number($('#bt-nights', tool).value) || 0;
      var people = Number($('#bt-people', tool).value) || 1;
      var flight = Number($('#bt-flight', tool).value) || 0;
      var hotel = Number($('#bt-hotel', tool).value) || 0;
      var food = Number($('#bt-food', tool).value) || 0;
      var activity = Number($('#bt-activity', tool).value) || 0;
      var ground = Number($('#bt-ground', tool).value) || 0;

      var lodging = hotel * nights;
      var daily = (food + activity + ground) * (nights + 1);
      var perPerson = flight + daily + (lodging / Math.max(people, 1));
      var total = (flight * people) + (daily * people) + lodging;

      $('[data-bd-flights]', tool).textContent = usd(flight * people);
      $('[data-bd-lodging]', tool).textContent = usd(lodging);
      $('[data-bd-daily]', tool).textContent = usd(daily * people);
      $('[data-bd-person]', tool).textContent = usd(perPerson);
      if (out) { out.textContent = usd(total); }

      var buffer = $('[data-bd-buffer]', tool);
      if (buffer) { buffer.textContent = usd(total * 0.15); }
    }

    $$('input, select', tool).forEach(function (el) {
      el.addEventListener('input', recalc);
      el.addEventListener('change', recalc);
    });
    recalc();
  }

  /* 17. Footer year ------------------------------------------------------- */
  function footerYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* Boot ------------------------------------------------------------------ */
  function init() {
    guardPhotos();
    mobileNav();
    dropdowns();
    accordions();
    reveals();
    backToTop();
    cookieBanner();
    forms();
    newsletters();
    billingToggle();
    filters();
    heroSearch();
    planner();
    checklists();
    budgetTool();
    footerYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
