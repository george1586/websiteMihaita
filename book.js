/* ==========================================================================
   C&I Media — booking page
   Step 1 is the Typeform live embed. Step 2 is Calendly, revealed on submit.
   This file loads before the Typeform SDK so the data-tf-on-* callbacks exist
   by the time the embed initialises.
   ========================================================================== */
(function () {
  'use strict';

  var STORE_KEY = 'cim.booking';
  var STORE_TTL = 24 * 60 * 60 * 1000; // a refresh within a day lands straight on step 2
  var LOAD_TIMEOUT = 12000;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var card        = document.getElementById('bookCard');
  var stepForm    = document.getElementById('stepForm');
  var stepCal     = document.getElementById('stepCal');
  var sceneForm   = document.getElementById('sceneForm');
  var sceneCal    = document.getElementById('sceneCal');
  var tfHost      = document.getElementById('tfHost');
  var tfLoader    = document.getElementById('tfLoader');
  var tfFallback  = document.getElementById('tfFallback');
  var calHost     = document.getElementById('calHost');
  var calLoader   = document.getElementById('calLoader');
  var calFallback = document.getElementById('calFallback');
  var booked      = document.getElementById('booked');
  var restoreBar  = document.getElementById('restoreBar');
  var restart     = document.getElementById('restart');

  if (!card || !stepForm || !stepCal || !sceneForm || !sceneCal || !tfHost || !calHost) return;

  /* ---------- remember a finished form for a day ---------- */
  var readState = function () {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      return s && s.t && Date.now() - s.t < STORE_TTL ? s : null;
    } catch (e) { return null; }
  };
  var writeState = function (s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  };
  var clearState = function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  };

  /* ---------- loaders ---------- */
  var hideLoader = function (el) {
    if (!el || el.hidden || el.classList.contains('is-out')) return;
    el.classList.add('is-out');
    setTimeout(function () { el.hidden = true; }, 500);
  };

  // Run fn once the iframe an SDK injects into host has loaded.
  var onIframeLoad = function (host, fn) {
    var hooked = false;
    var hook = function () {
      var frame = host.querySelector('iframe');
      if (!frame || hooked) return;
      hooked = true;
      frame.addEventListener('load', fn, { once: true });
    };
    hook();
    if (!hooked && 'MutationObserver' in window) {
      var mo = new MutationObserver(function () { hook(); if (hooked) mo.disconnect(); });
      mo.observe(host, { childList: true, subtree: true });
    }
  };

  // Never leave a spinner sitting over an embed: after a while drop it and offer a plain link.
  var armFallback = function (loader, fallback) {
    setTimeout(function () {
      if (!loader || loader.hidden || loader.classList.contains('is-out')) return;
      hideLoader(loader);
      if (fallback) fallback.hidden = false;
    }, LOAD_TIMEOUT);
  };

  /* ---------- steps ---------- */
  var setStep = function (n) {
    [stepForm, stepCal].forEach(function (li, i) {
      var idx = i + 1;
      li.classList.toggle('is-active', idx === n);
      li.classList.toggle('is-done', idx < n);
      if (idx === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    var formMeta = stepForm.querySelector('.stp__meta');
    var calMeta = stepCal.querySelector('.stp__meta');
    if (formMeta && n > 1) formMeta.textContent = 'Done';
    if (calMeta && n > 2) calMeta.textContent = 'Booked';
  };

  /* ---------- step 2: Calendly ---------- */
  var calStarted = false;

  var startCalendly = function (responseId) {
    if (calStarted) return;
    calStarted = true;

    // Keep the branded URL from data-url and tag the booking so it can be matched
    // with the Typeform answers later (Calendly keeps UTM values on the event).
    var url = calHost.getAttribute('data-url');
    url += (url.indexOf('?') > -1 ? '&' : '?') + 'utm_source=website&utm_medium=booking-page';
    if (responseId) url += '&utm_content=tf_' + encodeURIComponent(responseId);

    var init = function () {
      if (!window.Calendly || typeof window.Calendly.initInlineWidget !== 'function') return false;
      window.Calendly.initInlineWidget({ url: url, parentElement: calHost, inlineStyles: true, resize: true });
      return true;
    };
    if (!init()) { // widget.js loads async; try until it is there
      var tries = 0;
      var timer = setInterval(function () {
        if (init() || ++tries > 150) clearInterval(timer);
      }, 100);
    }

    onIframeLoad(calHost, function () { setTimeout(function () { hideLoader(calLoader); }, 700); });
    armFallback(calLoader, calFallback);
  };

  var onBooked = function () {
    setStep(3);
    if (booked) booked.hidden = false;
    if (restoreBar) restoreBar.hidden = true;
  };

  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
    if (e.data.event === 'calendly.event_type_viewed') hideLoader(calLoader);
    if (e.data.event === 'calendly.event_scheduled') onBooked();
  });

  /* ---------- switching scenes ---------- */
  var showStep2 = function (responseId, instant) {
    setStep(2);
    startCalendly(responseId);
    if (tfFallback) tfFallback.hidden = true;

    var swap = function () {
      sceneForm.hidden = true;
      sceneForm.classList.remove('is-leaving');
      sceneCal.classList.add('is-entering');
      sceneCal.hidden = false;
      void sceneCal.offsetHeight; // commit the start state before animating in
      requestAnimationFrame(function () { sceneCal.classList.remove('is-entering'); });
      if (!instant) {
        card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        try { sceneCal.focus({ preventScroll: true }); } catch (err) { /* older browsers */ }
      }
    };

    if (instant || reduced) { swap(); return; }
    sceneForm.classList.add('is-leaving');
    setTimeout(swap, 380);
  };

  /* ---------- step 1: Typeform ---------- */
  var done = false;
  var onFormDone = function (responseId) {
    if (done) return;
    done = true;
    writeState({ t: Date.now(), rid: responseId || '' });
    showStep2(responseId, false);
  };

  // Called by the SDK through data-tf-on-ready / data-tf-on-submit on the embed element.
  window.cimTypeformReady = function () { hideLoader(tfLoader); };
  window.cimTypeformSubmit = function (payload) { onFormDone(payload && payload.responseId); };

  // Belt and braces: the form posts the same events to the page as messages.
  window.addEventListener('message', function (e) {
    if (!/^https:\/\/[a-z0-9.-]*typeform\.(com|eu)$/.test(e.origin)) return;
    if (!e.data || typeof e.data.type !== 'string') return;
    if (e.data.type === 'form-ready') hideLoader(tfLoader);
    if (e.data.type === 'form-submit') onFormDone(e.data.responseId);
  });

  /* ---------- go ---------- */
  var saved = readState();
  if (saved) {
    tfHost.removeAttribute('data-tf-live'); // no need to load the form again
    if (restoreBar) restoreBar.hidden = false;
    showStep2(saved.rid, true);
  } else {
    onIframeLoad(tfHost, function () { setTimeout(function () { hideLoader(tfLoader); }, 1200); });
    armFallback(tfLoader, tfFallback);
  }

  if (restart) {
    restart.addEventListener('click', function (e) {
      e.preventDefault();
      clearState();
      window.location.reload();
    });
  }
})();
