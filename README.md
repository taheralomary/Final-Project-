# ShieldQuest — Interactive Web Security Sandbox

**Live Demo:** https://taheralomary.github.io/Final-Project-/

ShieldQuest is an interactive, browser-based cybersecurity learning project that demonstrates three web vulnerabilities through safe simulations. Each lab helps visitors understand how the vulnerability works, observe its impact, inspect the relevant code, and compare vulnerable and fixed implementations.

## Labs

### 1. DOM-Based Open Redirect
Demonstrates how an application can misuse a user-controlled redirect destination and send visitors to an untrusted website. The lab compares the vulnerable redirect handling with validation that restricts navigation to safe, same-site paths.

### 2. Prototype Pollution
Demonstrates how unsafe handling of attacker-controlled object properties can modify an object's prototype and affect other parts of an application. The lab shows the vulnerable merge behavior and defensive handling of dangerous property names.

### 3. Clickjacking (UI Redress)
Demonstrates how a malicious page can attempt to frame a legitimate interface and trick a user into clicking an unintended control. The lab explains defensive framing restrictions, including Content Security Policy's `frame-ancestors` directive and `X-Frame-Options`.

## Features

- Three interactive web security labs.
- Vulnerable and fixed modes for comparing behavior.
- Safe, in-browser demonstrations; no real targets are attacked.
- Code/source viewers to explore the implementation.
- Developer-focused explanations of the vulnerability, risky code, and mitigation.
- Beginner-friendly interface and guided test cases.

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)

The project is a static front-end website. It does not require a backend, database, or login system.

## Run Locally

1. Clone or download this repository.
2. Open `index.html` in a modern web browser.
3. Navigate to any of the three labs from the home page.

If your browser restricts local-file behavior, run a simple local HTTP server from the project directory instead:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```text
.
├── index.html          # Home page
├── lab1.html           # DOM-Based Open Redirect lab
├── lab2.html           # Prototype Pollution lab
├── lab3.html           # Clickjacking lab
├── app.js              # Shared application behavior
├── lab1.js             # Lab 1 logic
├── lab2.js             # Lab 2 logic
├── lab3.js             # Lab 3 logic
├── lab-engine.js       # Shared lab functionality
├── styles.css          # Website styling
└── assets/             # Images and visual assets
```

## Safety Notice

ShieldQuest is intended for education and demonstration. The attack scenarios are simulated locally in the browser and should only be used to understand the vulnerabilities and their mitigations. Do not use these techniques against websites or systems without explicit authorization.

## References

- [OWASP](https://owasp.org/) — Web application security guidance.
- [MITRE CWE](https://cwe.mitre.org/) — Common Weakness Enumeration.
- [MDN Web Docs](https://developer.mozilla.org/) — Web platform documentation.

---

Built as an educational web security project at 42.
