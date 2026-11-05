# Collexus --- Project Requirements & Technical Direction (RTD)

> **Document purpose:** This file is the shared project brief and
> implementation guide for developers and AI coding agents working on
> Collexus. Read it before changing code, database schemas,
> authentication, payments, or user-facing workflows.

**Project:** Collexus\
**Product:** College events, hackathons, registrations, payments, and
campus food-ordering platform\
**Document status:** Working specification --- verify existing
implementation before making changes\
**Primary rule:** Preserve working features. Inspect the repository and
current Supabase schema before implementing or migrating anything.

------------------------------------------------------------------------

## 1. Product vision

Collexus is a centralized platform through which students can discover
college events and hackathons, register online, complete payments where
required, receive registration details, and order food from
participating campus stalls.

The platform should be designed for expansion beyond one college. It
should support events hosted by other colleges, universities,
organizers, and approved external event providers without requiring a
redesign of the core system.

### Main goals

-   Make event discovery and registration simple on mobile and desktop.
-   Support free and paid event registrations.
-   Provide reliable payment confirmation and registration records.
-   Give organizers tools to manage events and participants.
-   Give authorized staff a fast, limited-access event-entry
    verification workflow.
-   Support campus food menus, orders, payments, and pickup.
-   Keep student data private and enforce permissions on the server and
    database.
-   Build a maintainable foundation that can scale as participating
    institutions and traffic grow.

### Product principles

1.  **Mobile-first:** Most students will access Collexus from phones.
2.  **Security by default:** Hiding a button is not authorization.
    Enforce access on the server and in Supabase Row Level Security
    (RLS).
3.  **One source of truth:** Payment and check-in status must come from
    trusted backend/database records.
4.  **Fast operations:** Event check-in must be quick, clear, and
    resistant to duplicate scans.
5.  **Accessible UX:** Clear labels, readable contrast, keyboard
    support, useful errors, and loading states.
6.  **Incremental development:** Do not rebuild or replace working
    modules without a clear reason.

------------------------------------------------------------------------

## 2. Application panels and roles

Collexus has five primary panels. The same account may have more than
one role only when an administrator explicitly grants it. A user's role
must never be inferred from their email address or from a client-side
value.

### 2.1 Student Panel

Purpose: The main student-facing experience.

Expected capabilities:

-   Sign up, sign in, sign out, and manage an account.
-   View and update permitted profile fields.
-   Browse events and hackathons.
-   View event details, eligibility, dates, venue, fees, rules, and
    organizer information.
-   Register for events and view registration status.
-   Complete payment for paid registrations.
-   View registration confirmation and a QR entry pass when applicable.
-   View their own registration/payment history.
-   Browse available food stalls and menus.
-   Place food orders, pay when required, and view order/pickup status.
-   Access help/support information without exposing a staff member's
    personal phone number.

Students may access only their own private profile, registrations,
payments, tickets, and orders.

### 2.2 Admin Panel

Purpose: Platform-wide management.

Expected capabilities:

-   Manage student accounts and account status.
-   Create, update, publish, unpublish, and archive events.
-   Manage event organizers and event-panel assignments.
-   Assign staff to specific events and revoke assignments.
-   Manage food stalls, stall operators, menus, availability, and
    permissions.
-   View platform-level registration and order information according to
    authorized permissions.
-   Review payment records and reconciliation information.
-   View operational reports and audit logs.
-   Configure approved platform settings.

Admin actions involving role changes, refunds, payment adjustments, or
sensitive student data should be permission-restricted and audited.
Avoid giving every admin account unrestricted access if more granular
permissions are practical.

### 2.3 Event Panel

Purpose: Event organizers manage their own events.

Expected capabilities:

-   Create and edit events they are authorized to manage.
-   Configure event description, dates, venue, eligibility, capacity,
    registration deadline, fee, and terms.
-   Choose whether an event is free or paid.
-   View registrations for their assigned events.
-   View participant lists and permitted participant details.
-   Monitor registration counts and event status.
-   Assign or request staff through the admin-controlled workflow.
-   View event check-in totals and operational reports.
-   Add an external event link when the event registration is hosted
    elsewhere.

Event organizers must not access unrelated events or platform-wide
student/payment data.

### 2.4 Food Stall Panel

Purpose: Stall operators manage their own food service.

Expected capabilities:

-   Manage the stall profile and opening/closing availability, if
    permitted.
-   Add, edit, enable, disable, and update menu items.
-   Set item name, description, price, image, and availability.
-   Receive new orders.
-   View only the order details required to prepare and hand over food.
-   Update order status through defined states, for example: `placed`,
    `accepted`, `preparing`, `ready`, `completed`, or `cancelled`.
-   View relevant payment status without being able to alter payment
    records.
-   Search orders by order number or other permitted identifier.

A stall operator must not access another stall's menu, orders, or
financial records.

### 2.5 Staff Panel --- Event Entry Verification

Purpose: Help authorized staff verify that a student is registered and
eligible to enter a particular event. This panel should remain simple
and optimized for quick check-in.

#### Staff access

-   Each staff member uses an individual authenticated account.
-   Admin assigns the staff member to one or more specific events.
-   Staff can access only events assigned to them.
-   Revoking an assignment must remove access promptly.
-   Staff must not receive general admin access.
-   Staff must not be able to edit student profiles, event settings,
    registration fees, or payment records.

#### Staff home screen

Show only useful operational information:

-   Assigned event name.
-   Event date and venue.
-   Registration/check-in count where authorized.
-   A prominent **Scan QR Code** action.
-   Manual registration lookup as a backup.
-   Recent check-ins for the assigned event, if needed for operations.

#### QR code scanning --- primary verification method

The QR scanner is the main entry-verification workflow.

1.  Staff signs in.
2.  Staff selects an assigned event.
3.  Staff opens the QR scanner.
4.  The browser/app requests camera permission.
5.  Staff scans the student's Collexus registration QR code.
6.  The scanner sends the QR token and selected event context to a
    trusted server endpoint.
7.  The server validates the token, event, registration,
    payment/eligibility rules, and current check-in status.
8.  The UI displays a clear result.
9.  For a valid first entry, the server records the check-in atomically
    and returns success.
10. The staff UI displays the result and is ready for the next scan.

#### Information displayed to staff

Show only the minimum details needed to identify the registration:

-   Student name.
-   Student ID / roll number, if collected and needed.
-   College name, if relevant to eligibility.
-   Event name.
-   Registration ID.
-   Registration/eligibility status.
-   Payment status only when payment is required for entry.
-   Entry status: `Not Checked In` or `Checked In`.

Do not expose full personal profiles, passwords, authentication tokens,
unnecessary contact information, or unrelated payment details.

#### Scanner result states

**Valid registration, not yet checked in**

-   Show a clear success/authorized state.
-   Show the minimum student and registration details.
-   Record check-in time, event ID, registration ID, and staff user ID.
-   Show a clear confirmation such as **Entry Approved**.

**Already checked in**

-   Show a clear duplicate/already-used state.
-   Do not create a second check-in.
-   If authorized, show the original check-in time and staff record.
-   Do not silently treat a duplicate scan as a new entry.

**Invalid QR / unknown token**

-   Show **Invalid QR Code**.
-   Do not reveal whether an unrelated user's registration exists.
-   Do not create a check-in.

**Not registered for this event**

-   Show **Not Registered for This Event**.
-   Do not allow entry through the scanner.

**Payment or eligibility issue**

-   Show a concise reason such as **Payment Pending** or **Not
    Eligible** when the server can safely disclose it to assigned staff.
-   Do not let staff override payment or eligibility from the scanner.
-   Refer exceptions to an authorized organizer/admin process.

**Wrong event**

-   If a valid QR token belongs to another event, do not approve entry.
-   Show a generic wrong-event message without exposing unrelated
    registration details.

**Network/server failure**

-   Show **Could Not Verify --- Try Again**.
-   Do not show success or mark the student as checked in.
-   Provide manual lookup only if it uses the same trusted server-side
    validation.
-   Do not create an offline success record that could later conflict
    with another gate.

#### QR code security requirements

-   QR codes must contain an opaque, high-entropy, unguessable token or
    a signed reference---not editable student details, payment
    information, or a predictable database ID.
-   Store only a secure hash of a random token where practical; compare
    hashes server-side.
-   Bind each token to the intended registration and event.
-   Validate token status, registration status, event status, payment
    requirement, and check-in status on the server.
-   Never trust a student-provided event ID or registration status
    without checking it against the database.
-   Do not put Supabase service-role keys, Razorpay secrets, or
    privileged credentials in browser code.
-   Rate-limit verification attempts and log suspicious repeated
    failures.
-   Use HTTPS in production.
-   Consider token expiry/reissue and revocation rules. Reissuing a pass
    must invalidate the previous token where appropriate.
-   QR content must not expose private student data when scanned by an
    ordinary QR reader.

#### Duplicate-entry prevention

The backend/database must enforce one successful check-in per
registration, not just rely on a disabled frontend button.

-   Use a unique constraint on the registration's check-in record, or an
    atomic conditional update/transaction.
-   Two staff members scanning the same QR at nearly the same time must
    not both receive a first-entry success.
-   Return a deterministic response for the losing concurrent request:
    already checked in.
-   Record the successful staff member and timestamp.
-   Never use a client-side-only check to prevent duplicates.

#### Manual backup verification

If camera access is unavailable:

-   Allow staff to search by registration ID, student ID, or another
    approved identifier.
-   Return only registrations belonging to the selected assigned event.
-   Use the same server-side eligibility and duplicate-check logic as QR
    scanning.
-   Do not provide unrestricted student-directory search.

#### Camera and device UX

-   Request camera access only after staff opens the scanner.
-   Prefer the rear camera on supported mobile devices.
-   Explain how to enable camera permission if access is denied.
-   Provide a manual lookup fallback.
-   Support common mobile browsers and test on actual Android devices.
-   Ensure the scanner stops camera capture when the staff leaves the
    scanner screen.
-   Avoid repeated vibration/sound unless enabled and supported by the
    device.

------------------------------------------------------------------------

## 3. Authentication and authorization

### Authentication

Use the authentication provider already configured in the repository.
The intended direction is Supabase Auth, with Google sign-in where
configured. WhatsApp OTP/Twilio Verify has been explored as a possible
signup-verification flow; treat it as a planned integration unless the
current repository and provider configuration confirm it is active.

Requirements:

-   Use the official Supabase client and supported session handling for
    the chosen framework.
-   Protect server-rendered and server-side routes, not only client
    pages.
-   Validate sessions on trusted server boundaries.
-   Sign out cleanly and handle expired sessions.
-   Do not store passwords or OTPs in application tables.
-   Do not log access tokens, refresh tokens, OTPs, or secrets.
-   Do not assume that a verified email automatically grants staff/admin
    privileges.

### Role-based access control (RBAC)

Use explicit roles and assignments. Suggested roles:

-   `student`
-   `admin`
-   `event_organizer`
-   `staff`
-   `stall_operator`

A user may have multiple approved roles if the product requires it.
Prefer role/assignment tables over a single client-editable role field.

Authorization must be checked in:

1.  Server-side route handlers/actions.
2.  Database policies (Supabase RLS).
3.  Storage policies for private files.
4.  Any background jobs or webhook processing.

The frontend may hide unavailable actions for a better experience, but
this is not a security boundary.

### Suggested authorization rules

-   Student: read/update permitted own profile fields; read own
    registrations, payment summaries, tickets, and orders.
-   Admin: platform-level access according to explicit admin
    permissions.
-   Event organizer: manage assigned events and their registrations
    only.
-   Staff: read minimal participant information and perform check-in
    only for assigned events.
-   Stall operator: manage assigned stall and its orders only.

------------------------------------------------------------------------

## 4. Technical stack and architecture

### Preferred direction

The current intended stack is:

-   **Frontend/application:** Next.js with TypeScript.
-   **Database:** Supabase PostgreSQL.
-   **Authentication:** Supabase Auth.
-   **Database access/security:** Supabase RLS plus trusted server-side
    operations.
-   **Payments:** Razorpay for online payments.
-   **Hosting:** Current deployment provider may be Vercel; verify the
    live project configuration before assuming.
-   **External event support:** Store and validate organizer-provided
    external URLs; open them safely.

The repository may have been generated or modified using AI coding
tools. The actual stack may differ from this target. Before changing
architecture, inspect `package.json`, framework configuration, existing
API routes, Supabase clients, database migrations, environment variable
names, and deployment settings.

### Architecture guidelines

-   Keep privileged operations on the server.
-   Use a clear separation between UI, business logic, data access, and
    integrations.
-   Validate all inputs on the server with a schema-validation library
    already used by the project; do not add a second validation system
    without reason.
-   Use typed database/API contracts.
-   Keep secrets in environment variables.
-   Avoid duplicating business rules across pages.
-   Use database transactions or atomic operations for payment state
    transitions and event check-in.
-   Add pagination and server-side filtering for large
    registration/order lists.
-   Avoid fetching the entire student or registration database into the
    browser.
-   Use indexes for frequently filtered fields.
-   Use migrations for schema changes; do not make undocumented
    production schema edits.
-   Do not introduce a second database or ORM unless there is a
    demonstrated need and a migration plan.

------------------------------------------------------------------------

## 5. Suggested data model

This is a logical starting point, not permission to recreate existing
tables. Inspect the current Supabase schema first and map these concepts
to existing tables. Reuse and migrate carefully rather than creating
duplicate sources of truth.

### Core entities

-   `profiles`: user profile linked to the authenticated Supabase user.
-   `user_roles`: approved roles assigned to users.
-   `events`: event details, status, capacity, fee, venue, dates, and
    organizer.
-   `event_organizers`: mapping between users and events they can
    manage.
-   `event_registrations`: student registration for an event and its
    current status.
-   `registration_qr_tokens`: secure token hash and lifecycle for a
    registration pass.
-   `event_checkins`: successful entry record for a registration.
-   `staff_event_assignments`: staff-to-event assignments.
-   `payment_orders`: internal payment/order record linked to a
    registration or food order.
-   `payment_transactions`: provider references and verified transaction
    state.
-   `food_stalls`: stall details and assigned operators.
-   `food_menu_items`: menu items and availability.
-   `food_orders`: student food orders and order status.
-   `food_order_items`: immutable item/price snapshots for each order.
-   `audit_logs`: sensitive administrative and operational actions.

### Data-model rules

-   Use UUIDs or the established project ID strategy consistently.
-   Add foreign keys and appropriate delete/update behavior.
-   Use timestamps (`created_at`, `updated_at`) consistently.
-   Store money as integer minor units (for INR, paise) or use a
    carefully chosen exact numeric type. Never use floating-point
    arithmetic for money.
-   Snapshot item names and prices into order items so later menu edits
    do not change old orders.
-   Keep payment provider IDs unique where appropriate.
-   Use unique constraints to prevent duplicate event registrations
    where the event rules require one registration per student.
-   Use a unique check-in constraint for one successful entry per
    registration.
-   Do not store raw QR tokens, card data, CVV, or OTPs.
-   Avoid duplicating payment status across multiple tables unless the
    synchronization rule is explicit.

### Suggested event registration states

Use a documented state machine, for example:

-   `pending`
-   `confirmed`
-   `cancelled`
-   `rejected`
-   `waitlisted` (only if waitlisting is supported)

A registration should be considered eligible for entry only when the
server-side event rules say it is eligible. For paid events, verified
payment is normally required before confirmation, unless an explicitly
approved comp/free-entry rule applies.

### Suggested check-in data

A check-in record should identify:

-   Event.
-   Registration.
-   Student/user reference.
-   Staff user who performed the check-in.
-   Server-generated timestamp.
-   Method (`qr` or `manual`).
-   Optional operational metadata that does not expose unnecessary
    personal data.

Do not allow a staff client to submit an arbitrary timestamp or staff ID
and have the server trust it. Derive the staff identity from the
authenticated session and timestamp from the server/database.

------------------------------------------------------------------------

## 6. Razorpay payments

Razorpay is the intended payment provider for paid event registrations
and food orders.

### Secure payment flow

1.  Student starts a registration/order.
2.  Server validates the event/order, amount, availability, and student
    eligibility.
3.  Server creates an internal pending payment record.
4.  Server creates a Razorpay order using secret credentials held only
    on the server.
5.  Client opens Razorpay Checkout using the returned public checkout
    details.
6.  Client returns payment identifiers/signature to the server.
7.  Server verifies the Razorpay signature using the secret key.
8.  Server processes verified webhooks and reconciles payment state.
9.  Registration/order is confirmed only after trusted verification
    succeeds.
10. UI displays the final state fetched from the backend.

### Payment safety rules

-   Never trust a client-side "payment successful" redirect as proof of
    payment.
-   Verify signatures server-side.
-   Verify webhook signatures using the raw request body as required by
    Razorpay.
-   Make webhook processing idempotent; the same event may be delivered
    more than once.
-   Store provider order/payment IDs and internal references.
-   Validate amount, currency, and order relationship.
-   Never expose Razorpay secret keys in client bundles or source
    control.
-   Do not store card numbers, CVV, UPI PINs, or other sensitive payment
    credentials.
-   Handle pending, failed, captured, refunded, and disputed states
    deliberately.
-   Do not mark an event registration as paid based only on a client
    callback.
-   Provide a reconciliation path for delayed webhooks and interrupted
    checkout sessions.

### Food-order payments

Use the same trusted payment principles as event registrations. The food
order must retain a clear relationship to its payment record and
item-price snapshots. Stall operators may see the payment state needed
to fulfill an order but must not alter it.

------------------------------------------------------------------------

## 7. External event links

Some events may be hosted and registered on external platforms.

-   Store the external registration URL on the event record.
-   Clearly label the action, for example **Register on External
    Website**.
-   Validate that the URL uses HTTPS unless a documented exception is
    approved.
-   Do not silently redirect users to an untrusted or unexpected domain.
-   Open external links safely and make it clear that
    registration/payment is handled outside Collexus.
-   Do not claim an external registration is confirmed unless the
    external provider has supplied a trusted confirmation mechanism.
-   Keep Collexus internal registration and external-link workflows
    distinct.

------------------------------------------------------------------------

## 8. Food ordering module

The food module is part of Collexus and should work well on mobile.

### Student flow

1.  Browse available stalls.
2.  Open a stall and view its menu.
3.  Add available items to a cart.
4.  Review quantities, prices, and total.
5.  Place the order.
6.  Complete payment if required.
7.  View order status and pickup information.
8.  Collect the order using the defined handover process.

### Stall flow

-   Manage permitted menu items and availability.
-   Receive orders for that stall only.
-   Update order progress.
-   Mark orders ready and completed.
-   Avoid access to unrelated student data or other stalls.

### Order safety

-   Calculate totals on the server from trusted menu prices.
-   Do not accept a client-supplied total as authoritative.
-   Store a snapshot of each purchased item's name, quantity, and unit
    price.
-   Prevent ordering unavailable items.
-   Define cancellation/refund rules before enabling those actions.
-   Use idempotency or duplicate-submission protection when placing
    orders.

------------------------------------------------------------------------

## 9. UI/UX standards

Collexus should feel like one coherent, professional product across all
five panels.

### Visual and interaction standards

-   Modern, clean, technology-oriented visual identity.
-   Consistent colors, typography, spacing, buttons, forms, cards, and
    navigation.
-   Responsive layouts for mobile, tablet, and desktop.
-   Clear navigation and panel identity.
-   Avoid unnecessary animation, heavy effects, and layout shifts.
-   Use skeleton/loading states for data fetching.
-   Provide empty states, success states, error states, and confirmation
    before destructive actions.
-   Use clear, concise messages rather than technical database errors.
-   Make forms accessible with labels and validation messages.
-   Maintain sufficient contrast and visible focus states.
-   Keep the staff scanner screen especially minimal: event context,
    camera view, scan result, and manual fallback.

### Performance

-   Optimize and appropriately size images.
-   Lazy-load non-critical content.
-   Paginate large lists.
-   Avoid repeated database calls and unnecessary client re-renders.
-   Use caching only where it cannot expose one user's private data to
    another.
-   Keep event-day check-in requests small and fast.
-   Show a clear retry state for transient network failures.

------------------------------------------------------------------------

## 10. Privacy, security, and audit

-   Apply least-privilege access to every role.
-   Enable and test RLS on all tables exposed through Supabase APIs.
-   Write policies using authenticated user identity and trusted
    role/assignment records.
-   Do not use user-editable metadata as the sole authority for
    admin/staff roles.
-   Keep service-role keys and provider secrets server-side only.
-   Validate and sanitize user input.
-   Protect privileged endpoints against unauthorized access and abuse.
-   Add rate limits to authentication, QR verification, and sensitive
    endpoints where supported.
-   Avoid exposing stack traces, SQL errors, internal IDs, or secrets to
    users.
-   Keep audit records for role changes, staff assignments, check-ins,
    payment-state changes, refunds, and sensitive admin actions.
-   Define data retention and deletion practices appropriate to the
    institution and applicable law.
-   Collect only the personal information the feature genuinely needs.

### Staff-specific privacy

Staff should see only event-specific information required to verify
entry. Do not show personal phone numbers, email addresses, home
addresses, full profiles, or unrelated payment information by default.

------------------------------------------------------------------------

## 11. Notifications and support

Potential notification channels include email and WhatsApp, depending on
provider setup, consent, and budget.

-   Send registration confirmation only after the trusted registration
    state is confirmed.
-   Include event details and a secure ticket/QR access link where
    appropriate.
-   Send food-order updates only when useful and supported.
-   Do not put sensitive personal or payment information in notification
    content.
-   Use provider-approved templates and comply with applicable messaging
    rules.
-   Keep provider credentials server-side.
-   Provide a support email or platform help channel rather than
    exposing a personal phone number.

Treat WhatsApp OTP/Twilio Verify and automated reminders as integrations
that must be verified in the actual project before describing them as
live.

------------------------------------------------------------------------

## 12. Analytics and reporting

Use analytics to understand product usage without collecting unnecessary
personal data.

Useful aggregate metrics:

-   Event views and registrations.
-   Registration conversion rate.
-   Paid versus free registrations.
-   Payment success/failure/pending counts.
-   Event check-in totals and check-in rate.
-   Food orders and fulfillment times.
-   Active stalls and menu availability.
-   Operational errors and endpoint performance.

Use Google Analytics or another approved analytics tool only after
configuring consent/privacy requirements and excluding secrets, payment
credentials, OTPs, and unnecessary personal data. Do not send student
IDs, emails, phone numbers, QR tokens, or payment identifiers as
analytics event parameters.

------------------------------------------------------------------------

## 13. Testing and quality assurance

Before releasing a feature, test its normal flow, failure flow,
permissions, and mobile experience.

### Essential test scenarios

**Authentication and roles** - Unauthenticated user cannot access
protected panels. - Student cannot access admin, event, staff, or stall
routes without permission. - Staff cannot access an unassigned event. -
Revoked staff assignment stops access. - User cannot grant themselves a
privileged role.

**Event registration** - Valid free registration. - Valid paid
registration. - Duplicate registration attempt. - Full event/capacity
reached. - Registration deadline passed. - Payment pending, failed, and
verified. - External event link behavior.

**QR check-in** - Valid QR for assigned event. - Invalid or altered
QR. - QR for another event. - Payment pending for a paid event. -
Already checked-in registration. - Two staff scanning the same QR
simultaneously. - Camera permission denied. - Camera unavailable. -
Network failure during verification. - Manual lookup fallback. - Staff
assignment revoked while session is active.

**Food ordering** - Available and unavailable items. - Price changed
after item was added to cart. - Duplicate order submission. - Payment
success/failure/pending. - Stall operator access isolation. - Order
status transitions.

**Payments** - Invalid signature. - Duplicate webhook. - Delayed
webhook. - Amount mismatch. - Wrong currency. - Checkout closed before
completion. - Refund or cancellation flow, if enabled.

### Release checklist

-   Type checks and linting pass.
-   Production build succeeds.
-   Database migrations are reviewed and applied safely.
-   RLS policies are tested using different roles.
-   Secrets are configured in the deployment environment.
-   No secrets are committed to Git.
-   Mobile and desktop layouts are checked.
-   Critical payment and check-in flows are tested end to end.
-   Error monitoring and backup/recovery procedures are understood.

------------------------------------------------------------------------

## 14. Deployment and scalability

The exact hosting and plan limits must be checked against the current
provider dashboard. Do not promise a particular number of concurrent
users or requests without load testing.

### Deployment practices

-   Keep separate development, staging, and production environments
    where practical.
-   Use separate environment variables and credentials for each
    environment.
-   Apply database migrations in a controlled sequence.
-   Restrict production database access.
-   Configure HTTPS and approved domains.
-   Configure webhook URLs and verify them after deployment.
-   Monitor application errors, database usage, bandwidth, and provider
    limits.
-   Back up important data and test restoration procedures.
-   Avoid storing uploaded user files in ephemeral application storage;
    use managed object storage with appropriate access policies.

### Scalability practices

-   Add indexes based on actual query patterns.
-   Paginate event registrations, orders, and admin lists.
-   Use server-side search and filtering.
-   Keep check-in writes atomic and minimal.
-   Avoid N+1 queries and unnecessary joins.
-   Use background processing for non-critical notification/report tasks
    when volume justifies it.
-   Load test event registration and check-in before large events.
-   Review Supabase, hosting, and payment-provider limits as usage
    grows.

------------------------------------------------------------------------

## 15. Development workflow for AI coding agents

Any AI coding agent (including Claude Code or similar tools) must follow
these rules.

### Before editing

1.  Read this document.
2.  Inspect the repository structure and current implementation.
3.  Identify the actual framework, package manager, scripts, database
    client, and existing conventions.
4.  Inspect relevant pages, components, server routes, migrations, and
    RLS policies.
5.  Identify the smallest safe change that meets the request.
6.  Ask for clarification if a requirement affects payments,
    permissions, data deletion, or a destructive migration and cannot be
    safely inferred.

### While editing

-   Preserve existing working behavior.
-   Do not rewrite unrelated modules.
-   Do not invent environment variable names or claim an integration is
    configured without checking.
-   Do not expose secrets or privileged keys.
-   Do not bypass RLS to make a feature work.
-   Do not trust client-supplied roles, prices, payment statuses, QR
    data, or staff IDs.
-   Reuse existing components, utilities, styles, and validation
    patterns.
-   Keep code readable and modular.
-   Add or update tests for changed business logic.
-   Add migrations for schema changes and explain their impact.
-   Keep accessibility and responsive behavior intact.

### After editing

-   Summarize files changed and why.
-   List migrations and environment variables required.
-   Run relevant tests, lint, type-check, and build commands that exist
    in the repository.
-   Report commands that could not be run and why.
-   Identify any manual dashboard/provider setup still required.
-   Never claim tests passed if they were not run.
-   Never claim a payment, deployment, migration, or integration
    succeeded without evidence.

------------------------------------------------------------------------

## 16. Suggested implementation priorities

These are recommended priorities, not a claim that the features are
currently missing. Check the repository and mark existing functionality
as complete before implementing.

### Priority 1 --- Core platform reliability

-   Confirm authentication and role model.
-   Confirm student, admin, event, and stall access boundaries.
-   Review Supabase RLS and server-side authorization.
-   Confirm event registration and payment verification.

### Priority 2 --- Staff event-entry workflow

-   Staff role and event assignment.
-   Staff panel with assigned events.
-   Secure QR token generation and display for eligible registrations.
-   Camera-based QR scanner.
-   Server-side verification endpoint.
-   Atomic duplicate prevention and check-in audit record.
-   Manual registration lookup fallback.
-   Test simultaneous scans and network failures.

### Priority 3 --- Food ordering reliability

-   Stall-scoped access.
-   Server-calculated totals and item snapshots.
-   Payment verification and order state transitions.
-   Student order tracking.

### Priority 4 --- Notifications, analytics, and reporting

-   Confirmed-registration notifications.
-   Operational reports.
-   Privacy-aware analytics.
-   Monitoring and support workflows.

### Priority 5 --- Multi-college expansion

-   Institution/organization model.
-   Organizer onboarding and verification.
-   Institution-scoped events and permissions.
-   Platform-level moderation and reporting.
-   Load testing and operational readiness.

------------------------------------------------------------------------

## 17. Definition of done

A feature is complete only when:

-   Its user flow works on supported devices.
-   Server-side authorization and database RLS are in place.
-   Inputs and state transitions are validated.
-   Loading, empty, success, and failure states are handled.
-   Relevant tests pass or unrun tests are clearly reported.
-   No secrets or sensitive data are exposed.
-   Existing functionality remains intact.
-   Documentation and required setup steps are updated.

For the Staff Panel specifically, the feature is not complete until a
staff member assigned to an event can scan a valid QR code, receive a
trusted server-side decision, record one check-in only, see a clear
duplicate/invalid/payment-pending result, and use manual lookup when
camera scanning is unavailable.

------------------------------------------------------------------------

## 18. Important project notes

-   This document describes the intended product and technical
    direction; it is not proof that every listed integration or module
    is already implemented.
-   The current repository and Supabase project are the source of truth
    for what exists today.
-   Confirm the exact deployed stack, database schema, payment
    configuration, authentication providers, and hosting plan before
    making production changes.
-   Keep this document updated whenever a major architectural or
    workflow decision changes.

**End of Collexus RTD specification.**
