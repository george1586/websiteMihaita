/* ==========================================================================
   C&I Media — interactions
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- current year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- sticky nav shadow ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileMenu.hidden = !open;
    };

    burger.addEventListener('click', function () { setMenu(mobileMenu.hidden); });
    mobileMenu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduced || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealEls.forEach(function (el) {
      var siblings = Array.prototype.filter.call(
        el.parentNode.children,
        function (c) { return c.classList.contains('reveal'); }
      );
      var i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 60, 420) + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---------- letter-by-letter paragraphs ---------- */
  document.querySelectorAll('[data-letters]').forEach(function (block) {
    var text = block.textContent.replace(/\s+/g, ' ').trim();

    if (reduced || !hasIO) { block.textContent = text; return; }

    var frag = document.createDocumentFragment();
    text.split(' ').forEach(function (word, wi, words) {
      var wordEl = document.createElement('span');
      wordEl.style.display = 'inline-block';
      wordEl.style.whiteSpace = 'nowrap';
      word.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'letter';
        s.textContent = ch;
        wordEl.appendChild(s);
      });
      frag.appendChild(wordEl);
      if (wi < words.length - 1) {
        var space = document.createElement('span');
        space.className = 'letter';
        space.textContent = ' ';
        frag.appendChild(space);
      }
    });

    block.textContent = '';
    block.appendChild(frag);

    var letters = block.querySelectorAll('.letter');
    var lit = false;
    var letterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || lit) return;
        lit = true;
        letters.forEach(function (l, i) {
          setTimeout(function () { l.classList.add('is-lit'); }, i * 9);
        });
        letterObserver.disconnect();
      });
    }, { threshold: 0.25 });
    letterObserver.observe(block);
  });

  /* ---------- process: the rail mirrors the card level with the focus line ---------- */
  var processEl = document.getElementById('process');
  var steps     = document.querySelectorAll('.pstep');
  var railNum   = document.getElementById('railNum');
  var railPhase = document.getElementById('railPhase');
  var railItems = document.querySelectorAll('#railPhases .rail__item');
  var railBar   = document.getElementById('railBar');
  var rail      = processEl ? processEl.querySelector('.rail') : null;

  if (processEl && steps.length && railNum && railPhase) {
    var total = steps.length;
    var currentCard = null;
    var DEAD_ZONE = 14; // px a new card must win by before it takes over

    var phaseNames = Array.prototype.map.call(railItems, function (li) { return li.textContent; });

    var setActive = function (card) {
      if (card === currentCard) return;
      currentCard = card;

      var n = parseInt(card.getAttribute('data-step'), 10);
      var phase = card.getAttribute('data-phase');

      steps.forEach(function (s) { s.classList.toggle('is-active', s === card); });

      // Crossfade the big number rather than snapping it.
      var label = (n < 10 ? '0' : '') + n;
      if (reduced) {
        railNum.textContent = label;
      } else {
        railNum.classList.add('is-swapping');
        setTimeout(function () {
          railNum.textContent = label;
          railNum.classList.remove('is-swapping');
        }, 180);
      }

      if (phaseNames[phase]) railPhase.textContent = phaseNames[phase];

      railItems.forEach(function (li) {
        var p = parseInt(li.getAttribute('data-phase'), 10);
        li.classList.toggle('is-active', String(p) === phase);
        li.classList.toggle('is-done', p < parseInt(phase, 10));
      });

      if (railBar) railBar.style.width = (n / total * 100) + '%';
    };

    // Where "in focus" is on screen. Desktop: level with the big number in
    // the rail, so the number and the highlighted card always line up.
    // Phones: a little above centre, where the eye rests while reading.
    var focusLine = function () {
      if (window.innerWidth >= 900) {
        var r = railNum.getBoundingClientRect();
        if (r.height) {
          var numCentre = r.top + r.height / 2;
          // The rail only sticks inside the grid. Near the bottom it is
          // released and scrolls up together with the last cards, so the
          // number can never catch up with 08 and 09. Once that happens,
          // keep the focus line where the number sat while it was stuck.
          if (rail) {
            var stickTop = parseFloat(getComputedStyle(rail).top);
            if (!isNaN(stickTop)) {
              var stuckCentre = stickTop + (numCentre - rail.getBoundingClientRect().top);
              return Math.max(numCentre, stuckCentre);
            }
          }
          return numCentre;
        }
      }
      return window.innerHeight * 0.42;
    };

    var centreOf = function (el) {
      var r = el.getBoundingClientRect();
      return (r.top + r.bottom) / 2;
    };

    // Pick the card whose centre is nearest the focus line. The switch lands
    // at the midpoint between two cards — never on one that has barely
    // appeared — and the dead zone stops it fluttering right at that point.
    var pick = function () {
      var y = focusLine();
      var best = null, bestD = Infinity;
      steps.forEach(function (s) {
        var d = Math.abs(centreOf(s) - y);
        if (d < bestD) { bestD = d; best = s; }
      });
      if (!best) return;
      if (!currentCard) { setActive(best); return; }
      var curD = Math.abs(centreOf(currentCard) - y);
      if (best !== currentCard && bestD + DEAD_ZONE < curD) setActive(best);
    };

    var ticking = false;
    var onScrollPick = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { pick(); ticking = false; });
    };

    // Only listen while the section is anywhere near the screen.
    if (hasIO) {
      var sectionWatch = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            window.addEventListener('scroll', onScrollPick, { passive: true });
            pick();
          } else {
            window.removeEventListener('scroll', onScrollPick);
          }
        });
      }, { rootMargin: '15% 0px 15% 0px' });
      sectionWatch.observe(processEl);
    } else {
      window.addEventListener('scroll', onScrollPick, { passive: true });
    }
    window.addEventListener('resize', pick);

    setActive(steps[0]);
  }

  /* ---------- watch-before-you-book playlist (ARIA tabs) ---------- */
  var tabs  = Array.prototype.slice.call(document.querySelectorAll('.playlist__item'));
  var panes = Array.prototype.slice.call(document.querySelectorAll('.playlist__pane'));

  if (tabs.length && panes.length) {
    var pauseAll = function () {
      document.querySelectorAll('wistia-player').forEach(function (p) {
        try { if (typeof p.pause === 'function') p.pause(); } catch (e) { /* not ready yet */ }
      });
    };

    var select = function (tab, focus) {
      var target = tab.getAttribute('data-pane');
      pauseAll();
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      panes.forEach(function (p) { p.hidden = p.id !== target; });
      if (focus) tab.focus();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  }

  /* ---------- FAQ: one open at a time ---------- */
  var faqItems = document.querySelectorAll('.faq .qa');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) { if (other !== item) other.open = false; });
    });
  });

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var ok = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field');
        var valid = input.checkValidity() && input.value.trim() !== '';
        if (field) field.classList.toggle('is-error', !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        status.classList.add('is-error');
        status.textContent = 'Please fill in your name and a valid email.';
        return;
      }

      // TODO: point this at your real endpoint (Calendly, Typeform, your API…).
      status.classList.remove('is-error');
      status.textContent = 'Form submitted. We will get back to you shortly.';
      form.reset();
    });

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('is-error');
    });
  }
})();
