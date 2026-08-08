# Striperia CRM Contract System Log and SOP

Last updated: 2026-08-08

This document is a memory log and operating procedure for the Striperia CRM / website contract work. It is intentionally written without passwords, access tokens, private keys, or API secrets.

## Current production surfaces

- Public website: `https://www.striperiapartners.com/`
- Admin CRM: `https://www.striperiapartners.com/admin`
- Client signing route: `https://www.striperiapartners.com/sign/?token=<token>`
- Supabase project ref: `euqpbdbgufshpyjzdsgu`
- GitHub repo: `Sambo-Cyber27/Striperia-Partners-Aug`

## What was built

### CRM access

- Restored `/admin` as the real CRM route.
- Removed the temporary local password-gate login that was used while replacing the old Lovable/Supabase-auth scaffold.
- Reconnected the CRM to the fresh Supabase project.
- Created/verified the admin auth user and granted the `admin` role.
- Verified the admin dashboard opens with the real CRM sections:
  - Opener
  - Closer
  - Follow-ups
  - Messages
  - Archive
  - Reports
  - Contracts
  - Inbox
  - Ads
  - Meta
  - Users
  - Settings

### Fresh Supabase backend

The fresh Supabase project was wired for the CRM instead of the old Lovable/Supabase project.

Implemented/restored:

- Auth admin access
- CRM tables and RLS policies
- Leads
- Contact messages
- Notes/activities
- Follow-up tasks
- Telnyx tables/functions
- Transactional email infrastructure
- Contract tables
- Contract templates
- Contract events
- Contract signatures
- Contract PDF storage
- Email logs
- Edge Functions

Important behavior:

- Admin users can view/manage CRM data.
- Public users can submit leads/contact messages.
- Contract signing links are tokenized and public-facing.
- Contract PDF files are stored in the private `contracts` Supabase storage bucket.
- `contract-sign` now auto-creates the private `contracts` bucket if it is missing.

### Supabase Edge Functions deployed

Deployed functions include:

- `admin-users`
- `contract-send`
- `contract-resend`
- `contract-view`
- `contract-sign`
- `contract-download`
- `contract-pixel`
- `send-transactional-email`
- `handle-email-unsubscribe`
- `handle-email-suppression`
- `meta-ads-api`
- `meta-webhook`
- `notify-disposition`
- `preview-transactional-email`
- `process-email-queue`
- `sheets-webhook`
- `telnyx-call-bridge`
- `telnyx-call-webhook`
- `telnyx-send-sms`
- `telnyx-sms-webhook`
- `telnyx-webrtc-token`

### Email sender change

Replaced the old Supabase/Lovable email queue path for transactional emails.

Current outbound email path:

```text
Supabase Edge Function -> send-transactional-email -> Resend API -> recipient inbox
```

Current sender identity:

```text
From: Striperia Partners <omar@striperiapartners.com>
Reply-To: omar@striperiapartners.com
```

Important notes:

- Resend is used for outgoing transactional emails.
- Receiving inboxes are separate from Resend.
- If `omar@striperiapartners.com`, `support@striperiapartners.com`, or `contracts@striperiapartners.com` need to receive mail, configure mailbox/email routing through Spaceship, Google Workspace, Cloudflare Email Routing, or another inbound mail provider.
- Resend DNS records must stay verified for best deliverability.

### Contract email flow

Admin contract send flow:

```text
Admin clicks Send contract -> contract-send function creates contract -> contract invite email is sent -> client clicks signing link -> sign page loads -> client fills fields/signs -> contract-sign creates signed PDF -> signed PDF email is sent -> CRM status updates
```

Client receives a branded email with:

- Contract name
- Secure signing URL
- Steps: review terms, fill details, sign and receive copy
- Fallback link
- Tracking pixel for opened status

### Public sign route

Problem solved:

- `/sign/<token>` produced 404 on the static Vercel deployment.

Current solution:

- Emails now send query-string links:

```text
https://www.striperiapartners.com/sign/?token=<token>
```

- The React route supports both:

```text
/sign
/sign/:token
```

- `Sign.tsx` reads token from either the path param or `?token=`.

### Signing page behavior

Client signing page now:

- Loads contract by token through `contract-view`.
- Shows the agreement body with merged client fields.
- Lets the client enter/confirm:
  - full name
  - country/residence
  - effective date
  - typed signer name
  - drawn signature
  - ESIGN/UETA consent checkbox
- Submits to `contract-sign`.
- Shows success state.
- Sends signed PDF email.
- Offers download when the download URL is available.

### Signed PDF branding/certificate upgrade

The original PDF was plain. It was upgraded to a premium branded signed agreement package.

Current signed PDF includes:

- Branded Striperia cover page
- Navy/electric-blue visual system
- `SIGNED AGREEMENT` heading
- Signer card
- Completion status card
- Signed timestamp card
- Contract ID card
- Security summary
- Company identity:
  - `REDG OB, LLC d/b/a Striperia`
  - `113 W 6th Ave, North Wildwood, NJ 08260, United States`
- Agreement body pages with branded header/footer
- Execution and signatures page
- Client signature block
- Company acknowledgment block
- Certificate of Completion page
- IP/device evidence
- ESIGN/UETA consent statement
- Contract audit trail
- Content SHA-256
- Client signature SHA-256
- Final PDF SHA-256 stored on the contract record

Removed unprofessional wording from the company block:

```text
Company party details are pre-filled in the agreement template.
```

Current wording:

```text
Agreement executed on behalf of REDG OB, LLC d/b/a Striperia.
Authorized representative: Omar (Striperia)
Company record sealed.
```

### Contract sending from a lead

Inside a lead drawer, the Contracts panel supports:

- Button: `Send contract to prospect`
- Dialog fields:
  - Prospect email
  - Prospect full name
- Required validation:
  - Prospect email required
  - Prospect name required
- Sends `striperia-daily-payout` template
- Prefills:
  - `client_full_name`
  - `client_country` from lead country, when available
  - `effective_date` as today's date
- Tracks sent/opened/viewed/signed status in the same lead panel

### Contract sending from Contracts tab

Added a global Contracts-tab sender so a contract can be sent without first opening a lead.

Location:

```text
Admin -> Contracts -> Send contract to prospect
```

Dialog fields:

- Prospect email
- Prospect full name

Behavior:

- Creates a contract with `lead_id: null`.
- Sends the Daily Payout Agreement directly to the prospect.
- Prefills:
  - `client_full_name`
  - `effective_date`
- New contract appears in the Contracts table.
- Status is tracked with the rest of the contracts.

### Website deploy model

The live website is served from the Vercel-connected repo clone:

```text
/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate
```

The editable source project is:

```text
/Users/kabo/Downloads/striperia-crm
```

Frontend deployment process used:

1. Edit source in `/Users/kabo/Downloads/striperia-crm`.
2. Run:

```bash
npm run build
```

3. Copy `dist/` into `/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate`.
4. Preserve static route folders:
   - `/admin/`
   - `/sign/`
   - `/contact/`
   - `/how-it-works/`
   - `/privacy/`
   - `/terms/`
   - `/mobile/`
5. Commit and push to GitHub main only when a live deployment is intended.

Important: this document was intentionally published on a docs branch with `[skip ci]`, not to production/main.

## Key source files

Frontend:

- `src/pages/Admin.tsx`
- `src/pages/Sign.tsx`
- `src/components/crm/ContractsTab.tsx`
- `src/components/crm/LeadContractsPanel.tsx`
- `src/components/crm/LeadDrawer.tsx`
- `src/integrations/supabase/client.ts`

Contract Edge Functions:

- `supabase/functions/contract-send/index.ts`
- `supabase/functions/contract-resend/index.ts`
- `supabase/functions/contract-view/index.ts`
- `supabase/functions/contract-sign/index.ts`
- `supabase/functions/contract-download/index.ts`
- `supabase/functions/contract-pixel/index.ts`
- `supabase/functions/_shared/contracts.ts`

Email Edge Functions/Templates:

- `supabase/functions/send-transactional-email/index.ts`
- `supabase/functions/_shared/transactional-email-templates/contract-invite.tsx`
- `supabase/functions/_shared/transactional-email-templates/contract-signed-client.tsx`
- `supabase/functions/_shared/transactional-email-templates/contract-signed-admin.tsx`
- `supabase/functions/_shared/transactional-email-templates/contract-sent-admin.tsx`
- `supabase/functions/_shared/transactional-email-templates/registry.ts`

Deployment/static site:

- `/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate/index.html`
- `/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate/assets/*`
- `/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate/admin/index.html`
- `/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate/sign/index.html`
- `/Users/kabo/cloning LPs/LPs/striperia-vercel-duplicate/vercel.json`

## Verification already performed

Admin/auth:

- Live `/admin` opened.
- Logged in as admin.
- Old Supabase/Lovable auth screen was removed from the deployed bundle.
- Admin dashboard showed live CRM sections.

Contracts:

- Contract send function returned status `200`.
- Real contract invite email was sent through Resend.
- Sign route loaded with `?token=`.
- `contract-sign` returned status `200` for smoke contracts.
- Signed PDFs downloaded correctly.
- Generated PDF files were verified as valid PDFs:
  - Header: `%PDF-`
  - EOF marker present
  - Content-Type: `application/pdf`

PDF:

- Branded PDF text inspection confirmed:
  - signed agreement cover
  - company identity
  - signer info
  - execution page
  - certificate of completion
  - audit trail
  - integrity evidence

Frontend:

- `npm run build` passed after UI changes.
- Live bundle contained:
  - `Send contract to prospect`
  - `Prospect name required`
  - Contracts tab prospect sender copy
- Browser smoke confirmed:
  - Admin Contracts tab loads.
  - `Send contract to prospect` button is visible.
  - Dialog opens.
  - Prospect email/name inputs are visible.
  - Send button is visible.

## SOP: changing this framework to another website/client

Use this procedure when cloning or adapting the system for another brand/site.

### 1. Define target brand and domains

Collect:

- Public domain
- Admin route preference
- Legal business name
- DBA/trade name
- Mailing address
- Support/contact email
- Contract sender email
- Reply-to email
- Logo/brand assets
- Primary color palette
- Target contract template
- Required prospect fields
- Required admin users

Never hard-code secrets in source. Use environment variables or Supabase secrets.

### 2. Clone/source setup

1. Clone or open the source project.
2. Install dependencies.
3. Confirm local build:

```bash
npm install
npm run build
```

4. Confirm source routes:

```text
/
/admin
/sign
/sign/:token
/contact
/privacy
/terms
```

5. If static Vercel hosting is used, make sure every SPA route has an `index.html` fallback folder.

### 3. Supabase setup

1. Create or select a Supabase project.
2. Apply all migrations.
3. Confirm tables exist:
   - leads
   - contact_messages
   - crm_users or equivalent admin table
   - user_roles
   - contracts
   - contract_templates
   - contract_events
   - contract_signatures
   - email_send_log
4. Create/verify storage bucket:

```text
contracts
private
```

5. Add admin user.
6. Grant admin role.
7. Set frontend env:

```text
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

8. Set Supabase Edge Function secrets:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
ADMIN_NOTIFY_EMAIL
```

Add Telnyx/Meta/Google/other secrets only if those integrations are required.

### 4. Deploy Edge Functions

Deploy all functions needed by the selected feature set.

Minimum for contracts:

```bash
npx supabase functions deploy contract-send contract-resend contract-view contract-sign contract-download contract-pixel send-transactional-email --project-ref <PROJECT_REF> --use-api
```

Then verify:

```bash
npx supabase functions list --project-ref <PROJECT_REF>
```

### 5. Configure email sending

1. In Resend, verify the sending domain or subdomain.
2. Add required DNS records:
   - SPF
   - DKIM
   - Return-Path
   - DMARC if needed
3. Choose sending identity:

```text
From: Brand Name <sender@domain.com>
Reply-To: owner/support email
```

4. Add the Resend API key as a Supabase secret.
5. Send one test email through `send-transactional-email`.
6. Check inbox and spam.
7. Check `email_send_log`.

### 6. Configure receiving email separately

Resend sends transactional emails. It does not host inboxes.

For inbound/replies, configure one:

- Google Workspace
- Cloudflare Email Routing
- Spaceship email
- another mailbox provider

Recommended role addresses:

```text
support@domain.com
contracts@domain.com
no-reply@domain.com or sender@domain.com
```

For contract emails:

```text
From: Brand Contracts <contracts@domain.com>
Reply-To: owner/support@domain.com
```

### 7. Replace brand/legal contract values

Search and replace brand-specific values in:

- `contract-sign/index.ts`
- contract templates/migrations
- transactional email templates
- website header/footer/legal pages
- PDF branding text

Update:

- Business legal name
- DBA/trade name
- address
- authorized representative
- support email
- admin URL
- public origin URL
- sign route origin
- logo/brand mark
- PDF colors

### 8. Update contract template

Contract template must include placeholders for client-specific fields, for example:

```text
{{client_full_name}}
{{client_country}}
{{effective_date}}
{{client_signer_name}}
{{client_signed_date}}
{{company_signer_name}}
{{company_signed_date}}
```

Update the template field schema so the sign page renders the correct fields.

Minimum field set:

```json
[
  { "key": "client_full_name", "label": "Your full name", "type": "text", "required": true },
  { "key": "client_country", "label": "Country of residence", "type": "text", "required": true },
  { "key": "effective_date", "label": "Effective date", "type": "date", "required": true },
  { "key": "client_signer_name", "label": "Type your full name to sign", "type": "text", "required": true }
]
```

### 9. Update public sign route

Use query-token links for static hosting reliability:

```text
https://domain.com/sign/?token=<token>
```

Confirm frontend supports both:

```text
/sign
/sign/:token
```

In `Sign.tsx`, token resolution should check:

```text
params.token
URLSearchParams(window.location.search).get("token")
```

### 10. Update CRM contract send UI

Keep two send entry points:

1. Lead drawer:

```text
Lead -> Contracts & E-Signature -> Send contract to prospect
```

2. Global contracts tab:

```text
Admin -> Contracts -> Send contract to prospect
```

Both should require:

- prospect email
- prospect full name

Lead drawer should attach `lead_id`.

Global Contracts tab should send with:

```text
lead_id: null
```

### 11. Build and deploy frontend

For the Striperia static deployment model:

```bash
npm run build
```

Copy `dist/` into the Vercel static repo clone.

Create route folders with index fallbacks:

```text
admin/index.html
sign/index.html
contact/index.html
how-it-works/index.html
privacy/index.html
terms/index.html
mobile/index.html
```

Commit and push to production main only when deployment is desired.

### 12. Smoke-test before handing off

Minimum smoke test:

1. Open live site.
2. Open `/admin`.
3. Log in as admin.
4. Open Contracts tab.
5. Confirm `Send contract to prospect` button exists.
6. Open dialog.
7. Confirm email/name fields exist.
8. Send a test contract to an internal email.
9. Open email.
10. Click sign link.
11. Confirm `/sign/?token=` loads.
12. Fill fields.
13. Draw signature.
14. Accept consent.
15. Sign.
16. Download PDF.
17. Verify PDF:
    - header `%PDF-`
    - valid EOF
    - branded cover
    - execution page
    - certificate page
18. Confirm CRM status changed to signed.
19. Confirm signed PDF email was sent.

### 13. Common failure modes

#### Sign link 404

Cause:

- Static route does not support `/sign/<token>`.

Fix:

- Use query token link:

```text
/sign/?token=<token>
```

- Ensure `/sign/index.html` exists.

#### Contract signs but no PDF downloads

Cause:

- Missing `contracts` storage bucket or upload errors ignored.

Fix:

- Ensure private bucket exists.
- `contract-sign` should create bucket idempotently.
- Check upload errors and throw if upload fails.

#### Emails do not arrive

Check:

- Resend API key in Supabase secrets
- Verified sender domain
- SPF/DKIM/Return-Path DNS
- Spam/promotions folder
- `email_send_log`
- Resend dashboard events

#### Admin opens but no CRM data

Check:

- Correct `VITE_SUPABASE_URL`
- Correct `VITE_SUPABASE_PUBLISHABLE_KEY`
- Admin user exists in Supabase Auth
- User has `admin` role
- Migrations applied to the correct project

#### Old Lovable/Supabase references return

Search deployed bundle/source for:

```text
lovable
supabase.auth old project ref
old VITE_SUPABASE_URL
```

Rebuild and redeploy from fresh source.

## Fast execution checklist for next migration

Use this condensed checklist when moving to a new website/client.

1. Gather brand/legal/email/domain details.
2. Create fresh Supabase project.
3. Apply migrations.
4. Create admin user and admin role.
5. Add Supabase secrets.
6. Configure Resend sender domain.
7. Update source env to new Supabase project.
8. Replace legal/company values in contract templates and PDF builder.
9. Replace public origin/admin URL/sign URL in functions.
10. Deploy contract and email Edge Functions.
11. Build frontend.
12. Deploy static route folders.
13. Smoke admin login.
14. Smoke contract send.
15. Smoke signing page.
16. Smoke PDF download.
17. Verify CRM status tracking.
18. Only then send real client/prospect contracts.

## Last known good checks

- Live admin loaded and showed Contracts tab.
- Global Contracts tab displayed `Send contract to prospect`.
- Dialog opened with prospect email and full name fields.
- Contract signing function generated branded PDFs.
- PDF download worked.
- The `contracts` bucket auto-create guard worked.
- Resend email path worked with sender `Striperia Partners <omar@striperiapartners.com>`.
