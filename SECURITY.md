# Security Policy

## Supported Versions

Bench provides security updates and vulnerability patches for the current release stream:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3.0 | :x:                |

---

## Reporting a Vulnerability

The Bench team takes the security and privacy of its local-first architecture seriously.

If you discover a security vulnerability (such as Cross-Site Scripting vulnerabilities in markdown rendering, directory traversal flaws in local development servers, or unsafe deserialization issues), please report it responsibly:

1. **Do not create a public GitHub issue.**
2. Report the vulnerability privately via **[GitHub Security Advisories](https://github.com/sedmugen/bench/security/advisories/new)** or by email to `saad@saadm.com` (or via GitHub direct contact).
3. Provide detailed steps to reproduce the issue, including environment details, sample payloads, and observed behavior.

### What to Expect:
- **Acknowledgement:** We will acknowledge receipt of your vulnerability report within 48 hours.
- **Assessment:** We will validate the issue, determine severity, and draft an advisory and patch.
- **Fix & Disclosure:** A patched version will be released, and credit will be acknowledged in the release notes upon disclosure.

---

## Local-First Security Guarantees

- **Zero Remote Telemetry:** Bench never transmits your tasks, areas, notes, or clips to any remote server or third-party tracking platform.
- **Isolated Storage:** All data is persisted locally within your system's webview storage or local configuration directory.
- **XSS Protection:** All raw user inputs rendered via markdown or DOM templates are sanitized via entity escaping (`escapeHtml`).
