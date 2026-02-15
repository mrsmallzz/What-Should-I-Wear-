# What Should I Wear Today?

## How to open it

From this repository folder, run:

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
