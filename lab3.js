(function () {
  'use strict';

  const FLAG = 'FLAG{V4ULT_CL1CKJ4CK_PWN}';

  function evaluateClickjack(rawInput, isPatched) {
    const val = String(rawInput || '').trim().toLowerCase();
    const isHarmless =
      !val ||
      val === 'none' ||
      val === 'overlay=none' ||
      val.includes('overlay:none') ||
      val.includes('safe');

    if (isHarmless) {
      return {
        kind: 'harmless',
        isAttack: false,
        worksNormal: true,
        blocked: false,
        flag: null,
        host: 'heliosjuice.shop',
        isExternalHost: false,
        displayUrl: 'https://heliosjuice.shop/spin-win?reward=500pts',
        statusText: '200 OK · Victim clicked Spin & Win directly and claimed 500 juice points',
        headline: '500 Free Juice Points Claimed Safely!',
        detail:
          'No hidden admin iframe was overlaid. The shopper safely claimed 500 loyalty points in Helios Juice Shop.',
        consequenceRisky: false,
        overlayOpacity: 0,
      };
    }

    const overlayMatch = val.match(/opacity\s*[:=]\s*([0-9.]+)/);
    const opacity = overlayMatch ? Number(overlayMatch[1]) : 0.01;

    if (!isPatched) {
      return {
        kind: 'exploited',
        isAttack: true,
        worksNormal: false,
        blocked: false,
        flag: FLAG,
        host: 'spin-free-juice.fake',
        isExternalHost: true,
        displayUrl: 'https://spin-free-juice.fake/giveaway (framing heliosjuice.shop/admin)',
        statusText:
          '200 HIJACKED · Automated victim click hit hidden iframe "Purge all orders"!',
        headline: 'Admin Action Triggered: All Orders Purged!',
        detail:
          'A signed-in administrator was tricked into clicking the hidden "Purge all orders" control instead of the visible giveaway button. The demo simulates this click; it does not load a real admin page.',
        consequenceRisky: true,
        overlayOpacity: opacity,
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
      displayUrl: 'https://heliosjuice.shop/admin/purge-orders [FRAME BLOCKED]',
      statusText:
        "403 Blocked · CSP frame-ancestors 'none' & X-Frame-Options: DENY refused iframe",
      headline: 'Framing Refused by Browser Security Headers',
      detail:
        "Helios Juice Shop returned Content-Security-Policy: frame-ancestors 'none' and X-Frame-Options: DENY, so the attacker's hidden admin frame could not render or steal the click.",
      consequenceRisky: true,
      overlayOpacity: opacity,
    };
  }

  window.SHIELDQUEST_LAB = {
    id: 'lab3',
    number: 3,
    slug: 'clickjacking-ui-redress',
    title: 'Clickjacking / UI Redress',
    shopTarget: '“Spin & Win” giveaway page',
    flag: FLAG,
    defenseSummary:
      "Send Content-Security-Policy: frame-ancestors 'none' together with X-Frame-Options: DENY.",
    defaultCustomInput: 'opacity=0.01; frame=/admin/purge-orders',
    customInputLabel: 'Overlay Config',
    customInputPlaceholder: 'opacity=0.01; frame=/admin/purge-orders or overlay=none',
    initialUrl: 'https://heliosjuice.shop/spin-win',
    initialTabTitle: 'Spin & Win — Free Juice Giveaway',
    initialStatus: 'Ready · Spin & Win page waiting (automated victim click plays on run)',
    autoVictimClick: true,

    slides: [
      {
        tag: 'Slide 1 · Title',
        title: 'Clickjacking on the “Spin & Win” Giveaway',
        points: [
          'Target: a sensitive Helios Juice Shop admin page embedded over a harmless-looking giveaway page.',
          'Trick: An invisible admin iframe sits directly over “Claim 500 free juice points”.',
          'Outcome: Clicking the prize button silently clicks “Purge all orders” underneath/above it.',
        ],
      },
      {
        tag: 'Slide 2 · The Idea',
        title: 'What Is Clickjacking (UI Redress)?',
        points: [
          'Clickjacking tricks a user into clicking a sensitive control hidden beneath a harmless-looking page. The highest-risk victim is an authenticated user who has permission to perform that action.',
          'The attacker places a real target page in an iframe and uses positioning and low opacity to align its control over a visible button.',
          'If the victim is a signed-in administrator, the browser may include that session with the framed request; the attacker does not need to read the framed page.',
        ],
      },
      {
        tag: 'Slide 3 · Why It Works',
        title: 'Why Invisible Frames Steal Legitimate Clicks',
        points: [
          'If the admin response does not restrict framing, an attacker-controlled page may embed it in an <iframe>.',
          'CSS z-index and opacity: 0.01 align the real “Purge all orders” button directly on top of “Claim 500 free juice points”.',
          'The browser delivers the mouse click to the topmost interactive element — the hidden admin button.',
          'OWASP: A06:2025 Insecure Design · CWE-1021 · OWASP WSTG Clickjacking test.',
        ],
      },
      {
        tag: 'Slide 4 · The Fix',
        title: "Enforce frame-ancestors 'none' & X-Frame-Options: DENY",
        points: [
          "Set Content-Security-Policy: frame-ancestors 'none' on all shop and admin responses.",
          'Also send X-Frame-Options: DENY for legacy browser coverage.',
          'The browser refuses to render the protected response in a frame; direct navigation to the admin page still works for authorized users.',
        ],
      },
      {
        tag: 'Slide 5 · Discussion Questions',
        title: 'Think Like a Security Team',
        points: [
          'Why is JavaScript frame-busting (if (top !== self)) weaker than HTTP framing headers?',
          'Which pages in an e-commerce store need frame-ancestors protection most urgently?',
          'Why should CSP frame-ancestors and X-Frame-Options be sent together?',
        ],
      },
    ],

    quiz: [
      {
        question: 'In Lab 3, what hidden action sits inside the invisible frame over "Claim 500 free juice points"?',
        options: [
          'Change store font color',
          'Purge all orders',
          'Download a smoothie recipe PDF',
          'Close the browser tab',
        ],
        correctIndex: 1,
        explanation:
          'The decoy giveaway button aligns directly with the sensitive "Purge all orders" admin button.',
      },
      {
        question: 'Why does the browser still authorize the hijacked click inside the hidden iframe?',
        options: [
          'The victim is already signed in with an account authorized to perform the framed admin action',
          'CSS opacity disables HTTPS certificates',
          'HTML buttons ignore mouse coordinates',
          'JavaScript automatically shares passwords across origins',
        ],
        correctIndex: 0,
        explanation:
          'The browser dispatches the real click to the framed page. If the victim has permission, the request can perform the action; same-origin policy does not prevent the click.',
      },
      {
        question: 'Which pair of HTTP headers stops clickjacking cleanly?',
        options: [
          "Cache-Control: no-store and Accept: text/html",
          "Content-Security-Policy: frame-ancestors 'none' and X-Frame-Options: DENY",
          'Access-Control-Allow-Origin: * and ETag: 1',
          'Referrer-Policy: unsafe-url and Server: nginx',
        ],
        correctIndex: 1,
        explanation:
          "Sending frame-ancestors 'none' together with X-Frame-Options: DENY prevents any site from embedding the page.",
      },
      {
        question: 'Why is an opacity: 0.01 iframe used instead of display: none?',
        options: [
          'display: none removes the element so it cannot receive clicks; opacity: 0.01 stays clickable',
          'opacity: 0.01 disables JavaScript on the page',
          'display: none makes the iframe bright neon teal',
          'Browsers block display: none inside forms',
        ],
        correctIndex: 0,
        explanation:
          'Elements hidden with display: none cannot be clicked, whereas near-zero opacity keeps the hidden button interactive.',
      },
      {
        question: 'After Kareem applies the framing headers, what happens when Tariq visits Spin & Win directly without framing?',
        options: [
          'Spin & Win still works normally and Tariq can claim 500 points safely',
          'All Helios Juice Shop pages stop loading completely',
          'Tariq’s orders are purged anyway',
          'The address bar turns red permanently',
        ],
        correctIndex: 0,
        explanation:
          "frame-ancestors 'none' only blocks embedding inside iframes; visiting the store directly works normally.",
      },
    ],

    userChoices: [
      {
        id: 'u3-safe',
        type: 'safe',
        label: 'Visit Spin & Win directly on heliosjuice.shop (overlay=none)',
        description: 'Tariq opens the official giveaway inside the real Helios Juice Shop site.',
        input: 'overlay=none',
        consequenceVulnerable:
          'Safe choice! Tariq clicked "Claim 500 free juice points" directly on heliosjuice.shop and received his reward.',
        consequencePatched:
          'Safe choice! Tariq claimed his 500 juice points normally on the official store page.',
      },
      {
        id: 'u3-risky1',
        type: 'risky',
        label: 'Play a popup "Spin & Win Mirror" from an ad (opacity=0.01; frame=/admin/purge-orders)',
        description: 'An external ad site wraps the giveaway and promises instant double points.',
        input: 'opacity=0.01; frame=/admin/purge-orders',
        consequenceVulnerable:
          'Oh no! The signed-in administrator clicked the visible giveaway button, but the invisible admin frame received the click and triggered the simulated purge action!',
        consequencePatched:
          "Saved! Kareem's frame-ancestors 'none' and X-Frame-Options: DENY headers blocked the hidden iframe from loading!",
      },
      {
        id: 'u3-risky2',
        type: 'risky',
        label: 'Click a shady "Instant Winner" giveaway embed (opacity=0.08; align=cover)',
        description: 'A third-party blog embeds the giveaway widget with faint overlay distortion.',
        input: 'opacity=0.08; align=cover; frame=/admin/purge-orders',
        consequenceVulnerable:
          'Hijacked! Even a faint overlay misled the administrator’s click onto the hidden "Purge all orders" control.',
        consequencePatched:
          'Protected! The browser refused to frame the protected Helios admin page inside the third-party blog.',
      },
    ],

    payloads: [
      {
        id: 'p3-harmless',
        kind: 'harmless',
        badge: 'Harmless',
        title: 'Direct Spin & Win Preview',
        value: 'overlay=none',
        description: 'Normal direct visit to Spin & Win with zero framing overlay.',
      },
      {
        id: 'p3-attack1',
        kind: 'attack',
        badge: 'Attack 1',
        title: 'Invisible Admin Frame (opacity 0.01)',
        value: 'opacity=0.01; frame=/admin/purge-orders',
        description: 'Aligns an almost-invisible admin iframe over "Claim 500 free juice points".',
      },
      {
        id: 'p3-attack2',
        kind: 'attack',
        badge: 'Attack 2',
        title: 'Full-Cover UI Redress (opacity 0.08)',
        value: 'opacity=0.08; align=cover; frame=/admin/purge-orders',
        description: 'Wraps the full giveaway button area with a translucent Purge Orders iframe.',
      },
    ],

    hints: [
      'Check Source code → HTML and search for the HIDDEN FRAME comment sitting over #claim-points-btn.',
      'The attack relies on an invisible iframe (opacity near 0) covering the "Claim 500 free juice points" button.',
      'Run Attack 1 (opacity=0.01; frame=/admin/purge-orders) and watch the victim cursor click automatically!',
    ],

    code: {
      vulnerableLines: [
        '// Illustrative Express-style server handler; this static lab simulates the response',
        '// Helios Juice Shop — /admin/purge-orders response (VULNERABLE)',
        'function sendAdminResponse(res, html) {',
        '  res.setHeader("Content-Type", "text/html");',
        '  // BUG: missing CSP frame-ancestors and X-Frame-Options',
        '  return res.send(html);',
        '}',
      ],
      vulnerableHighlightLines: [4],
      fixedLines: [
        '// Illustrative Express-style server handler; this static lab simulates the response',
        '// Helios Juice Shop — /admin/purge-orders response (FIXED)',
        'function sendAdminResponse(res, html) {',
        '  res.setHeader("Content-Type", "text/html");',
        "  res.setHeader(\"Content-Security-Policy\", \"frame-ancestors 'none'\");",
        '  res.setHeader("X-Frame-Options", "DENY");',
        '  return res.send(html);',
        '}',
      ],
      fixedHighlightLines: [4, 5],
    },

    evaluate: evaluateClickjack,

    renderStartViewport: function (currentInput, isPatched, _isAnimating, highlightAction) {
      const val = String(currentInput || '').toLowerCase();
      const hasFrame = val && val !== 'overlay=none' && val !== 'none' && !val.includes('safe');
      return `
        <div class="shop-page">
          <div class="shop-nav">
            <span class="shop-brand">Helios Juice Shop · Spin &amp; Win</span>
            <span class="shop-nav-pill">/spin-win</span>
          </div>
          <div class="clickjack-arena">
            <div class="clickjack-decoy-layer">
              <p class="shop-giveaway-eyebrow">Daily Giveaway</p>
              <h4 class="shop-card-title">Spin &amp; Win Bonus!</h4>
              <p class="shop-card-sub">Tap below to add 500 free juice points to your wallet.</p>
              <div class="shop-cta-row">
                <button type="button" id="shop-claim-btn" class="shop-cta-btn${highlightAction ? ' is-prompted' : ''}" data-shop-action="submit">
                  Claim 500 free juice points
                </button>
                ${
                  highlightAction
                    ? '<span class="shop-click-cue">← Click here in Live View</span>'
                    : ''
                }
              </div>
            </div>

            ${
              hasFrame
                ? `<div class="clickjack-ghost-iframe${isPatched ? ' is-refused' : ''}">
                    <span class="ghost-frame-badge">${
                      isPatched
                        ? "Blocked by frame-ancestors 'none'"
                        : 'Hidden Admin Frame: Purge all orders (opacity: 0.01)'
                    }</span>
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    },

    renderResultViewport: function (outcome) {
      if (outcome.kind === 'exploited') {
        return `
          <div class="shop-page shop-page-phish">
            <div class="shop-alert-banner is-danger">
              ADMIN FRAME HIJACKED · "PURGE ALL ORDERS" EXECUTED
            </div>
            <div class="shop-card shop-card-phish">
              <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
              <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
              <button type="button" class="shop-back-btn" data-shop-action="reset">
                ← Back to Giveaway
              </button>
            </div>
          </div>
        `;
      }
      if (outcome.kind === 'blocked') {
        return `
          <div class="shop-page">
            <div class="shop-alert-banner is-safe">
              FRAME BLOCKED · X-Frame-Options: DENY &amp; frame-ancestors 'none'
            </div>
            <div class="shop-card">
              <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
              <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
              <button type="button" class="shop-back-btn" data-shop-action="reset">
                ← Back to Giveaway
              </button>
            </div>
          </div>
        `;
      }
      return `
        <div class="shop-page">
          <div class="shop-alert-banner is-ok">REWARD CLAIMED · +500 JUICE POINTS</div>
          <div class="shop-card">
            <h4 class="shop-card-title">${escapeHtmlSafe(outcome.headline)}</h4>
            <p class="shop-card-sub">${escapeHtmlSafe(outcome.detail)}</p>
            <button type="button" class="shop-back-btn" data-shop-action="reset">
              ← Back to Giveaway
            </button>
          </div>
        </div>
      `;
    },

    getStartHtmlSource: function (currentInput) {
      const config = String(currentInput || 'opacity=0.01; frame=/admin/purge-orders');
      return `<!doctype html>
<html>
  <head><title>Spin & Win — Free Juice Giveaway</title></head>
  <body class="giveaway-wrapper">
    <section class="decoy-card">
      <h1>Spin &amp; Win Bonus!</h1>
      <button id="claim-points-btn">Claim 500 free juice points</button>
    </section>
    <!-- HIDDEN FRAME: <iframe id="admin-frame" src="/admin/purge-orders" style="opacity:0.01; pointer-events:auto;"></iframe> sitting directly over #claim-points-btn (${config}) -->
    <iframe id="admin-frame" src="https://heliosjuice.shop/admin/purge-orders" title="Hidden Admin Action">
      Purge all orders
    </iframe>
  </body>
</html>`;
    },

    getResultHtmlSource: function (outcome) {
      return `<!doctype html>
<html>
  <head><title>${outcome.headline}</title></head>
  <body class="helios-result ${outcome.kind}">
    <!-- Result DOM after automated victim click resolved -->
    <main class="status-card" data-outcome="${outcome.kind}">
      <h1>${outcome.headline}</h1>
      <p>${outcome.detail}</p>
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
