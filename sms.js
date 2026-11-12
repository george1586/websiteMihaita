/* ==========================================================================
   C&I Media — SMS opt-in form (sms-opt-in.html)
   Validates the form and POSTs it to the URL in the form's data-endpoint.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('smsForm');
  if (!form) return;

  var status = document.getElementById('smsStatus');
  var button = form.querySelector('button[type="submit"]');
  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var CONTACT = 'hello@c-and-i-media.com';

  var boxes = [
    { input: document.getElementById('s-consent-service'), text: document.getElementById('s-consent-service-text') },
    { input: document.getElementById('s-consent-marketing'), text: document.getElementById('s-consent-marketing-text') }
  ];

  var setStatus = function (msg, isError) {
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  };

  var clean = function (el) { return el.textContent.replace(/\s+/g, ' ').trim(); };

  var markField = function (input, bad) {
    var field = input.closest('.field');
    if (field) field.classList.toggle('is-error', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  };

  var validate = function () {
    var first = form.elements.first_name;
    var last = form.elements.last_name;
    var phone = form.elements.phone;
    var email = form.elements.email;
    var problems = [];

    var nameOk = function (input) {
      var ok = input.value.trim().length > 0;
      markField(input, !ok);
      if (!ok) problems.push(input);
    };
    nameOk(first);
    nameOk(last);

    var digits = phone.value.replace(/\D/g, '');
    var phoneOk = digits.length >= 10 && digits.length <= 15;
    markField(phone, !phoneOk);
    if (!phoneOk) problems.push(phone);

    var emailVal = email.value.trim();
    var emailOk = !emailVal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    markField(email, !emailOk);
    if (!emailOk) problems.push(email);

    var consentOk = boxes.some(function (b) { return b.input.checked; });
    form.classList.toggle('is-error-consent', !consentOk);

    if (problems.length) {
      problems[0].focus();
      setStatus(!phoneOk && problems.length === 1
        ? 'Please enter a valid mobile number, including the area code.'
        : 'Please check the highlighted fields.', true);
      return false;
    }
    if (!consentOk) {
      boxes[0].input.focus();
      setStatus('Tick at least one box to choose which text messages you want to receive.', true);
      return false;
    }
    return true;
  };

  var showDone = function (firstName) {
    form.innerHTML =
      '<div class="smsform__done" role="status">' +
        '<span class="tick" aria-hidden="true">&#10003;</span>' +
        '<p class="smsform__title"></p>' +
        '<p>You will get a confirmation text shortly. Reply STOP to any message to opt out, or HELP for help.</p>' +
      '</div>';
    form.querySelector('.smsform__title').textContent =
      firstName ? 'Thanks, ' + firstName + '. You’re signed up.' : 'You’re signed up.';
  };

  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('.field input')) markField(t, false);
    if (t.type === 'checkbox') form.classList.remove('is-error-consent');
    if (status.classList.contains('is-error')) setStatus('', false);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var firstName = form.elements.first_name.value.trim();

    // bots fill the hidden field; pretend it worked and send nothing
    if (form.elements._gotcha.value) { showDone(firstName); return; }

    if (!endpoint) {
      console.warn('[sms-opt-in] No data-endpoint set on #smsForm, so nothing was sent.');
      setStatus('Text sign-up is not connected yet. Please email ' + CONTACT + ' and we will add you.', true);
      return;
    }

    var data = new URLSearchParams();
    ['first_name', 'last_name', 'phone', 'email'].forEach(function (name) {
      data.append(name, form.elements[name].value.trim());
    });
    // keep a record of exactly what the person agreed to, and when
    boxes.forEach(function (b) {
      data.append(b.input.name, b.input.checked ? 'yes' : 'no');
      if (b.input.checked) data.append(b.input.name + '_text', clean(b.text));
    });
    data.append('consented_at', new Date().toISOString());
    data.append('source_url', window.location.href);

    button.disabled = true;
    button.textContent = 'Sending…';
    setStatus('', false);

    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showDone(firstName);
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = 'Sign me up';
        setStatus('Something went wrong. Please try again, or email ' + CONTACT + '.', true);
      });
  });
})();
