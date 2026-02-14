# What Should I Wear Today?

## How to open it

From this repository folder, run:
A browser-based outfit planning app that supports:

- Onboarding flow with the prompt: **"What outfit do you want to wear today?"**
- Location + date weather checks (Open-Meteo API)
- 10+ day forecast warning
- Vibe selection with preset and freeform options
- Optional age input
- Owned and inspiration upload flows (inspiration marked as non-owned)
- Closet creation/selection and item management
- Favorite/dislike for closets and items
- Extra clothing categories beyond basic ones
- 10-day outfit plans with labels and multi-outfit days
- Travel/event plans with custom duration and per-day location
- Home screen with date, weather, calendar link status, and most recent outfit
- AI-style outfit suggestion simulation (3 looks, retry by submitting again)

## Run

Serve the files with any static server, for example:

```bash
python3 -m http.server 4173
```

Then open:

- http://localhost:4173

## App flow

1. Onboarding start screen with: "What outfit do you want to wear today?" + Continue.
2. Name screen with: "what is you're name", text input, and arrow continue button.
3. Details screen asking for location, optional age, optional Google Calendar link.
4. Photo screen for individual item uploads and full outfit uploads.
5. Continue to Home screen.

## Main tabs

- Home
- Closets
- 10 Day Plan
- Travel

## Notes

- Data is saved in browser localStorage.
- Full outfit uploads are "analyzed" into placeholder individual items (top, bottom, shoes, layer) and saved in the selected closet.
- Weather uses Open-Meteo and shows a warning if the chosen date is more than 10 days out.
Then open <http://localhost:4173>.
