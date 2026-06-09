 What Is Broken Today

  The current failure is not that guest creation fails. The guest is being created successfully.

  The failure happens because the client is reading the createGuestSubject* response incorrectly.

  The guest creation endpoints do not return the created subject as the top-level response object. They return an envelope shaped like:

  {
    "success": true,
    "guestSubject": {
      "firstName": "...",
      "lastName": "...",
      "gender": "...",
      "dateOfBirth": "...",
      "placeOfBirth": "...",
      "time": "..."
    },
    "userId": "<new guest subject id>",
    "birthChart": { ... },
    "overview": "...",
    "romanticProfileBlurb": "...",
    "referencedCodes": [],
    "overviewMode": "romantic",
    "status": "guest_created_with_overview",
    "creditsDeducted": 5
  }

  The new guest subject id is in response.userId.

  It is not in:

  - response._id
  - response.guestSubject._id

  So if the client tries to read _id directly from the response, it will get undefined, and then step 2 fails because userIdB becomes undefined.

  What The Client Should Do

  The client should implement this exact 3-phase flow.

  Phase 1: Create The Guest Subject

  Do not use the classic guest endpoints for the relationship app preview flow.

  Use:

  - POST /createGuestSubjectRomantic
  - POST /createGuestSubjectUnknownTimeRomantic

  These are the correct endpoints because they return the guest plus the immediate romantic assets needed for the first reveal.

  Known birth time

  POST /createGuestSubjectRomantic

  Payload:

  {
    "firstName": "...",
    "lastName": "...",
    "gender": "female|male|other",
    "placeOfBirth": "...",
    "dateOfBirth": "YYYY-MM-DD",
    "time": "HH:MM",
    "lat": <number>,
    "lon": <number>,
    "tzone": <number>,
    "ownerUserId": "<self._id>",
    "appDomain": "relationshipApp",
    "clientProduct": "relationshipApp"
  }

  Unknown birth time

  POST /createGuestSubjectUnknownTimeRomantic

  Payload:

  {
    "firstName": "...",
    "lastName": "...",
    "gender": "female|male|other",
    "placeOfBirth": "...",
    "dateOfBirth": "YYYY-MM-DD",
    "lat": <number>,
    "lon": <number>,
    "tzone": <number>,
    "ownerUserId": "<self._id>",
    "appDomain": "relationshipApp",
    "clientProduct": "relationshipApp"
  }

  Authentication and headers should stay exactly as they are now:

  - Firebase ID token
  - x-app-domain: relationshipApp

  Important response handling

  The client must normalize the guest-create response into a real subject object before doing anything else.

  Expected response shape:

  {
    "success": true,
    "guestSubject": { ... },
    "userId": "NEW_GUEST_ID",
    "birthChart": { ... },
    "overview": "romantic summary text",
    "romanticProfileBlurb": "short romantic blurb",
    "referencedCodes": [...],
    "overviewMode": "romantic",
    "status": "guest_created_with_overview"
  }

  The client must derive the partner subject like this:

  const result = await createGuestSubjectRomantic(...);

  const partner = {
    _id: result.userId,
    ...result.guestSubject,
  };

  Do not assume:

  - result._id
  - result.id
  - result.guestSubject._id

  Those are not the contract.

  The client should store all of these from phase 1

  - partner._id from result.userId
  - partner as normalized subject data
  - birthChart from result.birthChart if needed
  - overview from result.overview
  - romanticProfileBlurb from result.romanticProfileBlurb
  - referencedCodes if needed
  - status

  This gives the UI the first staged reveal:

  - partner identity card
  - partner romantic summary
  - partner romantic blurb

  Phase 2: Create The Relationship Preview

  After phase 1 succeeds and only after the client has a valid partner._id, call:

  POST /enhanced-relationship-analysis

  Payload:

  {
    "userIdA": "<selfProfile.id>",
    "userIdB": "<partner._id>",
    "ownerUserId": "<selfProfile.id>",
    "celebRelationship": false
  }

  For celebrity flow:

  - skip phase 1
  - use the existing celebrity subject id as userIdB
  - set celebRelationship: true only when appropriate

  Expected response from relationship preview

  This returns the immediate relationship preview payload, including:

  - compositeChartId
  - clusters
  - overall
  - scoredItems
  - initialOverview
  - tensionFlowAnalysis
  - synastryAspects
  - compositeChart
  - status

  The client should store at minimum:

  - compositeChartId
  - preview analysis payload
  - initialOverview
  - score blocks needed for the preview screen

  This is the second staged reveal:

  - relationship scores
  - compatibility summary
  - initialOverview

  Critical rule

  Do not call /enhanced-relationship-analysis unless partner._id is truthy.

  Before step 2, the client should explicitly validate:

  if (!partner?._id) {
    throw new Error("Guest subject creation succeeded but no guest subject id was returned");
  }

  That prevents the current broken behavior where userIdB is sent as undefined.

  Phase 3: Optional Full Async Relationship Workflow

  If the preview screen also wants the deeper full relationship analysis, start it separately after phase 2 succeeds.

  Call:

  POST /workflow/relationship/start

  Payload:

  {
    "compositeChartId": "<returned from phase 2>",
    "immediate": true
  }

  This is the recommended way if phase 2 already created the relationship.

  Do not call /workflow/relationship/start with userIdA + userIdB after already calling /enhanced-relationship-analysis, because that path auto-creates a relationship when compositeChartId is absent.
  Using userIdA + userIdB again risks creating a duplicate composite.

  So the correct rule is:

  - If relationship already exists from /enhanced-relationship-analysis, start workflow using compositeChartId.
  - Do not recreate the relationship.

  Then poll:

  POST /workflow/relationship/status

  Payload:

  {
    "compositeChartId": "<same compositeChartId>"
  }

  And fetch the full analysis when needed.

  Recommended UX Sequence

  This is the recommended client experience:

  1. User taps confirm in partner wizard.
  2. Show lightweight loading state for guest creation.
  3. Call romantic guest-create endpoint.
  4. As soon as phase 1 returns:
      - render partner card
      - show partner name/photo/details
      - show romantic overview/blurb
  5. Then start relationship preview call.
  6. As soon as phase 2 returns:
      - navigate to relationship preview
      - show compatibility scores
      - show initialOverview
  7. Optionally kick off full workflow in background using compositeChartId.
  8. When full workflow completes, progressively unlock deeper analysis.

  This staged UX is preferred over one big blocking spinner.

  What Needs To Change In The Client

  The client team should make these exact changes.

  1. Replace guest-create endpoints used by the relationship app preview flow.
     Current:

  - /createGuestSubject
  - /createGuestSubjectUnknownTime

  Change to:

  - /createGuestSubjectRomantic
  - /createGuestSubjectUnknownTimeRomantic

  2. Fix guest-create response parsing.
     Current assumption:

  - response itself is the subject document

  Correct behavior:

  - read id from response.userId
  - read subject fields from response.guestSubject
  - construct normalized partner object manually

  3. Add a hard guard before starting relationship preview.
     Do not call /enhanced-relationship-analysis unless partner._id exists.
  4. Preserve the staged payloads in client state separately.
     Recommended state buckets:

  - createdPartner
  - partnerRomanticOverview
  - partnerRomanticBlurb
  - relationshipPreviewAnalysis
  - activeRelationshipId

  5. If full analysis is started after preview, call workflow start with compositeChartId, not with userIdA + userIdB.

  Reference Normalization Example

  The client should treat phase 1 like this:

  const raw = birthTimeUnknown
    ? await api.createGuestSubjectUnknownTimeRomantic(payload)
    : await api.createGuestSubjectRomantic(payload);

  if (!raw?.success) {
    throw new Error(raw?.error || "Failed to create guest subject");
  }

  if (!raw?.userId) {
    throw new Error("Guest subject response missing userId");
  }

  const partner = {
    _id: raw.userId,
    ...raw.guestSubject,
  };

  const partnerPreview = {
    partner,
    birthChart: raw.birthChart ?? null,
    overview: raw.overview ?? null,
    romanticProfileBlurb: raw.romanticProfileBlurb ?? null,
    referencedCodes: raw.referencedCodes ?? [],
    overviewMode: raw.overviewMode ?? null,
    status: raw.status ?? null,
  };

  Then phase 2:

  if (!partner._id) {
    throw new Error("Cannot create relationship preview without partner id");
  }

  const preview = await api.enhancedRelationshipAnalysis({
    userIdA: selfProfile.id,
    userIdB: partner._id,
    ownerUserId: selfProfile.id,
    celebRelationship: false,
  });

  if (!preview?.compositeChartId) {
    throw new Error("Relationship preview response missing compositeChartId");
  }

  Optional phase 3:

  await api.startRelationshipWorkflow({
    compositeChartId: preview.compositeChartId,
    immediate: true,
  });

  Do Not Rely On These Assumptions

  The client should not assume:

  - guest-create returns a top-level subject document
  - guest-create returns _id
  - guestSubject contains _id
  - enhanced-relationship-analysis is safe to call with missing userIdB
  - workflow/relationship/start should be called with userIdA + userIdB after preview creation

  Those assumptions are what caused the current bug.

  Success Criteria For Client Implementation

  The implementation is correct if all of the following are true:

  - after guest creation, the client has a valid guest id from response.userId
  - the client can log partner._id before step 2
  - /enhanced-relationship-analysis is sent with a real string userIdB
  - the preview screen can render partner romantic assets before relationship scores finish loading
  - optional full analysis starts using compositeChartId only
  - no duplicate relationships are created

  One-Line Summary For The Client Team

  Use the romantic guest-create endpoints, read the new guest subject id from response.userId, build a normalized partner object from response.guestSubject, then call /enhanced-relationship-analysis
  with that id, and if deeper analysis is needed afterward, start /workflow/relationship/start using the returned compositeChartId rather than recreating the relationship.