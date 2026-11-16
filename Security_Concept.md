# Security Concept

## Purpose and status

This document defines the security requirements for the existing personal server dashboard. It is being documented after the initial implementation; it does not claim that a written security concept guided the original development.

The requirements below describe the intended protection. Source-code observations provide context, not proof that the deployed system satisfies these requirements. Deployment settings and security test results remain to be verified.

The implementation review, findings, corrective actions and retests for learning objective 6.9 will be recorded in [Lernziele_Testing.md](Lernziele_Testing.md), referencing the requirement IDs in this document. Creating this concept does not complete that review.

## Scope and intended use

- The dashboard is a personal application with one intended user: its owner. Shared accounts, public registration and access by other users are not intended.
- The application uses Next.js and Node.js. The existing testing documentation describes deployment on an Ubuntu server with PostgreSQL databases.
- Functions include server monitoring, file listings, database browsing, tasks, notes and a whiteboard, reminders, and work-time tracking.
- Tailscale is the intended remote access method. The owner believes they use a Tailscale address, and the testing documentation describes access through Tailscale. Exclusive Tailscale access has not yet been verified.
- The owner is responsible for access configuration, updates, backups and approval of corrective changes.

This concept covers the application and the server settings directly relevant to protecting it. It is not a security assessment of every other service on the server.

## Protected information and security goals

| Asset | Protection needed |
| --- | --- |
| Notes, whiteboard content, tasks and reminders | Prevent unauthorised reading, modification and deletion. |
| Work-time records and absence information | Protect personal information, including potentially sensitive health-related absence details. |
| File listings and database contents | Restrict visibility to the owner and limit the scope available to the application. |
| Database credentials, private VAPID key and push subscriptions | Prevent disclosure and misuse; permit the public VAPID key to be used by the browser as intended. |
| Server status, logs, service information and internal paths | Avoid disclosure to unauthorised parties. |
| Persistent data and backup material | Preserve integrity and support recovery from mistakes or failures. |

The main goals are confidentiality of personal information, integrity of stored records, and availability sufficient for personal use. High availability is not required, but recovery must be possible.

## Trust boundaries and main risks

The intended request path is the owner's authorised device, through Tailscale and any configured HTTPS endpoint or reverse proxy, to the Next.js application. The application then accesses PostgreSQL, selected server directories, local monitoring commands and notification services. The actual deployment path remains to be checked.

Tailscale membership alone is not proof that only the owner can access the dashboard. Device sharing, access policies, listeners, proxies, firewall rules and public publishing settings must also be considered. Browser pages and API routes require the same access boundary; hiding a navigation link is not access control.

Relevant risks include accidental public or LAN exposure, access from another tailnet identity or compromised device, malicious requests from websites opened on an authorised device, invalid API input, excessive database or operating-system permissions, exposed secrets, and data loss. Push delivery also crosses an external service boundary, and notification text may be visible on a device's lock screen.

## Security requirements and planned verification

All requirements below are pending security verification. Existing functional test results do not automatically establish security compliance.

| ID | Requirement | Planned verification |
| --- | --- | --- |
| SEC-01 | Only the owner and their explicitly authorised devices may access the dashboard and its API routes. No public access or direct LAN bypass is intended. | Inspect server listeners, firewall and proxy configuration, Tailscale access policies and any Serve/Funnel configuration. Check access through the intended route and rejection through relevant unauthorised routes. Record any untested route as unverified. |
| SEC-02 | The deployed access boundary must protect every page and API, including write and monitoring endpoints. Any reliance on network-level access control must be explicit and verified. | Check application authentication or deployment-level controls and test representative direct API requests outside the authorised boundary. If that boundary cannot be established, correct exposure or add appropriate authentication before treating access as protected. |
| SEC-03 | Browser/PWA access must use HTTPS with a valid certificate, without an exposed plaintext bypass. | Inspect the actual browser connection and TLS termination, including whether the upstream application port can be reached directly. Do not infer HTTPS from Tailscale use alone. |
| SEC-04 | Private credentials must stay server-side, outside version control, public files, client bundles and API responses. Environment and backup files containing secrets must have restricted permissions. | Review how configuration is referenced, ignore rules and tracked filenames; check server file permissions and response handling. Any secret scan must report redacted findings, not secret values. If exposure is found, remove it and rotate affected credentials. |
| SEC-05 | PostgreSQL access must be limited to the databases, tables and operations each function needs. The application must not use a PostgreSQL superuser; database browsing should use read-only privileges where practical. | Review connections and database selection, then inspect deployed roles, grants and network exposure using redacted evidence. Allow only the schema-creation privileges actually required by the application's current automatic initialisation. |
| SEC-06 | APIs must validate input on the server, regardless of browser validation. Reject invalid required fields, identifiers, dates and unsupported operations; apply appropriate size and range limits. SQL values must be parameterised, and dynamic identifiers strictly validated and safely quoted. | Review read and write handlers and run isolated negative tests, including blank task titles, malformed identifiers, invalid dates and oversized or out-of-range input. Verify rejected writes leave data unchanged. |
| SEC-07 | File access must stay within configured directories and the minimum required filesystem permissions. Request input must not select arbitrary paths, and symlinks must not bypass the intended scope. | Review the file endpoint and deployed storage directory/permissions. If path input or file-serving routes exist, test traversal and symlink handling in an isolated test directory. |
| SEC-08 | The dashboard must run without root or broad passwordless administrative privileges. Monitoring commands must be restricted to intended operations, without request-controlled command execution. | Review command invocation and data flow, then inspect the service account and relevant sudo permissions. Do not grant broad privileges just to make a monitoring widget work. |
| SEC-09 | Error responses and logs must not disclose credentials or unnecessary private information. Detailed server diagnostics must remain within the owner's access boundary. | Review error handling and representative failure responses; check log access and redact evidence. Distinguish intentionally displayed owner-only diagnostics from information needed in general errors. |
| SEC-10 | State-changing requests must be protected against unwanted cross-origin actions. Do not rely solely on UI controls or browser CORS restrictions. | Review accepted content types, origin/CSRF protections and the chosen authentication model; perform controlled cross-origin negative tests without altering important data. |
| SEC-11 | Push subscriptions and notification delivery must be limited to authorised use. Subscription endpoints must be validated before outbound delivery; reminders must not contain credentials or content the owner does not want on a lock screen. | Review subscription registration, test-push handling and worker delivery, including destination validation, private-network destinations and delivery limits. Use test subscriptions and harmless notification content only. |
| SEC-12 | Important persistent data must have a documented backup schedule, scope, retention and protected storage. Recovery must be tested without overwriting production data. | Identify coverage for all relevant PostgreSQL databases and stored files, inspect recent backup evidence, and restore a sample into an isolated location. A displayed backup status alone is insufficient proof of recoverability. |
| SEC-13 | Application dependencies and the Ubuntu/Node.js runtime must be maintained. Known vulnerabilities must be assessed and addressed according to their impact on this deployment. | Run a dependency advisory check, review the lockfile and inspect server/runtime update status. Document relevant findings, approved updates and subsequent functional verification. |

## Existing source-code context

These observations identify where verification should begin. They are not completed security tests or a declaration that other routes are safe.

| Source | Observed implementation and evidence limit |
| --- | --- |
| `package.json` | Defines Next.js/React, PostgreSQL access via `pg`, Web Push, and lint/build/test commands. It does not establish the deployed runtime or patch status. |
| `.gitignore` | Ignores `.env`, `.env.local` and `.env.*.local`. Ignore patterns alone do not prove that secrets were never committed or are protected on the server. |
| `app/api/tasks/route.js` | Reads its database connection from a server-side environment variable and uses parameterised values for inserts. It validates reminder dates, but trims the title without explicitly rejecting an empty result in this handler. Server-side required-field enforcement needs review under SEC-06. |
| `app/api/database_rows/route.js` | Validates and quotes database/schema/table identifiers and parameterises pagination values. The selected database comes from a request parameter; permitted database scope, pagination ranges and actual role privileges still need verification. |
| `app/api/files/route.js` | Lists entries from a server-configured storage directory or the project's `files` directory. This handler does not accept a request-supplied path. Deployed directory scope and permissions remain unverified. |
| `app/api/admin/route.js` | Runs predefined monitoring commands and returns service, log and system information. Its handler contains no explicit authentication check; protection by another layer and effective operating-system privileges remain unverified. |
| `app/api/pm2/route.js` | Runs a fixed PM2 listing command and returns selected process fields rather than the complete PM2 environment. Actual execution privileges and endpoint access still need verification. |
| `app/api/backups/route.js` | Reads a backup-status file. It does not create backups or demonstrate that a restore succeeds. |
| `app/api/push/subscribe/route.js` | Stores subscriptions using parameterised SQL and checks that subscription fields are present. Endpoint destination validation and authorised registration/delivery require further review. |
| `next.config.mjs` | Includes a development-origin setting. That setting is not evidence of production authentication, firewall protection or Tailscale-only access. |
| `README.md` | Describes persistent feature storage, a separate work-time database, reminder delivery and functional verification commands. These descriptions do not verify deployment security or backup coverage. |

No credential files were inspected for this concept. No live Ubuntu, PostgreSQL, Tailscale or firewall configuration was checked, and no security tests were executed as part of writing it.

## Verification and corrective-action process

1. Compare each requirement with the actual source and deployment. Record the requirement ID, check, evidence and actual result in the learning-objective report.
2. Use explicit outcomes: **met**, **not met**, or **not verified**. Mark a check **not applicable** only with a documented reason.
3. Obtain the owner's approval before changing application code, access settings, privileges or backup configuration. Start with read-only checks and isolated test data; do not expose the dashboard publicly to test it.
4. For a confirmed gap, record its risk, the agreed correction and what was actually changed. If no correction is necessary, document the evidence rather than inventing an issue.
5. Repeat the relevant check after a correction, confirm normal functionality and record the result. A code change alone is not a successful retest.
6. Keep deployment outputs redacted. Evidence must not publish credentials, exact private addresses or personal records.

Review this concept when adding users, changing exposure or authentication, introducing privileged operations, or changing storage and backup arrangements. Until the pending checks are completed, this document is a security baseline, not a certification that the dashboard is secure.
