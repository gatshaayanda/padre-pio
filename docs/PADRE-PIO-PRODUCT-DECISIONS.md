# Padre Pio Digital Reception — Product and Research Decisions

Updated: 14 October 2026

## Product direction

The primary job is to help a patient recognise the real location, understand the next step, request an appointment, and know that reception still needs to confirm it. The entrance video is a recognition cue, not the entire visual identity. The page therefore pairs the real entrance film with a custom illustrated fallback and a short three-step explanation.

The primary CTA is “Request an appointment”. Call and directions are secondary actions. No WhatsApp button is shown because a clinic-controlled WhatsApp number was not verified. The appointment form collects name, phone, preferred date/time, a broad appointment category, consent, and a short optional note. It explicitly discourages medical history and does not promise live availability.

## External UX references reviewed

- Middle Star Clinic — https://www.middlestarclinic.com/ and https://www.middlestarclinic.com/book-a-session. Its public site presents a prominent consultation action, appointment pathways, contact information, service categories, and a short booking journey. The site pages show inconsistent published hours, so those details were not copied. The reusable lesson is to make the next action obvious and keep the journey clear; Padre Pio must publish only clinic-approved services, hours, and credentials.
- Circle Point Medical — https://circlepointmedical.com/. The Gaborone practice publishes clear service groupings and an appointment request form with name, phone, email, service, preferred date/time, and notes; it says staff will get back to confirm. That supports our explicit “request received, not confirmed” pattern. Padre Pio’s first version intentionally collects less data because its approved service catalogue and email workflow are not yet verified.
- Storkfort Health — https://sh.co.bw/book-for-medicals/. This is a broader occupational-health reference rather than a direct general-practice match. Its booking form asks for company and workforce details, which illustrates why forms should be tailored to the actual patient journey instead of copied from another provider.
- Local Botswana directory — https://www.localbotswana.com/category/Shopping_centres/2/city:Gaborone. The listing associates Padre Pio Medical Centre with Plot 16739, Gaborone West Phase 1, and +267 316 4811. This is a third-party directory, not a clinic-controlled source; the visible name is even misspelled as “Padre Pi0”. The number is therefore a provisional lead and must be confirmed directly before public launch.
- Earlier public healthcare directory results also list the same plot and phone, but are old. Repetition across directories improves confidence that this is a useful lead; it does not establish current ownership, hours, or service availability.

## Identity and visual decisions

No verified official logo or clinic-controlled website was identified in the sources reviewed. The current UI uses a replaceable text wordmark and a custom geometric medical mark, not a claim to reproduce the clinic’s official logo. The illustration assets are purpose-made SVGs with a warm ivory, deep green, and clay palette; they are not generic medical stock photos.

## Data and workflow decisions

- Appointment requests are stored server-side and acknowledged with a reference. They are not confirmed bookings.
- Staff access requires Firebase Authentication plus a server-verified role document in admins/{uid}.
- Status transitions and internal notes are written with an audit event.
- Browser Firestore and Storage access are default-deny; the server Admin SDK bypasses those client rules.
- No patient history, diagnosis, medication, test result, or file upload is part of this product.
- Privacy copy is a draft. The clinic must approve the lawful basis/consent wording, retention period, privacy contact, access/correction/deletion process, and operational response before launch.

## Still requiring clinic confirmation

1. Phone number and reception contact channels.
2. Official clinic name styling, logo/signage assets, and any approved brand colours.
3. Official services and broad appointment categories.
4. Opening hours, walk-in policy, and who handles appointment requests.
5. The patient follow-up method and service-level expectations.
6. Privacy contact, retention/deletion policy, and the clinic’s review of applicable Botswana data-protection requirements.
7. Canonical domain and authorized staff accounts.

## Evidence boundaries

Source and repository checks do not prove the Firebase project is configured, rules are deployed, requests persist in a live environment, staff permissions are correct in a live project, or PWA installation/offline behavior works on physical devices. No Vercel deployment or Firebase rules deployment has been performed.
