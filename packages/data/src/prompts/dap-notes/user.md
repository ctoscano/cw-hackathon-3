---
name: dap-notes-user
description: User prompt template for DAP note generation
version: "1.0.0"
variables:
  - sessionDescription
---

# Session to Document

Please generate a complete DAP note for the following therapy session. The therapist has described the session as follows:

---

{{sessionDescription}}

---

## Instructions

Based on the session description above, generate a comprehensive DAP note that:

1. **Data Section**:
   - Extract subjective information the client shared
   - Note objective clinical observations mentioned by the therapist
   - Include direct quotes from the client when mentioned

2. **Assessment Section**:
   - Provide a clinical impression synthesizing the session data
   - Evaluate progress toward treatment goals
   - ALWAYS include a risk assessment (even if to note "no acute safety concerns")

3. **Plan Section**:
   - List specific interventions used and planned
   - Include any homework or between-session assignments
   - Describe focus areas for the next session
   - Note any referrals if mentioned

4. **Metadata**:
   - Infer the session date if mentioned, otherwise use today's date
   - Estimate session duration based on content (default to 50 minutes if unclear)
   - Identify session type (individual, couples, family, telehealth)
   - Suggest an appropriate CPT billing code

Generate the DAP note with clinical precision and appropriate professional language suitable for insurance documentation.
