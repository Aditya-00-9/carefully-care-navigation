# carefully

A multilingual, voice-first care-navigation prototype. It helps people organize what they are feeling and prepare to talk with a clinician. It does **not** diagnose conditions, estimate disease probabilities, offer treatment advice, or provide a referral.

## Run and deploy

This is a static site with one Vercel serverless function. No build step or front-end dependency install is needed.

- Open `index.html` in a modern browser for the local typed flow. AI requires the deployed `/api/analyze` endpoint.
- Deploy this folder as a Vercel project (or connect the GitHub repository and deploy it there).
- In the Vercel project's Environment Variables, set `CEREBRAS_API_KEY` to a Cerebras Inference API key. Optionally set `CEREBRAS_MODEL` (defaults to `llama3.3-70b`). Redeploy after setting variables.
- Keep the API key in Vercel only. Never put a real key in `.env.example`, source control, or browser code.
- Cerebras calls are optional and only happen when a user checks the AI consent box and asks for a summary. If no key is configured or Cerebras is unavailable, the typed flow still works and the site does not retry or send to a fallback provider.

The voice experience uses browser Web Speech recognition where supported. Recognition availability, accuracy, language support, audio handling, and HTTPS requirements depend on the browser and its speech provider. Text entry is always available.

## What's in the prototype

- Responsive patient experience and voice/text intake across a small set of browser speech languages.
- Explicit optional consent before a symptom description is sent to the app's server endpoint and Cerebras.
- Server-side Cerebras Inference chat integration (`llama3.3-70b`): English translation/visit summary and three neutral preparation questions only.
- Deterministic, phrase-based emergency safety prompt, independent of the model.
- Clipboard export of the original patient-provided summary.
- A transparent, illustrative care category inferred by keyword. It is not a validated referral or medical recommendation; primary care remains the suggested first contact.
- Privacy notice explaining the prototype's local handling and optional third-party processing.

No verified provider directory or real ratings are connected. Carefully does not fabricate doctor listings or reviews. For care, use a local health service or a directory that covers the patient's location and makes provider provenance clear.

## Before use with real patients

This is not a medical device, validated symptom checker, or production health service. Its emergency phrase check is incomplete and may miss danger or flag non-urgent text. Do not rely on it to decide whether it is safe to wait. Before launch, require clinical and safety review, language-by-language localization and evaluation, accessibility and security review, health-data/privacy and regulatory assessment, and integration of a verified provider directory for defined regions. Ensure privacy and retention terms are suitable for health information before enabling AI processing.
