(function () {
  'use strict';

  const STORAGE_KEY = 'shieldquest_progress_v1';

  const PLAYERS = [
    {
      id: 'teacher',
      name: 'Prof. Noor',
      job: 'Professor',
      image: './assets/images/chars/mentor_head.png',
    },
    {
      id: 'user',
      name: 'Tariq',
      job: 'User',
      image: './assets/images/chars/analyst_head.png',
    },
    {
      id: 'hacker',
      name: 'Zayd',
      job: 'Hacker',
      image: './assets/images/chars/hacker_head.png',
    },
    {
      id: 'developer',
      name: 'Kareem',
      job: 'Developer',
      image: './assets/images/chars/defender_head.png',
    },
  ];

  function createEmptyLabProgress() {
    return {
      patched: false,
      devMode: 'vulnerable',
      devVerified: false,
      devTests: {},
      teacherSlide: 0,
      quizAnswers: {},
      teacherDone: false,
      userRiskyTried: false,
      userSafeTried: false,
      userLastChoiceId: null,
      hackerHintsUsed: 0,
      hackerFlagCaptured: false,
      hackerNoHintsBadge: false,
    };
  }

  function loadAllProgress() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveAllProgress(all) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Ignore storage quota errors in restricted frames
    }
  }

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

  function initLabEngine() {
    const lab = window['SHIELDQUEST_LAB'];
    if (!lab) return;

    const allProgress = loadAllProgress();
    const prog = Object.assign(createEmptyLabProgress(), allProgress[lab.id] || {});
    allProgress[lab.id] = prog;
    saveAllProgress(allProgress);

    const runtime = {
      activePlayer: 'teacher',
      browserView: 'start',
      isRequesting: false,
      currentInput: lab.defaultCustomInput,
      userLoadedChoiceId: lab.userChoices[0] ? lab.userChoices[0].id : null,
      lastOutcome: null,
      sourceTab: 'html',
      requestTimer: null,
    };

    function persist() {
      allProgress[lab.id] = prog;
      saveAllProgress(allProgress);
    }

    function isRoleDone(roleId) {
      if (roleId === 'teacher') return Boolean(prog.teacherDone);
      if (roleId === 'user') return Boolean(prog.userRiskyTried && prog.userSafeTried);
      if (roleId === 'hacker') return Boolean(prog.hackerFlagCaptured);
      if (roleId === 'developer') return Boolean(prog.devVerified);
      return false;
    }

    function getEffectiveModePatched() {
      if (runtime.activePlayer === 'developer') {
        return prog.devMode === 'fixed';
      }
      return Boolean(prog.patched);
    }

    function renderAddressBar(urlString, highlightExternal) {
      const display = getEl('browser-address-display');
      if (!display) return;
      const text = String(urlString || lab.initialUrl);
      const match = text.match(/^(https?:\/\/)([^/?#]+)(.*)$/i);
      if (!match) {
        display.innerHTML = `<span class="addr-path">${escapeHtml(text)}</span>`;
        return;
      }
      const scheme = match[1];
      const host = match[2];
      const rest = match[3] || '';
      const hostIsExternal =
        highlightExternal || (host !== 'heliosjuice.shop' && !host.endsWith('.heliosjuice.shop'));

      display.innerHTML = `<span class="addr-scheme">${escapeHtml(
        scheme,
      )}</span><span class="addr-host${hostIsExternal ? ' is-external-host' : ''}">${escapeHtml(
        host,
      )}</span><span class="addr-path">${escapeHtml(rest)}</span>`;
    }

    function buildActiveAddressUrl() {
      // Keep implementation details and crafted redirect values out of the shopper's view.
      if (runtime.activePlayer === 'user' && runtime.browserView !== 'result') {
        return lab.initialUrl;
      }
      if (runtime.browserView === 'result' && runtime.lastOutcome) {
        return runtime.lastOutcome.displayUrl;
      }
      if (lab.id === 'lab1') {
        return (
          'https://heliosjuice.shop/signin?next=' +
          encodeURIComponent(runtime.currentInput || '/club')
        );
      }
      return lab.initialUrl;
    }

    function renderBrowser() {
      const patchedMode = getEffectiveModePatched();
      const modeBadge = getEl('browser-mode-badge');
      const customForm = getEl('browser-custom-form');
      const customInput = getEl('browser-custom-input');
      const customLabel = getEl('browser-custom-label');
      const viewport = getEl('fake-browser-viewport');
      const statusDot = getEl('browser-status-dot');
      const statusText = getEl('browser-status-text');

      if (modeBadge) {
        modeBadge.textContent = patchedMode ? 'Fixed' : 'Vulnerable';
        modeBadge.className = 'browser-mode-badge ' + (patchedMode ? 'is-fixed' : 'is-vuln');
      }

      if (customForm instanceof HTMLFormElement && customInput instanceof HTMLInputElement) {
        const allowCustom =
          runtime.activePlayer === 'hacker' || runtime.activePlayer === 'developer';
        customForm.hidden = !allowCustom;
        if (customLabel) customLabel.textContent = lab.customInputLabel;
        customInput.placeholder = lab.customInputPlaceholder;
        if (document.activeElement !== customInput) {
          customInput.value = runtime.currentInput;
        }
      }

      renderAddressBar(
        buildActiveAddressUrl(),
        runtime.browserView === 'result' && runtime.lastOutcome
          ? runtime.lastOutcome.isExternalHost
          : false,
      );

      if (runtime.browserView === 'result' && runtime.lastOutcome) {
        if (viewport) viewport.innerHTML = lab.renderResultViewport(runtime.lastOutcome);
        if (statusText) statusText.textContent = runtime.lastOutcome.statusText;
        if (statusDot) {
          statusDot.className =
            'status-dot ' +
            (runtime.lastOutcome.kind === 'exploited'
              ? 'is-danger'
              : runtime.lastOutcome.kind === 'blocked'
                ? 'is-safe'
                : 'is-ok');
        }
      } else {
        if (viewport) {
          const highlightAction = runtime.activePlayer === 'user';
          viewport.innerHTML = lab.renderStartViewport(
            runtime.activePlayer === 'user' ? '/club' : runtime.currentInput,
            patchedMode,
            false,
            highlightAction,
          );
        }
        if (statusText) {
          statusText.textContent = lab.initialStatus;
        }
        if (statusDot) {
          statusDot.className = 'status-dot';
        }
      }

      if (viewport) {
        const actionBtn = viewport.querySelector('[data-shop-action="submit"]');
        if (actionBtn) {
          actionBtn.addEventListener('click', () => {
            triggerSimulation(runtime.currentInput, { source: 'live-click' });
          });
        }
        const resetActionBtn = viewport.querySelector('[data-shop-action="reset"]');
        if (resetActionBtn) {
          resetActionBtn.addEventListener('click', () => {
            runtime.browserView = 'start';
            runtime.lastOutcome = null;
            renderAll();
          });
        }
      }
    }

    function renderChromeHeaders() {
      const doneCount = PLAYERS.filter((p) => isRoleDone(p.id)).length;
      const sidebarCount = getEl('sidebar-completion-count');
      const sidebarFill = getEl('sidebar-progress-fill');

      if (sidebarCount) sidebarCount.textContent = `${doneCount} / 4`;
      if (sidebarFill) sidebarFill.style.width = `${(doneCount / 4) * 100}%`;
    }

    // Compact sidebar: ONLY photo, name, job, and tiny Done/Badge icon
    function renderPlayerSidebar() {
      const host = getEl('player-selector-list');
      if (!host) return;
      host.innerHTML = PLAYERS.map((player) => {
        const isActive = runtime.activePlayer === player.id;
        const done = isRoleDone(player.id);
        let badgeHtml = '';
        if (done) {
          badgeHtml = '<span class="player-badge is-done" title="Done">✓</span>';
        }
        return `
          <button
            type="button"
            role="tab"
            aria-selected="${isActive}"
            class="player-select-btn player-select-btn-compact${isActive ? ' is-active' : ''}"
            data-select-player="${escapeHtml(player.id)}"
          >
            <img
              src="${escapeHtml(player.image)}"
              alt="${escapeHtml(player.name)}"
              referrerpolicy="no-referrer"
              class="player-thumb"
            />
            <div class="player-meta">
              <div class="player-name-row">
                <span>${escapeHtml(player.name)}</span>
                ${badgeHtml}
              </div>
              <div class="player-job-only">${escapeHtml(player.job)}</div>
            </div>
          </button>
        `;
      }).join('');
    }

    function renderSidePanel() {
      const host = getEl('role-side-panel');
      if (!host) return;

      if (runtime.activePlayer === 'teacher') {
        const slides = lab.slides;
        const slideIdx = Math.max(0, Math.min(slides.length - 1, prog.teacherSlide || 0));
        const slide = slides[slideIdx];

        host.innerHTML = `
          <div class="side-panel-head">
            <div>
              <p class="eyebrow">Prof. Noor · Slides</p>
              <h2 class="side-panel-title">Concept Briefing</h2>
            </div>
          </div>

          <div id="slide-deck-container" class="slide-deck-box">
            <div class="slide-deck-topbar">
              <span class="slide-tag">${escapeHtml(slide.tag)}</span>
              <span class="quiz-score-pill">Slide ${slideIdx + 1} / ${slides.length}</span>
            </div>

            <div class="slide-body">
              <h3 class="slide-title">${escapeHtml(slide.title)}</h3>
              <ul class="slide-points">
                ${slide.points.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('')}
              </ul>
            </div>

            <div class="slide-footer">
              <button
                type="button"
                id="slide-prev-btn"
                class="btn-subtle"
                ${slideIdx === 0 ? 'disabled' : ''}
              >
                ← Back
              </button>

              <div class="slide-dots" role="tablist" aria-label="Slide dots">
                ${slides
                  .map(
                    (_, i) => `
                  <button
                    type="button"
                    class="slide-dot${i === slideIdx ? ' is-active' : ''}"
                    aria-label="Go to slide ${i + 1}"
                    data-slide-index="${i}"
                  ></button>
                `,
                  )
                  .join('')}
              </div>

              <button
                type="button"
                id="slide-next-btn"
                class="btn-primary btn-xs"
                ${slideIdx === slides.length - 1 ? 'disabled' : ''}
              >
                Next →
              </button>
            </div>
          </div>
        `;

        const prevBtn = getEl('slide-prev-btn');
        const nextBtn = getEl('slide-next-btn');

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            if (prog.teacherSlide > 0) {
              prog.teacherSlide -= 1;
              persist();
              renderSidePanel();
            }
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            if (prog.teacherSlide < slides.length - 1) {
              prog.teacherSlide += 1;
              persist();
              renderSidePanel();
            }
          });
        }
        return;
      }

      if (runtime.activePlayer === 'user') {
        const loadedChoice =
          lab.userChoices.find((c) => c.id === runtime.userLoadedChoiceId) || lab.userChoices[0];
        const lastChoice =
          lab.userChoices.find((c) => c.id === prog.userLastChoiceId) || loadedChoice;

        host.innerHTML = `
          <div class="side-panel-head">
            <div>
              <p class="eyebrow">Tariq · Shopping Choices</p>
              <h2 class="side-panel-title">Pick &amp; Click in Live View</h2>
            </div>
          </div>

          ${
            prog.patched
              ? `<div class="shared-patch-banner is-safe">
                  <strong>Patched:</strong> Kareem's fix now protects Tariq from risky clicks.
                </div>`
              : ''
          }

          <div class="choices-stack">
            ${lab.userChoices
              .map((choice) => {
                const selected = loadedChoice && loadedChoice.id === choice.id;
                return `
                  <button
                    type="button"
                    class="choice-card choice-card-compact${selected ? ' is-selected' : ''}"
                    data-user-choice="${escapeHtml(choice.id)}"
                  >
                    <div class="choice-card-top">
                      <span class="choice-tag ${choice.type === 'safe' ? 'is-safe' : 'is-risky'}">
                        ${choice.type === 'safe' ? 'Safe Choice' : 'Risky Choice'}
                      </span>
                      <span class="choice-cta-hint">${
                        selected ? 'Loaded in Live View' : 'Load in Live View →'
                      }</span>
                    </div>
                    <div class="choice-label">${escapeHtml(choice.label)}</div>
                  </button>
                `;
              })
              .join('')}
          </div>

          ${
            runtime.browserView === 'result' && lastChoice
              ? `<div class="consequence-card ${
                  lastChoice.type === 'risky' && !prog.patched ? 'is-danger' : 'is-safe'
                }">
                  <div class="consequence-label">What Happened</div>
                  <p class="consequence-text">${escapeHtml(
                    prog.patched ? lastChoice.consequencePatched : lastChoice.consequenceVulnerable,
                  )}</p>
                </div>`
              : loadedChoice
                ? `<div class="consequence-card is-neutral">
                    <div class="consequence-label">Next Step</div>
                    <p class="consequence-text">Loaded in Live View! Now click the teal button inside the white Live View browser on the left to see the result.</p>
                  </div>`
                : ''
          }
        `;
        return;
      }

      if (runtime.activePlayer === 'hacker') {
        const hintsShown = prog.hackerHintsUsed || 0;
        const outcome = runtime.lastOutcome;

        let resultCardHtml = '';
        if (runtime.isRequesting) {
          resultCardHtml = `
            <div class="hacker-result-card is-loading">
              <div class="result-card-head">Running Payload…</div>
              <p class="result-card-copy">Watch Live View on the left…</p>
            </div>
          `;
        } else if (outcome && runtime.browserView === 'result') {
          if (outcome.flag) {
            resultCardHtml = `
              <div class="hacker-result-card is-captured">
                <div class="result-card-head">Flag Captured!</div>
                <div class="flag-box">${escapeHtml(outcome.flag)}</div>
              </div>
            `;
          } else if (outcome.blocked) {
            resultCardHtml = `
              <div class="hacker-result-card is-blocked">
                <div class="result-card-head">Attack Blocked</div>
                <p class="result-card-copy">${escapeHtml(outcome.detail)}</p>
              </div>
            `;
          } else {
            resultCardHtml = `
              <div class="hacker-result-card is-neutral">
                <div class="result-card-head">Harmless Action</div>
                <p class="result-card-copy">No vulnerability triggered. Run Attack 1 or Attack 2.</p>
              </div>
            `;
          }
        }

        host.innerHTML = `
          <div class="side-panel-head">
            <div>
              <p class="eyebrow">Zayd · Attack Payloads</p>
              <h2 class="side-panel-title">Run Payloads Beside Live View</h2>
            </div>
          </div>

          ${
            prog.patched
              ? `<div class="shared-patch-banner is-warning">
                  <span><strong>Patched by Developer</strong></span>
                  <button type="button" id="reopen-hole-btn" class="btn-subtle">
                    Re-open the hole
                  </button>
                </div>`
              : ''
          }

          <div class="payloads-stack">
            ${lab.payloads
              .map(
                (pl) => `
                <div class="payload-card payload-card-row">
                  <div class="payload-row-info">
                    <div class="payload-card-top">
                      <span class="payload-kind ${pl.kind === 'harmless' ? 'is-safe' : 'is-attack'}">
                        ${escapeHtml(pl.badge)}
                      </span>
                      <span class="payload-title">${escapeHtml(pl.title)}</span>
                    </div>
                    <code class="payload-code">${escapeHtml(pl.value)}</code>
                  </div>
                  <button
                    type="button"
                    class="btn-primary btn-xs"
                    data-run-payload="${escapeHtml(pl.id)}"
                  >
                    Run
                  </button>
                </div>
              `,
              )
              .join('')}
          </div>

          ${resultCardHtml}

          <div class="hints-box">
            <div class="hints-header">
              <span class="hints-title">Hints (${hintsShown}/${lab.hints.length})</span>
              <button
                type="button"
                id="reveal-hint-btn"
                class="btn-subtle"
                ${hintsShown >= lab.hints.length ? 'disabled' : ''}
              >
                ${hintsShown >= lab.hints.length ? 'All Shown' : `Show Hint ${hintsShown + 1}`}
              </button>
            </div>
            ${
              hintsShown > 0
                ? `<ol class="hints-list">
                    ${lab.hints
                      .slice(0, hintsShown)
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join('')}
                  </ol>`
                : ''
            }
          </div>
        `;

        const reopenBtn = getEl('reopen-hole-btn');
        if (reopenBtn) {
          reopenBtn.addEventListener('click', () => {
            prog.patched = false;
            prog.devMode = 'vulnerable';
            prog.devVerified = false;
            prog.devTests = {};
            persist();
            runtime.browserView = 'start';
            runtime.lastOutcome = null;
            renderAll();
          });
        }

        const hintBtn = getEl('reveal-hint-btn');
        if (hintBtn) {
          hintBtn.addEventListener('click', () => {
            if (prog.hackerHintsUsed < lab.hints.length) {
              prog.hackerHintsUsed += 1;
              persist();
              renderSidePanel();
              renderPlayerSidebar();
            }
          });
        }
        return;
      }

      // Developer Side Panel (Switch + Verification Table right beside Live View)
      const isFixed = prog.devMode === 'fixed';
      host.innerHTML = `
        <div class="side-panel-head">
          <div>
            <p class="eyebrow">Kareem · Patch &amp; Verify</p>
            <h2 class="side-panel-title">Fix Mode &amp; Test Table</h2>
          </div>
          <div class="dev-switch-group" role="group" aria-label="Switch code mode">
            <button
              type="button"
              class="filter-btn${!isFixed ? ' is-active' : ''}"
              data-dev-mode="vulnerable"
            >
              Vulnerable
            </button>
            <button
              type="button"
              class="filter-btn${isFixed ? ' is-active' : ''}"
              data-dev-mode="fixed"
            >
              Fixed
            </button>
          </div>
        </div>

        <div class="verify-table-wrap">
          <table class="verify-table">
            <thead>
              <tr>
                <th>Test Case</th>
                <th>Status</th>
                <th>Run</th>
              </tr>
            </thead>
            <tbody>
              ${lab.payloads
                .map((pl) => {
                  const testRec = prog.devTests[pl.id];
                  let statusCell = '<span class="test-pending">—</span>';
                  if (testRec && testRec.mode === prog.devMode) {
                    statusCell = testRec.pass
                      ? '<span class="test-pass">✅</span>'
                      : '<span class="test-fail">❌</span>';
                  }
                  return `
                    <tr>
                      <td>
                        <div class="vt-title">${escapeHtml(pl.badge)} · ${escapeHtml(pl.title)}</div>
                        <div class="vt-expected">${
                          pl.kind === 'harmless' ? 'Must still work' : 'Must be blocked'
                        }</div>
                      </td>
                      <td>${statusCell}</td>
                      <td>
                        <button
                          type="button"
                          class="btn-subtle"
                          data-dev-test="${escapeHtml(pl.id)}"
                        >
                          Test
                        </button>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>

        ${
          prog.devVerified
            ? `<div class="shared-patch-banner is-safe">
                <strong>Verified ✓</strong> Attacks blocked &amp; normal store works! Fix shared to Tariq &amp; Zayd.
              </div>`
            : ''
        }
      `;
    }

    function highlightCodeLine(line) {
      const tokenPattern = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|if|new)\b|\b(?:URLSearchParams|URL)\b|\b(?:window|params|parsed|raw|safe|searchString)\b)/g;
      let html = '';
      let last = 0;
      for (const match of line.matchAll(tokenPattern)) {
        const token = match[0];
        const index = match.index;
        html += escapeHtml(line.slice(last, index));
        let cls = 'syntax-variable';
        if (token.startsWith('//')) cls = 'syntax-comment';
        else if (token.startsWith('"') || token.startsWith("'")) cls = 'syntax-string';
        else if (/^(const|let|var|function|return|if|new)$/.test(token)) cls = 'syntax-keyword';
        else if (/^(URLSearchParams|URL)$/.test(token)) cls = 'syntax-type';
        html += `<span class="${cls}">${escapeHtml(token)}</span>`;
        last = index + token.length;
      }
      html += escapeHtml(line.slice(last));
      return html || '&nbsp;';
    }

    function renderCodeBlockHtml(isFixed) {
      const lines = isFixed ? lab.code.fixedLines : lab.code.vulnerableLines;
      const highlightSet = new Set(
        isFixed ? lab.code.fixedHighlightLines : lab.code.vulnerableHighlightLines,
      );
      return `
        <div class="code-inspector-box">
          <div class="code-inspector-head">
            <span>Helios Juice Shop Code (${isFixed ? 'Fixed Mode' : 'Vulnerable Mode'})</span>
            <span class="code-legend ${isFixed ? 'is-fix' : 'is-bug'}">
              ${isFixed ? 'Teal = Fix Applied' : 'Red = Bug Line'}
            </span>
          </div>
          <div class="code-lines-scroll">
            ${lines
              .map((line, idx) => {
                const lineNum = idx + 1;
                const isHl = highlightSet.has(lineNum);
                const hlClass = isHl ? (isFixed ? ' is-fix-line' : ' is-bug-line') : '';
                return `<div class="code-line${hlClass}"><span class="line-no">${lineNum}</span><code>${highlightCodeLine(
                  line,
                )}</code></div>`;
              })
              .join('')}
          </div>
        </div>
      `;
    }

    // Section cleanly UNDER Live View + Payloads/Verification: Codes (and Quiz for Prof. Noor)
    function renderDeveloperExplanation() {
      if (runtime.activePlayer !== 'developer') return '';

      if (lab.id === 'lab1') {
        return `
          <section class="developer-explainer">
            <div class="developer-explainer-heading"><span class="explainer-icon">i</span><div><p class="eyebrow">Developer Notes</p><h4>Why this redirect is vulnerable</h4></div></div>
            <p class="developer-explainer-copy">The <code>next</code> query parameter is controlled by whoever creates the link. The vulnerable handler passes it directly to <code>window.location.assign()</code>, so the browser navigates to an attacker-chosen destination. This is a client-side open redirect; the demo simulates navigation and never contacts the example phishing domain.</p>
            <div class="explanation-grid">
              <article class="explanation-item is-risk"><h5>Vulnerable line</h5><code>window.location.assign(nextUrl)</code><p>It uses untrusted input as a navigation target without validating the destination.</p></article>
              <article class="explanation-item is-safe"><h5>How the fix works</h5><ul><li>Accept only local paths beginning with one <code>/</code>.</li><li>Reject protocol-relative values beginning with <code>//</code>.</li><li>Parse the URL and compare its origin with the trusted shop origin.</li><li>Fall back to <code>/club</code> when validation fails.</li></ul></article>
            </div>
            <h4 class="code-walkthrough-title">Code walkthrough</h4><ol class="code-walkthrough"><li><code>URLSearchParams</code> reads query parameters.</li><li><code>raw</code> stores the requested destination.</li><li><code>safe</code> rejects values that are not local paths.</li><li><code>new URL()</code> resolves the path against the shop origin.</li><li>The origin check blocks any destination outside the shop.</li><li>Only the validated path and query are used.</li></ol>
          </section>`;
      }

      if (lab.id === 'lab2') {
        return `
          <section class="developer-explainer">
            <div class="developer-explainer-heading"><span class="explainer-icon">i</span><div><p class="eyebrow">Developer Notes</p><h4>Why this merge is vulnerable</h4></div></div>
            <p class="developer-explainer-copy">The profile JSON is untrusted. The vulnerable recursive merge follows properties already present on ordinary JavaScript objects. For <code>__proto__</code>, that inherited property points to <code>Object.prototype</code>; recursively copying attacker-controlled fields there changes defaults inherited by many unrelated objects. The <code>constructor.prototype</code> route can reach the same shared object when the merge also traverses functions. Pollution alone does not guarantee privilege escalation: an existing application feature (a gadget) must read and trust the injected property. In this simulation, the reviewer renderer is that gadget.</p>
            <div class="explanation-grid">
              <article class="explanation-item is-risk"><h5>Vulnerable line</h5><code>deepMerge(current, value)</code><p><code>current</code> can be an inherited special property, not a fresh profile object. The recursive merge then writes into a shared prototype.</p></article>
              <article class="explanation-item is-safe"><h5>How the fix works</h5><ul><li>Reject <code>__proto__</code>, <code>constructor</code>, and <code>prototype</code> at every nesting level.</li><li>Copy only own enumerable keys.</li><li>Create nested dictionaries with <code>Object.create(null)</code>.</li><li>Do not recursively merge untrusted data into ordinary objects.</li></ul></article>
            </div>
            <h4 class="code-walkthrough-title">Code walkthrough</h4><ol class="code-walkthrough"><li><code>JSON.parse()</code> converts the submitted JSON into data; it does not itself pollute the prototype.</li><li><code>Object.keys()</code> enumerates the source object's own keys.</li><li>The vulnerable version looks up <code>target[key]</code> and recursively follows inherited properties.</li><li>For <code>__proto__</code>, the lookup reaches <code>Object.prototype</code>.</li><li>The fixed copier skips dangerous keys and creates safe null-prototype objects for nested data.</li><li>The lab's outcome is simulated: it demonstrates the effect without actually modifying the browser's global prototype.</li></ol>
          </section>`;
      }

      if (lab.id === 'lab3') {
        return `
          <section class="developer-explainer">
            <div class="developer-explainer-heading"><span class="explainer-icon">i</span><div><p class="eyebrow">Developer Notes</p><h4>Why this page is vulnerable</h4></div></div>
            <p class="developer-explainer-copy">The sensitive admin response can be embedded by another site because it sends no anti-framing policy. An attacker can position that iframe with CSS so its real control sits over a harmless-looking button. The browser sends the click to the topmost frame. This only causes a privileged action if the victim is already authenticated and authorized, and the session cookie is available in the cross-site frame (for example, a cookie configured with <code>SameSite=None; Secure</code>). The demo simulates the click and does not load a real admin page.</p>
            <div class="explanation-grid">
              <article class="explanation-item is-risk"><h5>Vulnerable configuration</h5><code>Missing frame-ancestors policy</code><p>Without a framing restriction, the browser has no instruction to prevent another origin from embedding this response.</p></article>
              <article class="explanation-item is-safe"><h5>How the fix works</h5><ul><li>Send <code>Content-Security-Policy: frame-ancestors 'none'</code>.</li><li>Send <code>X-Frame-Options: DENY</code> as a legacy fallback.</li><li>Set these as HTTP response headers on sensitive pages.</li><li>Direct visits still work; framing by other pages is blocked.</li></ul></article>
            </div>
            <h4 class="code-walkthrough-title">Code walkthrough</h4><ol class="code-walkthrough"><li>The server creates the admin HTML response.</li><li>The vulnerable response sets only the content type.</li><li>The browser is therefore allowed to render the page in an iframe, subject to other policies.</li><li>The fixed response adds CSP <code>frame-ancestors 'none'</code>.</li><li><code>X-Frame-Options: DENY</code> provides compatibility with older browsers.</li><li>These headers must be sent by the server; placing them in a normal HTML meta tag is not an equivalent fix.</li><li>Use appropriate <code>SameSite</code> cookie settings as defense in depth, not as a replacement for frame restrictions.</li></ol>
          </section>`;
      }
      return '';
    }

    function renderBottomPanel() {
      const host = getEl('role-bottom-panel');
      if (!host) return;

      const isFixed = getEffectiveModePatched();

      if (runtime.activePlayer === 'teacher') {
        const quiz = lab.quiz;
        let score = 0;
        quiz.forEach((q, idx) => {
          if (prog.quizAnswers[idx] === q.correctIndex) score += 1;
        });

        host.innerHTML = `
          <div class="role-workspace-card">
            <div class="quiz-header-row">
              <div>
                <p class="eyebrow">Check Your Understanding</p>
                <h3 class="quiz-heading">Quiz</h3>
              </div>
              <span class="quiz-score-pill">Score: ${score} / ${quiz.length}</span>
            </div>

            <div class="quiz-grid">
              ${quiz
                .map((q, qIdx) => {
                  const chosen = prog.quizAnswers[qIdx];
                  const hasAnswered = chosen !== undefined;
                  const isCorrect = hasAnswered && chosen === q.correctIndex;
                  return `
                    <div class="quiz-card">
                      <p class="quiz-question">
                        <span class="quiz-num">Q${qIdx + 1}.</span> ${escapeHtml(q.question)}
                      </p>
                      <div class="quiz-options">
                        ${q.options
                          .map((opt, oIdx) => {
                            let cls = 'quiz-opt-btn';
                            if (hasAnswered) {
                              if (oIdx === q.correctIndex) cls += ' is-correct';
                              else if (oIdx === chosen) cls += ' is-wrong';
                            }
                            return `
                              <button
                                type="button"
                                class="${cls}"
                                data-quiz-q="${qIdx}"
                                data-quiz-opt="${oIdx}"
                              >
                                ${escapeHtml(opt)}
                              </button>
                            `;
                          })
                          .join('')}
                      </div>
                      ${
                        hasAnswered
                          ? `<div class="quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}">
                              <strong>${isCorrect ? 'Correct!' : 'Not quite.'}</strong>
                              ${escapeHtml(q.explanation)}
                            </div>`
                          : ''
                      }
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
        return;
      }

      // User, Hacker & Developer: The Code is right under Live View + Choices/Payloads/Verification
      host.innerHTML = `
        <div class="role-workspace-card">
          <div class="bottom-code-header">
            <div>
              <h3 class="quiz-heading">${escapeHtml(lab.title)} Handler &amp; Defense</h3>
            </div>
            <span class="dev-defense-chip">${escapeHtml(lab.defenseSummary)}</span>
          </div>
          ${renderCodeBlockHtml(isFixed)}
          ${renderDeveloperExplanation()}
        </div>
      `;
    }

    function checkDevVerification() {
      if (prog.devMode !== 'fixed') {
        prog.devVerified = false;
        prog.patched = false;
        return;
      }
      const allPass = lab.payloads.every((pl) => {
        const rec = prog.devTests[pl.id];
        return rec && rec.mode === 'fixed' && rec.pass === true;
      });
      prog.devVerified = allPass;
      if (allPass) {
        prog.patched = true;
      }
    }

    function highlightHtmlSource(source) {
      const tokens = String(source).match(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+|</g) || [];
      return tokens.map((token) => {
        if (token.startsWith('<!--')) {
          return `<span class="syntax-comment">${escapeHtml(token)}</span>`;
        }
        if (token.startsWith('<')) {
          const tagMatch = token.match(/^(<\/?)([A-Za-z][\w:-]*)/);
          if (!tagMatch) return escapeHtml(token);
          let html = `<span class="syntax-punctuation">${escapeHtml(tagMatch[1])}</span><span class="syntax-tag">${escapeHtml(tagMatch[2])}</span>`;
          const rawRest = token.slice(tagMatch[0].length).replace(/\/?\s*>$/, '');
          const attrPattern = /(\s+)([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*')/g;
          let cursor = 0;
          for (const match of rawRest.matchAll(attrPattern)) {
            html += escapeHtml(rawRest.slice(cursor, match.index));
            html += escapeHtml(match[1]);
            html += `<span class="syntax-attribute">${escapeHtml(match[2])}</span>`;
            html += escapeHtml(match[3]);
            html += `<span class="syntax-string">${escapeHtml(match[4])}</span>`;
            cursor = match.index + match[0].length;
          }
          html += escapeHtml(rawRest.slice(cursor));
          if (token.endsWith('/>')) html += '<span class="syntax-punctuation">/&gt;</span>';
          else if (token.endsWith('>')) html += '<span class="syntax-punctuation">&gt;</span>';
          return html;
        }
        return escapeHtml(token);
      }).join('');
    }

    function renderSourceModalContent() {
      const body = getEl('source-code-body');
      const note = getEl('source-view-note');
      if (!body) return;

      document.querySelectorAll('[data-source-tab]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-source-tab') === runtime.sourceTab);
      });

      const isShowingResult = runtime.browserView === 'result' && runtime.lastOutcome;
      if (note) {
        note.textContent = runtime.sourceTab === 'html'
          ? (isShowingResult
              ? 'HTML structure of the sign-in result currently displayed.'
              : 'HTML structure of the Helios Juice Shop sign-in page.')
          : 'JavaScript handler for current mode (' +
            (getEffectiveModePatched() ? 'Fixed' : 'Vulnerable') + ').';
      }

      if (runtime.sourceTab === 'html') {
        const htmlStr = isShowingResult
          ? lab.getResultHtmlSource(runtime.lastOutcome)
          : lab.getStartHtmlSource();
        body.innerHTML = `<pre class="source-pre source-highlighted">${highlightHtmlSource(htmlStr)}</pre>`;
        return;
      }

      body.innerHTML = renderCodeBlockHtml(getEffectiveModePatched());
    }

    function openSourceModal() {
      const modal = getEl('source-modal');
      if (!modal) return;
      modal.hidden = false;
      renderSourceModalContent();
    }

    function closeSourceModal() {
      const modal = getEl('source-modal');
      if (modal) modal.hidden = true;
    }

    function triggerSimulation(inputVal, meta) {
      if (runtime.requestTimer) {
        window.clearTimeout(runtime.requestTimer);
      }
      const patchedMode = getEffectiveModePatched();
      const outcome = lab.evaluate(inputVal, patchedMode);

      runtime.currentInput = inputVal;
      runtime.isRequesting = false;
      runtime.lastOutcome = outcome;
      runtime.browserView = 'result';

      if (runtime.activePlayer === 'user') {
        const matchedChoice =
          (meta && meta.choice) ||
          lab.userChoices.find((c) => c.id === runtime.userLoadedChoiceId) ||
          lab.userChoices.find((c) => c.input === inputVal);
        if (matchedChoice) {
          prog.userLastChoiceId = matchedChoice.id;
          if (matchedChoice.type === 'safe') prog.userSafeTried = true;
          else prog.userRiskyTried = true;
        } else if (outcome.consequenceRisky) {
          prog.userRiskyTried = true;
        } else {
          prog.userSafeTried = true;
        }
      }

      if (runtime.activePlayer === 'hacker' && outcome.flag) {
        prog.hackerFlagCaptured = true;
        if ((prog.hackerHintsUsed || 0) === 0) {
          prog.hackerNoHintsBadge = true;
        }
      }

      if (runtime.activePlayer === 'developer') {
        const pl =
          meta && meta.payloadId
            ? lab.payloads.find((item) => item.id === meta.payloadId)
            : lab.payloads.find((item) => item.value === inputVal);
        if (pl) {
          const pass = pl.kind === 'harmless' ? outcome.worksNormal : outcome.blocked;
          prog.devTests[pl.id] = { pass: pass, mode: prog.devMode };
          checkDevVerification();
        }
      }

      persist();
      renderAll();
    }

    function syncLayoutForRole() {
      const isTeacher = runtime.activePlayer === 'teacher';
      const browserCard = document.querySelector('.fake-browser-card');
      const topSplit = document.querySelector('.lab-top-split');
      if (browserCard instanceof HTMLElement) {
        browserCard.hidden = isTeacher;
      }
      if (topSplit instanceof HTMLElement) {
        topSplit.classList.toggle('is-single-col', isTeacher);
      }
    }

    function renderAll() {
      syncLayoutForRole();
      renderChromeHeaders();
      renderPlayerSidebar();
      if (runtime.activePlayer !== 'teacher') {
        renderBrowser();
      }
      renderSidePanel();
      renderBottomPanel();
    }

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const playerBtn = target.closest('[data-select-player]');
      if (playerBtn) {
        const nextPlayer = playerBtn.getAttribute('data-select-player');
        if (nextPlayer && PLAYERS.some((p) => p.id === nextPlayer)) {
          runtime.activePlayer = nextPlayer;
          if (nextPlayer === 'user' && lab.userChoices[0]) {
            runtime.userLoadedChoiceId = lab.userChoices[0].id;
            runtime.currentInput = lab.userChoices[0].input;
          } else {
            runtime.currentInput = lab.defaultCustomInput;
          }
          runtime.browserView = 'start';
          runtime.lastOutcome = null;
          renderAll();
        }
        return;
      }

      const slideDot = target.closest('[data-slide-index]');
      if (slideDot) {
        const idx = Number(slideDot.getAttribute('data-slide-index'));
        if (!Number.isNaN(idx)) {
          prog.teacherSlide = idx;
          persist();
          renderSidePanel();
        }
        return;
      }

      const quizBtn = target.closest('[data-quiz-q]');
      if (quizBtn) {
        const qIdx = Number(quizBtn.getAttribute('data-quiz-q'));
        const optIdx = Number(quizBtn.getAttribute('data-quiz-opt'));
        if (!Number.isNaN(qIdx) && !Number.isNaN(optIdx)) {
          prog.quizAnswers[qIdx] = optIdx;
          if (Object.keys(prog.quizAnswers).length >= lab.quiz.length) {
            prog.teacherDone = true;
          }
          persist();
          renderAll();
        }
        return;
      }

      const choiceBtn = target.closest('[data-user-choice]');
      if (choiceBtn) {
        const choiceId = choiceBtn.getAttribute('data-user-choice');
        const choice = lab.userChoices.find((c) => c.id === choiceId);
        if (choice) {
          runtime.userLoadedChoiceId = choice.id;
          runtime.currentInput = choice.input;
          runtime.browserView = 'start';
          runtime.lastOutcome = null;
          renderAll();
        }
        return;
      }

      const payloadBtn = target.closest('[data-run-payload]');
      if (payloadBtn) {
        const pid = payloadBtn.getAttribute('data-run-payload');
        const pl = lab.payloads.find((p) => p.id === pid);
        if (pl) {
          triggerSimulation(pl.value, { source: 'hacker', payloadId: pl.id });
        }
        return;
      }

      const devModeBtn = target.closest('[data-dev-mode]');
      if (devModeBtn) {
        const nextMode = devModeBtn.getAttribute('data-dev-mode');
        if (nextMode === 'vulnerable' || nextMode === 'fixed') {
          prog.devMode = nextMode;
          if (nextMode === 'vulnerable') {
            prog.devVerified = false;
            prog.patched = false;
          } else {
            checkDevVerification();
          }
          runtime.browserView = 'start';
          runtime.lastOutcome = null;
          persist();
          renderAll();
        }
        return;
      }

      const devTestBtn = target.closest('[data-dev-test]');
      if (devTestBtn) {
        const pid = devTestBtn.getAttribute('data-dev-test');
        const pl = lab.payloads.find((p) => p.id === pid);
        if (pl) {
          triggerSimulation(pl.value, { source: 'dev', payloadId: pl.id });
        }
        return;
      }

      const srcTab = target.closest('[data-source-tab]');
      if (srcTab) {
        const tab = srcTab.getAttribute('data-source-tab');
        if (tab === 'html' || tab === 'js') {
          runtime.sourceTab = tab;
          renderSourceModalContent();
        }
      }
    });

    const customForm = getEl('browser-custom-form');
    if (customForm) {
      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = getEl('browser-custom-input');
        const val = input instanceof HTMLInputElement ? input.value : runtime.currentInput;
        triggerSimulation(val, { source: 'custom' });
      });
    }

    const customInput = getEl('browser-custom-input');
    if (customInput) {
      customInput.addEventListener('input', (e) => {
        if (e.target instanceof HTMLInputElement) {
          runtime.currentInput = e.target.value;
        }
      });
    }

    const resetBrowserBtn = getEl('reset-browser-btn');
    if (resetBrowserBtn) {
      resetBrowserBtn.addEventListener('click', () => {
        if (runtime.requestTimer) window.clearTimeout(runtime.requestTimer);
        runtime.isRequesting = false;
        runtime.browserView = 'start';
        runtime.lastOutcome = null;
        renderAll();
      });
    }

    const openSourceBtn = getEl('open-source-btn');
    if (openSourceBtn) {
      openSourceBtn.addEventListener('click', openSourceModal);
    }

    const closeSourceBtn = getEl('source-close-btn');
    if (closeSourceBtn) {
      closeSourceBtn.addEventListener('click', closeSourceModal);
    }

    const sourceModal = getEl('source-modal');
    if (sourceModal) {
      sourceModal.addEventListener('click', (e) => {
        if (e.target === sourceModal) closeSourceModal();
      });
    }

    const resetProgressBtn = getEl('reset-progress-btn');
    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', () => {
        Object.assign(prog, createEmptyLabProgress());
        runtime.browserView = 'start';
        runtime.lastOutcome = null;
        runtime.currentInput = lab.defaultCustomInput;
        persist();
        renderAll();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSourceModal();
        return;
      }

      if (runtime.activePlayer !== 'teacher') return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'ArrowRight' && prog.teacherSlide < lab.slides.length - 1) {
        prog.teacherSlide += 1;
        persist();
        renderSidePanel();
      } else if (e.key === 'ArrowLeft' && prog.teacherSlide > 0) {
        prog.teacherSlide -= 1;
        persist();
        renderSidePanel();
      }
    });

    renderAll();
  }

  initLabEngine();
})();
