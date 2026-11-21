(function () {
  'use strict';

  const FLAG = 'FLAG{G4T3WAY_R3D1R3CT_PWN}';

  function evaluateRedirect(rawInput, isPatched) {
    const trimmed = String(rawInput || '').trim() || '/club';
    let parsed;
    try {
      parsed = new URL(trimmed, 'https://heliosjuice.shop');
    } catch {
      return {
        kind: 'blocked',
        isAttack: false,
        worksNormal: false,
        blocked: true,
        flag: null,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop/signin?next=' + encodeURIComponent(trimmed),
        statusText: '400 Invalid URL · Parser rejected malformed redirect value',
        headline: 'Malformed Redirect Rejected',
        detail: 'The input could not be parsed as a valid URL path.',
        consequenceRisky: false,
      };
    }

    const isExternal =
      parsed.origin !== 'https://heliosjuice.shop' ||
      trimmed.startsWith('//') ||
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);

    const isSameSitePath =
      !isExternal && trimmed.startsWith('/') && !trimmed.startsWith('//');

    if (!isExternal && isSameSitePath) {
      return {
        kind: 'harmless',
        isAttack: false,
        worksNormal: true,
        blocked: false,
        flag: null,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop' + parsed.pathname + parsed.search,
        statusText: '200 OK · Signed in and navigated safely to ' + parsed.pathname,
        headline: 'Welcome back to Helios Juice Shop!',
        detail:
          'You signed in safely and stayed inside Helios Juice Shop (' + parsed.pathname + ').',
        consequenceRisky: false,
      };
    }

    if (!isPatched) {
      return {
        kind: 'exploited',
        isAttack: true,
        worksNormal: false,
        blocked: false,
        flag: FLAG,
        host: parsed.host || 'external-host',
        isExternalHost: true,
        displayUrl: parsed.href,
        statusText: '302 DOM Redirect · Victim navigated to external host ' + parsed.host,
        headline: 'Phishing Trap! Redirected to ' + parsed.host,
        detail:
          'The Helios sign-in script trusted ?next= blindly and bounced the shopper off-site to a lookalike login page.',
        consequenceRisky: true,
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
      displayUrl: 'https://heliosjuice.shop/club?blocked=external-redirect',
      statusText: '403 Blocked · Non-same-site redirect (' + parsed.host + ') rejected',
      headline: 'Attack Blocked by Same-Site Path Allowlist',
      detail:
        'The patched sign-in handler noticed "' +
        trimmed +
        '" points outside heliosjuice.shop and redirected safely to /club instead.',
      consequenceRisky: true,
    };
  }

  window.SHIELDQUEST_LAB = {
    id: 'lab1',
    number: 1,
    slug: 'dom-open-redirect',
    title: 'DOM-Based Open Redirect',
    shopTarget: 'Sign-in page (?next=)',
    flag: FLAG,
    defenseSummary: 'Allow only same-site paths starting with a single "/" and matching the shop origin.',
    defaultCustomInput: '/club',
    customInputLabel: '?next= value',
    customInputPlaceholder: 'Enter a destination path, e.g. /club',
    initialUrl: 'https://heliosjuice.shop/signin?next=/club',
    initialTabTitle: 'Helios Juice Shop — Sign In',
    initialStatus: 'Ready · Sign-in page loaded (?next=/club)',

    slides: [
      {
        tag: 'Slide 1 · Title',
        title: 'DOM-Based Open Redirect at Helios Juice Shop',
        points: [
          'Target: The Helios Juice Shop sign-in page (/signin?next=...).',
          'Goal: Understand how a helpful "return after login" link can send shoppers to a fake site.',
          'Characters: Noor explains, Tariq shops, Zayd tests payloads, and Kareem patches the code.',
        ],
      },
      {
        tag: 'Slide 2 · The Idea',
        title: 'What Is a DOM-Based Open Redirect?',
        points: [
          'A login page often remembers where the user wanted to go using a ?next= parameter.',
          'When client-side JavaScript copies ?next= straight into window.location without checking it, anyone can craft a link pointing outside the store.',
          'Victims see the trusted heliosjuice.shop domain first, then get silently bounced elsewhere.',
          'OWASP: A01:2025 Broken Access Control (Open Redirect guidance) · CWE-601 · OWASP WSTG-CLNT-04.',
        ],
      },
      {
        tag: 'Slide 3 · Why It Works',
        title: 'Why Browsers Follow the Untrusted Link',
        points: [
          'URLSearchParams.get("next") returns raw user-controlled text from the address bar.',
          'Both full URLs (https://evil-juice.fake/login) and protocol-relative paths (//evil-juice.fake/claim) leave the store origin.',
          'window.location.assign(next) obeys whichever destination string it receives.',
        ],
      },
      {
        tag: 'Slide 4 · The Fix',
        title: 'Allow Only Same-Site Paths',
        points: [
          'Check that the candidate string starts with "/" and never starts with "//".',
          'Parse with new URL(next, window.location.origin) and enforce url.origin === window.location.origin.',
          'If validation fails, fall back safely to /club instead of redirecting externally.',
        ],
      },
      {
        tag: 'Slide 5 · Discussion Questions',
        title: 'Think Like a Security Team',
        points: [
          'Why is checking startsWith("/") alone NOT enough? (Hint: what does "//evil-juice.fake" do?)',
          'How does a trusted brand name in the initial link trick everyday users like Tariq?',
          'Where else in an online shop might redirect parameters appear (checkout, logout, OAuth)?',
        ],
      },
    ],

    quiz: [
      {
        question: 'Which parameter on the Helios Juice Shop sign-in page controls where the shopper goes next?',
        options: ['?promo=', '?next=', '?theme=', '?cart_id='],
        correctIndex: 1,
        explanation:
          'The sign-in script reads the ?next= query parameter to decide the post-login destination.',
      },
      {
        question: 'Why does "//evil-juice.fake/claim" bypass a naive check like next.startsWith("/")?',
        options: [
          'Browsers treat "//" as a protocol-relative external host',
          'JSON.parse removes the first slash automatically',
          'HTML ignores slashes in query parameters',
          'CSS hides the second slash in the address bar',
        ],
        correctIndex: 0,
        explanation:
          'A leading "//" tells the browser to keep the current scheme (https:) and navigate to evil-juice.fake as a host.',
      },
      {
        question: 'What makes a DOM-based open redirect dangerous to shoppers?',
        options: [
          'It deletes localStorage cookies automatically',
          'The link starts on the trusted store domain before bouncing to a phishing page',
          'It crashes the server database immediately',
          'It disables HTTPS encryption on the whole internet',
        ],
        correctIndex: 1,
        explanation:
          'Users trust the heliosjuice.shop link and only realize too late that they landed on a lookalike phishing form.',
      },
      {
        question: 'Which fix stops DOM-based open redirects cleanly?',
        options: [
          'Hiding the ?next= input with CSS display: none',
          'Allowing only same-site paths and verifying parsed.origin matches the store origin',
          'Adding a 1-second setTimeout before redirecting',
          'Encoding the URL in Base64 first',
        ],
        correctIndex: 1,
        explanation:
          'Enforcing same-site paths (starts with "/", not "//") plus parsed.origin validation prevents external navigation.',
      },
      {
        question: 'When Kareem patches this flaw, what should happen if a shopper visits ?next=/club?',
        options: [
          'Normal internal navigation to /club still works',
          'All sign-ins are permanently blocked',
          'The shopper is sent to an external fallback site',
          'The browser deletes the user account',
        ],
        correctIndex: 0,
        explanation:
          'A proper security fix blocks external attacks while keeping legitimate same-site redirects like /club working.',
      },
    ],

    userChoices: [
      {
        id: 'u1-safe',
        type: 'safe',
        label: 'Sign in directly from Helios Juice Shop menu (/club)',
        description: 'Tariq types heliosjuice.shop himself and follows ?next=/club.',
        input: '/club',
        consequenceVulnerable:
          'Safe choice! Tariq signed in and landed directly inside his Helios Juice Club dashboard.',
        consequencePatched:
          'Safe choice! Tariq signed in and navigated smoothly to the Helios Juice Club page.',
      },
      {
        id: 'u1-risky1',
        type: 'risky',
        label: 'Open a promotional link sent in a chat',
        description: 'A friend shared a promotion that appears to come from the store.',
        input: 'https://evil-juice.fake/login',
        consequenceVulnerable:
          'Uh oh! Tariq saw heliosjuice.shop first, signed in, and got bounced straight to evil-juice.fake asking for his password again!',
        consequencePatched:
          'Good news! Even though Tariq clicked a risky link, Kareem’s patch blocked the external redirect and kept him safe on heliosjuice.shop.',
      },
      {
        id: 'u1-risky2',
        type: 'risky',
        label: 'Open an urgent order-issue message',
        description: 'An unverified account asks you to review an unexpected delivery problem.',
        input: '//evil-juice.fake/claim',
        consequenceVulnerable:
          'Oops! "//evil-juice.fake/claim" resolved as an external domain and sent Tariq off-site!',
        consequencePatched:
          'Protected! Kareem’s patch detected the protocol-relative "//" bypass and kept Tariq inside Helios Juice Shop.',
      },
    ],

    payloads: [
      {
        id: 'p1-harmless',
        kind: 'harmless',
        badge: 'Harmless',
        title: 'Normal Juice Club Redirect',
        value: '/club',
        description: 'Standard same-site redirect back to the Helios Juice Club page.',
      },
      {
        id: 'p1-attack1',
        kind: 'attack',
        badge: 'Attack 1',
        title: 'External Phishing Domain',
        value: 'https://evil-juice.fake/login',
        description: 'Supplies a full external HTTPS URL inside the ?next= query parameter.',
      },
      {
        id: 'p1-attack2',
        kind: 'attack',
        badge: 'Attack 2',
        title: 'Protocol-Relative Bypass',
        value: '//evil-juice.fake/claim',
        description: 'Uses leading double slashes ("//") to slip past naive "/" prefix checks.',
      },
    ],

    hints: [
      'Inspect the Page Source HTML tab first — look for the developer TODO comment on the Sign-In page.',
      'The sign-in handler reads the ?next= query parameter directly. Try supplying a host that is NOT heliosjuice.shop.',
      'Use either https://evil-juice.fake/login or //evil-juice.fake/claim in the input bar and run the request.',
    ],

    code: {
      vulnerableLines: [
        '// Helios Juice Shop — /signin handler (VULNERABLE)',
        'function handleSignIn(searchString) {',
        '  const params = new URLSearchParams(searchString);',
        '  const nextUrl = params.get("next") || "/club";',
        '  // BUG: redirects to any URL without checking origin',
        '  window.location.assign(nextUrl);',
        '}',
      ],
      vulnerableHighlightLines: [6],
      fixedLines: [
        '// Helios Juice Shop — /signin handler (FIXED)',
        'function handleSignIn(searchString) {',
        '  const params = new URLSearchParams(searchString);',
        '  const raw = params.get("next") || "/club";',
        '  const safe = raw.startsWith("/") && !raw.startsWith("//");',
        '  const parsed = new URL(raw, "https://heliosjuice.shop");',
        '  if (!safe || parsed.origin !== "https://heliosjuice.shop") {',
        '    return window.location.assign("/club");',
        '  }',
        '  window.location.assign(parsed.pathname + parsed.search);',
        '}',
      ],
      fixedHighlightLines: [5, 6, 7, 8],
    },

    evaluate: evaluateRedirect,

    renderStartViewport: function (currentInput, _isPatched, _isAnimating, highlightAction) {
      const nextVal = String(currentInput || '/club');
      return `
        <div class="shop-page">
          <div class="shop-nav">
            <span class="shop-brand">Helios Juice Shop</span>
            <span class="shop-nav-pill">/signin</span>
          </div>
          <div class="shop-card">
            <h4 class="shop-card-title">Sign in to Helios Juice Club</h4>
            <p class="shop-card-sub">After signing in, you will continue to: <code>${escapeHtmlSafe(nextVal)}</code></p>
            <div class="shop-form-mock">
              <label class="shop-field">
                <span>Email</span>
                <input type="text" value="tariq@helios-member.test" />
              </label>
              <label class="shop-field">
                <span>Password</span>
                <input type="password" value="••••••••••" />
              </label>
              <div class="shop-cta-row">
                <button type="button" class="shop-cta-btn${highlightAction ? ' is-prompted' : ''}" data-shop-action="submit">
                  Sign in
                </button>
                ${
                  highlightAction
                    ? '<span class="shop-click-cue">← Click here in Live View</span>'
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderResultViewport: function (outcome) {
      if (outcome.kind === 'exploited') {
        return `
          <div class="shop-page shop-page-phish">
            <div class="shop-alert-banner is-danger">
              EXTERNAL SITE REDIRECT · HOST: ${escapeHtmlSafe(outcome.host)}
            </div>
            <div class="shop-card shop-card-phish">
              <h4 class="shop-card-title">Fake Helios Login (${escapeHtmlSafe(outcome.host)})</h4>
              <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
              <div class="shop-flag-inline">Simulated Phishing Page Reached</div>
              <button type="button" class="shop-back-btn" data-shop-action="reset">
                ← Back to Sign In
              </button>
            </div>
          </div>
        `;
      }
      if (outcome.kind === 'blocked') {
        return `
          <div class="shop-page">
            <div class="shop-alert-banner is-safe">
              SECURITY GUARD · SAME-SITE PATH ENFORCED
            </div>
            <div class="shop-card">
              <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
              <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
              <button type="button" class="shop-back-btn" data-shop-action="reset">
                ← Back to Sign In
              </button>
            </div>
          </div>
        `;
      }
      return `
        <div class="shop-page">
          <div class="shop-alert-banner is-ok">SIGNED IN · HELIOS JUICE CLUB</div>
          <div class="shop-card">
            <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
            <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
            <button type="button" class="shop-back-btn" data-shop-action="reset">
              ← Back to Sign In
            </button>
          </div>
        </div>
      `;
    },

    getStartHtmlSource: function () {
      return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Helios Juice Shop — Sign In</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body class="helios-store">
    <header class="shop-nav">
      <a href="/">Helios Juice Shop</a>
    </header>

    <main class="shop-card">
      <h1>Sign in to Helios Juice Club</h1>
      <p>After signing in, you will continue to your selected page.</p>

      <form id="signin-form" action="/signin" method="get">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" />

        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" />

        <button type="submit">Sign in</button>
      </form>
    </main>
    <script src="./signin.js" defer></script>
  </body>
</html>`;
    },

    getResultHtmlSource: function (outcome) {
      return `<!doctype html>
<html>
  <head><title>${outcome.headline}</title></head>
  <body class="helios-result ${outcome.kind}">
    <!-- Result view after sign-in navigation resolved -->
    <main class="status-card" data-host="${outcome.host}">
      <h1>${outcome.headline}</h1>
      <p>${outcome.detail}</p>
      <span class="url">${outcome.displayUrl}</span>
    </main>
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
