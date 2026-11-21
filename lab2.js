(function () {
  'use strict';

  const FLAG = 'FLAG{PR0T0_L3DG3R_P0LLUT3D}';
  const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

  function findPollutedPayload(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(obj, '__proto__')) {
      const val = obj['__proto__'];
      if (val && typeof val === 'object') return val;
    }
    if (
      Object.prototype.hasOwnProperty.call(obj, 'constructor') &&
      obj.constructor &&
      typeof obj.constructor === 'object' &&
      Object.prototype.hasOwnProperty.call(obj.constructor, 'prototype') &&
      obj.constructor.prototype &&
      typeof obj.constructor.prototype === 'object'
    ) {
      return obj.constructor.prototype;
    }
    for (const key of Object.keys(obj)) {
      if (DANGEROUS_KEYS.includes(key) && obj[key] && typeof obj[key] === 'object') {
        return obj[key];
      }
      if (obj[key] && typeof obj[key] === 'object') {
        const nested = findPollutedPayload(obj[key]);
        if (nested) return nested;
      }
    }
    return null;
  }

  function evaluateProto(rawInput, isPatched) {
    const trimmed = String(rawInput || '').trim() || '{"displayName":"Tariq","favorite":"Solar Mango"}';
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return {
        kind: 'blocked',
        isAttack: false,
        worksNormal: false,
        blocked: true,
        flag: null,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop/club/reviewers?error=invalid-json',
        statusText: '400 Bad JSON · Reviewer profile JSON syntax could not be parsed',
        headline: 'Invalid JSON Input',
        detail: 'Enter a valid JSON object such as {"displayName":"Tariq","favorite":"Solar Mango"}.',
        consequenceRisky: false,
        pollutedProps: null,
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        kind: 'blocked',
        isAttack: false,
        worksNormal: false,
        blocked: true,
        flag: null,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop/club/reviewers',
        statusText: '400 Expected JSON Object · Profile payload must be an object',
        headline: 'Expected JSON Object',
        detail: 'Profile updates require a JSON object.',
        consequenceRisky: false,
        pollutedProps: null,
      };
    }

    const pollutedProps = findPollutedPayload(parsed);

    if (!pollutedProps) {
      const displayName = typeof parsed.displayName === 'string' ? parsed.displayName : 'Tariq';
      const favorite = typeof parsed.favorite === 'string' ? parsed.favorite : 'Solar Mango';
      return {
        kind: 'harmless',
        isAttack: false,
        worksNormal: true,
        blocked: false,
        flag: null,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop/club/reviewers',
        statusText: '200 OK · Updated Juice Club reviewer card for ' + displayName,
        headline: 'Reviewer Profile Saved Cleanly',
        detail:
          'Updated reviewer "' +
          displayName +
          '" (favorite: ' +
          favorite +
          '). All reviewers remain at standard 1x loyalty points.',
        consequenceRisky: false,
        pollutedProps: null,
      };
    }

    if (!isPatched) {
      const multiplier = pollutedProps.multiplier !== undefined ? pollutedProps.multiplier : 9999;
      const vip = pollutedProps.vip !== undefined ? pollutedProps.vip : true;
      return {
        kind: 'exploited',
        isAttack: true,
        worksNormal: false,
        blocked: false,
        flag: FLAG,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop/club/reviewers?status=ledger-corrupted',
        statusText:
          '200 EXPLOITED · Object.prototype polluted! All reviewers gained vip=' +
          vip +
          ', multiplier=' +
          multiplier,
        headline: 'Juice Club Ledger Corrupted!',
        detail:
          'The vulnerable recursive merge followed a special property path and wrote onto Object.prototype. The simulated reviewer renderer reads those inherited fields, so every Top Reviewer card now displays vip: ' +
          String(vip) +
          ' and multiplier: ' +
          String(multiplier) +
          '!',
        consequenceRisky: true,
        pollutedProps: { vip: vip, multiplier: multiplier },
      };
    }

    return {
      kind: 'blocked',
      isAttack: true,
      worksNormal: false,
      blocked: true,
      flag: null,
      host: 'heliosjuice.shop',
      isExternalHost: false,
      displayUrl: 'https://heliosjuice.shop/club/reviewers?status=keys-sanitized',
      statusText: '403 Blocked · Dangerous prototype keys stripped & null-prototype map enforced',
      headline: 'Attack Blocked by Prototype Key Guard',
      detail:
        'The patched copier skips __proto__, constructor, and prototype at every depth and creates null-prototype dictionaries. Every reviewer stays at 1x points.',
      consequenceRisky: true,
      pollutedProps: null,
    };
  }

  window.SHIELDQUEST_LAB = {
    id: 'lab2',
    number: 2,
    slug: 'prototype-pollution',
    title: 'Prototype Pollution',
    shopTarget: 'Juice Club, Top Reviewers',
    flag: FLAG,
    defenseSummary:
      'Skip dangerous keys (__proto__, constructor, prototype), freeze Object.prototype, and store untrusted data in null-prototype objects (Object.create(null)).',
    defaultCustomInput: '{"__proto__":{"vip":true,"multiplier":9999}}',
    customInputLabel: 'Profile JSON',
    customInputPlaceholder: '{"__proto__":{"vip":true,"multiplier":9999}}',
    initialUrl: 'https://heliosjuice.shop/club/reviewers',
    initialTabTitle: 'Helios Juice Shop — Juice Club',
    initialStatus: 'Ready · Juice Club Top Reviewers leaderboard loaded',

    slides: [
      {
        tag: 'Slide 1 · Title',
        title: 'Prototype Pollution in the Juice Club Ledger',
        points: [
          'Target: Helios Juice Shop — Juice Club, Top Reviewers profile updater.',
          'Goal: Learn how a hidden __proto__ key in JSON corrupts every object in memory.',
          'Impact: Standard loyalty accounts suddenly gain VIP status and a 9999x points multiplier.',
        ],
      },
      {
        tag: 'Slide 2 · The Idea',
        title: 'What Is Prototype Pollution?',
        points: [
          'In JavaScript, regular objects inherit shared fallback properties from Object.prototype.',
          'If an app recursively merges user JSON without blocking special property names, keys like __proto__ reach that shared prototype.',
          'Objects inherit the injected properties, but an application impact occurs only when existing code (a gadget) reads and trusts those inherited values; this demo’s reviewer renderer does that.',
          'OWASP WSTG-INJT-21 (Prototype Pollution testing) · CWE-1321. This is a specific weakness, not a standalone OWASP Top 10 category.',
        ],
      },
      {
        tag: 'Slide 3 · Why It Works',
        title: 'Why Recursive Merge Functions Poison the Graph',
        points: [
          'JSON.parse(\'{"__proto__":{"vip":true,"multiplier":9999}}\') creates an own enumerable property named "__proto__".',
          'A recursive merge follows inherited target properties: target.__proto__ is Object.prototype, so nested keys are written onto the shared prototype. The constructor.prototype path can reach the same object when functions are traversed.',
          'Any reviewer missing an explicit vip or multiplier property inherits the poisoned values.',
        ],
      },
      {
        tag: 'Slide 4 · The Fix',
        title: 'Skip Keys, Freeze Prototype & Use Null-Prototype Maps',
        points: [
          'Reject or skip "__proto__", "constructor", and "prototype" inside every merge step.',
          'Never recursively merge untrusted keys into ordinary objects.',
          'Build nested dictionaries with Object.create(null), which has no inherited prototype chain.',
        ],
      },
      {
        tag: 'Slide 5 · Discussion Questions',
        title: 'Think Like a Security Team',
        points: [
          'Why is blocking only "__proto__" insufficient if an attacker sends "constructor.prototype"?',
          'Why does Object.create(null) protect lookup dictionaries from prototype inheritance?',
          'How could a silent multiplier bug break e-commerce loyalty or coupon systems?',
        ],
      },
    ],

    quiz: [
      {
        question: 'Which special key in a Juice Club profile JSON reaches the shared JavaScript prototype?',
        options: ['__proto__', '__header__', '__discount__', '__origin__'],
        correctIndex: 0,
        explanation:
          'Writing to target["__proto__"] inside a naive merge accesses and mutates the shared Object.prototype.',
      },
      {
        question: 'What happens in the Helios Juice Club once Object.prototype is polluted with multiplier: 9999?',
        options: [
          'Only the attacker account gets 2x points',
          'Unrelated reviewer objects inherit vip: true and multiplier: 9999',
          'CSS styles automatically turn green',
          'Browser bookmarks are deleted',
        ],
        correctIndex: 1,
        explanation:
          'Every regular object that falls back to Object.prototype inherits the injected vip and multiplier values.',
      },
      {
        question: 'Besides "__proto__", which key path can also reach Object.prototype in recursive merges?',
        options: ['"constructor.prototype"', '"theme.dark"', '"user.email"', '"cart.items"'],
        correctIndex: 0,
        explanation:
          'Traversing target["constructor"]["prototype"] reaches the same shared Object.prototype object.',
      },
      {
        question: 'Which trio of defenses stops prototype pollution thoroughly?',
        options: [
          'Lowercase all strings and add a CSS border',
          'Skip dangerous keys, freeze Object.prototype, and use null-prototype objects',
          'Replace JSON with query strings only',
          'Reload the page every 5 seconds',
        ],
        correctIndex: 1,
        explanation:
          'Blocking dangerous keys, freezing the prototype, and using Object.create(null) give layered defense.',
      },
      {
        question: 'Why do we test a harmless JSON profile after applying the Developer patch?',
        options: [
          'To confirm normal reviewer updates still work while attacks are blocked',
          'To increase the points multiplier to 9999',
          'To delete the Top Reviewers leaderboard',
          'To bypass CSP frame-ancestors',
        ],
        correctIndex: 0,
        explanation:
          'A fix is only verified when both malicious payloads are blocked and legitimate profile updates continue working.',
      },
    ],

    userChoices: [
      {
        id: 'u2-safe',
        type: 'safe',
        label: 'Update favorite flavor normally ({"displayName":"Tariq","favorite":"Solar Mango"})',
        description: 'Tariq picks his favorite Helios juice blend from the profile form.',
        input: '{"displayName":"Tariq","favorite":"Solar Mango"}',
        consequenceVulnerable:
          'Safe choice! Tariq updated his Juice Club card cleanly with normal 1x loyalty points.',
        consequencePatched:
          'Safe choice! Tariq’s favorite flavor saved cleanly inside the null-prototype store.',
      },
      {
        id: 'u2-risky1',
        type: 'risky',
        label: 'Paste a "Free VIP Multiplier" config from a forum (__proto__ trick)',
        description: 'Someone claimed pasting this JSON snippet boosts Juice Club rewards.',
        input: '{"__proto__":{"vip":true,"multiplier":9999}}',
        consequenceVulnerable:
          'Whoa! Tariq’s paste polluted the shared prototype — every reviewer card suddenly flipped to VIP with a 9999x multiplier!',
        consequencePatched:
          'Safe! Even though Tariq pasted the risky forum JSON, Kareem’s key guard blocked __proto__ and kept the ledger intact.',
      },
      {
        id: 'u2-risky2',
        type: 'risky',
        label: 'Import a "Pro Reviewer Template" using constructor.prototype',
        description: 'Another shared snippet claiming to unlock hidden reviewer badges.',
        input: '{"constructor":{"prototype":{"vip":true,"multiplier":9999}}}',
        consequenceVulnerable:
          'Yikes! That template used constructor.prototype to poison the whole Juice Club ledger!',
        consequencePatched:
          'Blocked! Kareem’s patch rejected the constructor key and protected the Juice Club reviewers.',
      },
    ],

    payloads: [
      {
        id: 'p2-harmless',
        kind: 'harmless',
        badge: 'Harmless',
        title: 'Normal Reviewer Update',
        value: '{"displayName":"Tariq","favorite":"Solar Mango"}',
        description: 'Clean profile update setting display name and favorite Helios juice.',
      },
      {
        id: 'p2-attack1',
        kind: 'attack',
        badge: 'Attack 1',
        title: '__proto__ Ledger Poison',
        value: '{"__proto__":{"vip":true,"multiplier":9999}}',
        description: 'Injects vip: true and multiplier: 9999 onto Object.prototype via __proto__.',
      },
      {
        id: 'p2-attack2',
        kind: 'attack',
        badge: 'Attack 2',
        title: 'Constructor Prototype Bypass',
        value: '{"constructor":{"prototype":{"vip":true,"multiplier":9999}}}',
        description: 'Reaches Object.prototype through constructor.prototype to corrupt all objects.',
      },
    ],

    hints: [
      'Open Source code → HTML to read the DEV NOTE comment on how Juice Club merges profile JSON.',
      'Try submitting a JSON object whose top-level key targets the shared JavaScript prototype chain.',
      'Submit {"__proto__":{"vip":true,"multiplier":9999}} or {"constructor":{"prototype":{"vip":true,"multiplier":9999}}}.',
    ],

    code: {
      vulnerableLines: [
        '// Helios Juice Club — recursive profile merge (VULNERABLE)',
        'function deepMerge(target, source) {',
        '  for (const key of Object.keys(source)) {',
        '    const value = source[key];',
        '    if (value && typeof value === "object") {',
        '      const current = target[key];',
        '      if (current && (typeof current === "object" || typeof current === "function")) {',
        '        deepMerge(current, value); // BUG: follows __proto__ / constructor.prototype',
        '      } else { target[key] = value; }',
        '    } else { target[key] = value; }',
        '  }',
        '  return target;',
        '}',
        'function saveReviewerProfile(jsonInput) {',
        '  return deepMerge({}, JSON.parse(jsonInput)); // later UI code reads inherited vip / multiplier',
        '}',
      ],
      vulnerableHighlightLines: [8],
      fixedLines: [
        '// Helios Juice Club — safe profile merge (FIXED)',
        'const BLOCKED = new Set(["__proto__", "constructor", "prototype"]);',
        'function copySafe(target, source) {',
        '  for (const key of Object.keys(source)) {',
        '    if (BLOCKED.has(key)) continue;',
        '    const value = source[key];',
        '    if (Array.isArray(value)) {',
        '      target[key] = value.map(item => item && typeof item === "object"',
        '        ? copySafe(Object.create(null), item) : item);',
        '    } else if (value && typeof value === "object") {',
        '      target[key] = copySafe(Object.create(null), value);',
        '    } else { target[key] = value; }',
        '  }',
        '  return target;',
        '}',
        'function saveReviewerProfile(jsonInput) {',
        '  return copySafe(Object.create(null), JSON.parse(jsonInput));',
        '}',
      ],
      fixedHighlightLines: [2, 5, 8, 11, 16],
    },

    evaluate: evaluateProto,

    renderStartViewport: function (currentInput, _isPatched, _isAnimating, highlightAction) {
      return `
        <div class="shop-page">
          <div class="shop-nav">
            <span class="shop-brand">Helios Juice Shop · Juice Club</span>
            <span class="shop-nav-pill">/club/reviewers</span>
          </div>
          <div class="shop-reviewers-grid">
            <div class="shop-reviewer-row">
              <span><strong>Leila K.</strong> · Citrus Berry</span>
              <span class="shop-tier-tag">Member · 1x pts</span>
            </div>
            <div class="shop-reviewer-row">
              <span><strong>Omar S.</strong> · Mint Splash</span>
              <span class="shop-tier-tag">Member · 1x pts</span>
            </div>
            <div class="shop-reviewer-row">
              <span><strong>Tariq</strong> · Solar Mango</span>
              <span class="shop-tier-tag">Member · 1x pts</span>
            </div>
          </div>
          <div class="shop-card">
            <h4 class="shop-card-title">Update Reviewer JSON Profile</h4>
            <p class="shop-card-sub">Current payload: <code>${escapeHtmlSafe(currentInput)}</code></p>
            <div class="shop-cta-row">
              <button type="button" class="shop-cta-btn${highlightAction ? ' is-prompted' : ''}" data-shop-action="submit">
                Save Profile
              </button>
              ${
                highlightAction
                  ? '<span class="shop-click-cue">← Click here in Live View</span>'
                  : ''
              }
            </div>
          </div>
        </div>
      `;
    },

    renderResultViewport: function (outcome) {
      if (outcome.kind === 'exploited') {
        const mult = outcome.pollutedProps ? outcome.pollutedProps.multiplier : 9999;
        return `
          <div class="shop-page shop-page-phish">
            <div class="shop-alert-banner is-danger">
              PROTOTYPE POLLUTED · ALL OBJECTS INHERIT VIP &amp; ${escapeHtmlSafe(mult)}x MULTIPLIER
            </div>
            <div class="shop-reviewers-grid">
              <div class="shop-reviewer-row is-corrupted">
                <span><strong>Leila K.</strong> · Citrus Berry</span>
                <span class="shop-tier-tag is-vip">VIP · ${escapeHtmlSafe(mult)}x pts</span>
              </div>
              <div class="shop-reviewer-row is-corrupted">
                <span><strong>Omar S.</strong> · Mint Splash</span>
                <span class="shop-tier-tag is-vip">VIP · ${escapeHtmlSafe(mult)}x pts</span>
              </div>
              <div class="shop-reviewer-row is-corrupted">
                <span><strong>Tariq</strong> · Solar Mango</span>
                <span class="shop-tier-tag is-vip">VIP · ${escapeHtmlSafe(mult)}x pts</span>
              </div>
            </div>
            <button type="button" class="shop-back-btn" data-shop-action="reset">
              ← Back to Juice Club
            </button>
          </div>
        `;
      }
      if (outcome.kind === 'blocked') {
        return `
          <div class="shop-page">
            <div class="shop-alert-banner is-safe">
              PROTOTYPE GUARD ACTIVE · NULL-PROTOTYPE LEDGER CLEAN
            </div>
            <div class="shop-card">
              <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
              <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
              <button type="button" class="shop-back-btn" data-shop-action="reset">
                ← Back to Juice Club
              </button>
            </div>
          </div>
        `;
      }
      return `
        <div class="shop-page">
          <div class="shop-alert-banner is-ok">JUICE CLUB PROFILE SAVED</div>
          <div class="shop-card">
            <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
            <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
            <button type="button" class="shop-back-btn" data-shop-action="reset">
              ← Back to Juice Club
            </button>
          </div>
        </div>
      `;
    },

    getStartHtmlSource: function (currentInput) {
      return `<!doctype html>
<html>
  <head><title>Helios Juice Shop — Juice Club Top Reviewers</title></head>
  <body class="helios-club">
    <header class="shop-nav">Helios Juice Club · Top Reviewers</header>
    <section id="top-reviewers">
      <div class="reviewer" data-vip="false" data-multiplier="1">Leila K.</div>
      <div class="reviewer" data-vip="false" data-multiplier="1">Omar S.</div>
      <div class="reviewer" data-vip="false" data-multiplier="1">Tariq</div>
    </section>
    <form id="profile-json-form">
      <textarea name="profile">${currentInput}</textarea>
      <button type="submit">Save Profile</button>
    </form>
  </body>
</html>`;
    },

    getResultHtmlSource: function (outcome) {
      return `<!doctype html>
<html>
  <head><title>${outcome.headline}</title></head>
  <body class="helios-result ${outcome.kind}">
    <!-- Result DOM after merge operation completed -->
    <section id="top-reviewers" data-status="${outcome.kind}">
      <h1>${outcome.headline}</h1>
      <p>${outcome.detail}</p>
    </section>
  </body>
</html>`;
    },
  };

  function escapeHtmlSafe(val) {
    return String(val)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
