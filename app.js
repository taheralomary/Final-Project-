(function () {
  'use strict';

  const OPERATIVES = [
    {
      id: 'mentor',
      tabLabel: 'NOOR · PROFESSOR',
      nameWithJob: 'Noor · Professor',
      tagline: 'Makes the hard parts simple.',
      roleText: 'Explain the whole story with slides and a quiz.',
      weakPointText: 'Cannot patch the site herself.',
      fullImage: './assets/images/chars/mentor_full.png',
      headImage: './assets/images/chars/mentor_head.png',
    },
    {
      id: 'developer',
      tabLabel: 'TARIQ · USER',
      nameWithJob: 'Tariq · User',
      tagline: 'Just wants to get things done.',
      roleText: 'Use the shop and find out what each click leads to.',
      weakPointText: 'Rushes and trusts links from friends.',
      fullImage: './assets/images/chars/analyst_full.png',
      headImage: './assets/images/chars/analyst_head.png',
    },
    {
      id: 'defender',
      tabLabel: 'KAREEM · DEFENDER',
      nameWithJob: 'Kareem · Defender',
      tagline: 'Turns lessons from incidents into stronger defenses.',
      roleText: 'Find the vulnerable line, apply a patch, and verify it blocks the attack.',
      weakPointText: 'Must understand the root cause, not just hide the symptom.',
      fullImage: './assets/images/chars/defender_full.png',
      headImage: './assets/images/chars/defender_head.png',
    },
    {
      id: 'hacker',
      tabLabel: 'ZAYD · HACKER',
      nameWithJob: 'Zayd · Hacker',
      tagline: 'Finds the weakness in an application.',
      roleText: 'Choose a payload and understand how the attack works.',
      weakPointText: 'Gets stopped by strong validation and secure design.',
      fullImage: './assets/images/chars/hacker_full.png',
      headImage: './assets/images/chars/hacker_head.png',
    },
  ];

  const VULNERABILITIES = [
    {
      id: 'dom-open-redirect',
      whiteName: 'Open Redirect',
      title: 'DOM-Based Open Redirect',
      summary:
        'Client-side scripts read untrusted query or hash parameters directly into navigation sinks like window.location without verifying the destination origin. Attackers abuse trusted login links to silently bounce victims onto convincing phishing domains.',
      labUrl: './lab1.html',
    },
    {
      id: 'prototype-pollution',
      whiteName: 'Prototype Pollution',
      title: 'Prototype Pollution',
      summary:
        'Unsafe recursive object merges allow crafted __proto__ or constructor keys to inject properties onto the shared JavaScript Object.prototype. Once polluted, unsuspecting scripts inherit attacker-controlled flags that trigger privilege escalations or DOM XSS.',
      labUrl: './lab2.html',
    },
    {
      id: 'clickjacking-ui-redress',
      whiteName: 'Clickjacking',
      title: 'Clickjacking / UI Redress',
      summary:
        'Malicious pages embed sensitive web applications inside transparent iframes positioned directly beneath harmless decoy buttons. Without strict framing policies, users unknowingly trigger privileged clicks on hidden actions.',
      labUrl: './lab3.html',
    },
  ];

  const FOLDER_PATH =
    'M 26 1 L 288 1 C 314 1 316 56 346 56 L 574 56 Q 599 56 599 81 L 599 354 Q 599 379 574 379 L 26 379 Q 1 379 1 354 L 1 26 Q 1 1 26 1 Z';

  const ARROW_RIGHT_ICON_SVG = `
    <svg class="icon-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  `;

  const state = {
    selectedOperativeId: OPERATIVES[0].id,
  };

  function getEl(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderOperatives() {
    const activeOp = OPERATIVES.find((op) => op.id === state.selectedOperativeId) || OPERATIVES[0];

    const fullImg = getEl('active-op-full-img');
    if (fullImg instanceof HTMLImageElement) {
      fullImg.src = activeOp.fullImage;
      fullImg.alt = activeOp.nameWithJob;
    }
    getEl('active-op-name').textContent = activeOp.nameWithJob;
    getEl('active-op-role').textContent = activeOp.tagline;

    const tabsHost = getEl('operative-tabs');
    tabsHost.innerHTML = OPERATIVES.map((op) => {
      const isActive = op.id === activeOp.id;
      return `
        <button
          type="button"
          role="tab"
          aria-selected="${isActive}"
          class="op-tab-btn${isActive ? ' is-active' : ''}"
          data-select-operative="${escapeHtml(op.id)}"
        >
          ${escapeHtml(op.tabLabel)}
        </button>
      `;
    }).join('');

    const cardsHost = getEl('operative-cards');
    cardsHost.innerHTML = OPERATIVES.map((op) => {
      const isActive = op.id === activeOp.id;
      return `
        <div class="op-col">
          <button
            type="button"
            class="op-portrait-card${isActive ? ' is-active' : ''}"
            aria-label="Select ${escapeHtml(op.nameWithJob)}"
            data-select-operative="${escapeHtml(op.id)}"
          >
            <div class="op-portrait-gloss" aria-hidden="true"></div>
            <div class="op-portrait-unskew">
              <img
                src="${escapeHtml(op.headImage)}"
                alt="${escapeHtml(op.nameWithJob)}"
                referrerpolicy="no-referrer"
              />
            </div>
          </button>

          <div class="op-stat-box op-stat-box-tall${isActive ? ' is-active' : ''}">
            <div class="op-stat-inner">
              <div class="op-stat-label">ROLE</div>
              <p class="op-stat-copy">${escapeHtml(op.roleText)}</p>
            </div>
          </div>

          <div class="op-stat-box op-stat-box-tall${isActive ? ' is-active' : ''}">
            <div class="op-stat-inner">
              <div class="op-stat-label">WEAK POINT</div>
              <p class="op-stat-copy">${escapeHtml(op.weakPointText)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderVulnerabilities() {
    const grid = getEl('vuln-cards-grid');
    grid.innerHTML = VULNERABILITIES.map((item, idx) => {
      const uid = `${item.id}-${idx}`;
      return `
        <article class="folder-card folder-card-minimal">
          <div class="folder-white-pill-wrap">
            <a href="${escapeHtml(item.labUrl)}" class="folder-white-pill">
              ${escapeHtml(item.whiteName)}
            </a>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 600 380"
            preserveAspectRatio="none"
            class="folder-svg"
          >
            <defs>
              <clipPath id="clip-${uid}">
                <path d="${FOLDER_PATH}" />
              </clipPath>
              <linearGradient id="glass-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.075)" />
                <stop offset="45%" stop-color="rgba(12,18,24,0.72)" />
                <stop offset="100%" stop-color="rgba(0,181,184,0.14)" />
              </linearGradient>
              <linearGradient id="stroke-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.62)" />
                <stop offset="48%" stop-color="rgba(255,255,255,0.22)" />
                <stop offset="100%" stop-color="rgba(0,212,216,0.52)" />
              </linearGradient>
            </defs>

            <g clip-path="url(#clip-${uid})">
              <rect x="0" y="0" width="600" height="380" fill="url(#glass-${uid})" />
              <path
                d="M 280 70 L 280 380 M 320 70 L 320 380 M 360 70 L 360 380 M 400 70 L 400 380 M 440 70 L 440 380 M 480 70 L 480 380 M 520 70 L 520 380 M 560 70 L 560 380 M 240 120 L 600 120 M 240 160 L 600 160 M 240 200 L 600 200 M 240 240 L 600 240 M 240 280 L 600 280 M 240 320 L 600 320"
                stroke="rgba(0, 212, 216, 0.08)"
                stroke-width="1"
              />
              <ellipse cx="485" cy="280" rx="145" ry="120" fill="rgba(0, 212, 216, 0.1)" />
            </g>

            <path
              d="${FOLDER_PATH}"
              fill="none"
              stroke="url(#stroke-${uid})"
              stroke-width="1.25"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <div class="folder-content">
            <div>
              <div class="folder-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <h3 class="folder-title folder-title-clean">${escapeHtml(item.title)}</h3>
              <p class="folder-summary">${escapeHtml(item.summary)}</p>
            </div>

            <div class="folder-actions">
              <a href="${escapeHtml(item.labUrl)}" class="btn-primary btn-sm folder-start-btn">
                <span>Click to Start</span>
                ${ARROW_RIGHT_ICON_SVG}
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function openContactModal() {
    getEl('contact-error').hidden = true;
    getEl('contact-error').textContent = '';
    getEl('contact-form').hidden = false;
    getEl('contact-success').hidden = true;
    getEl('contact-modal').hidden = false;
    getEl('contact-email').focus();
  }

  function closeContactModal() {
    getEl('contact-modal').hidden = true;
  }

  function init() {
    const heroImg = getEl('hero-image');
    heroImg.addEventListener('error', () => {
      heroImg.hidden = true;
      getEl('hero-fallback').hidden = false;
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const opBtn = target.closest('[data-select-operative]');
      if (opBtn) {
        const nextId = opBtn.getAttribute('data-select-operative');
        if (nextId) {
          state.selectedOperativeId = nextId;
          renderOperatives();
        }
      }
    });

    getEl('contact-designers-btn').addEventListener('click', openContactModal);
    getEl('contact-close-btn').addEventListener('click', closeContactModal);
    getEl('contact-cancel-btn').addEventListener('click', closeContactModal);
    getEl('contact-done-btn').addEventListener('click', closeContactModal);

    getEl('contact-modal').addEventListener('click', (event) => {
      if (event.target === getEl('contact-modal')) {
        closeContactModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeContactModal();
      }
    });

    getEl('contact-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const emailInput = getEl('contact-email');
      const messageInput = getEl('contact-message');
      const errorEl = getEl('contact-error');
      const trimmedEmail =
        emailInput instanceof HTMLInputElement ? emailInput.value.trim() : '';
      const trimmedMsg =
        messageInput instanceof HTMLTextAreaElement ? messageInput.value.trim() : '';

      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errorEl.textContent = 'Enter a valid email address so Team 42 can reply.';
        errorEl.hidden = false;
        return;
      }

      if (!trimmedMsg) {
        errorEl.textContent = 'Write a brief message for the designers before sending.';
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      errorEl.textContent = '';

      const copyEl = getEl('contact-success-copy');
      copyEl.innerHTML = '';
      copyEl.append('Your note from ');
      const strongEmail = document.createElement('strong');
      strongEmail.textContent = trimmedEmail;
      copyEl.append(strongEmail, ' has been queued for Developer Team 42.');

      getEl('contact-form').hidden = true;
      getEl('contact-success').hidden = false;
    });

    renderOperatives();
    renderVulnerabilities();
  }

  init();
})();
