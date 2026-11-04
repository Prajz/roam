# Roam · your own trip planner

A small Vite + plain JavaScript trip planner for you and a friend. It is entirely frontend: no Python, backend, accounts, database or API keys. Plans save in your browser and travel between devices as JSON files.

## Run locally

Requires Node.js 20.19+ / 22.12+ and Bun (or use the equivalent npm commands).

```sh
cd roam-trip-planner
bun install
bun run dev
```

Open the local URL printed by Vite. On your first visit, upload an existing JSON file, use **Paste or type JSON instead** to enter a plan directly, or use the short setup to enter dates, places, interests and optional flights. Roam creates an editable starter with suggested stays, activity ideas and a checklist. You can skip setup for a blank plan. Existing saved trips open directly. **Trip notes → Start a fresh trip** opens setup again and keeps your current plan until you finish. Import a personal JSON file from **Trip notes → Import JSON**.

## GitHub Pages

The public app is hosted at https://prajz.github.io/roam/ . Every push to `main` runs `.github/workflows/pages.yml`, checks JSON compatibility, builds with Vite and publishes `dist/` to GitHub Pages. You can also run the workflow manually in the repository's Actions tab.

The site and repository are public. Changes and JSON files you import stay in your browser; they are not uploaded to GitHub. Personal itineraries in `local-plans/` are ignored by Git and excluded from builds. There is no bundled itinerary or sample-loading button. Share your JSON files directly with your friend and import them through Trip notes.

## Upload to another static host

```sh
bun run build
```

Upload **the contents of `dist/`** to your site's folder. The folder contains everything needed; your host only serves static files. Neither Node nor Python is required on the server. Relative asset paths support a subfolder such as `https://your-site.example/roam/`. No SPA routing rules are needed.

To check the production build locally:

```sh
bun run preview
```

For private hosting, configure access protection on your host. Trip data stays in the browser; uploading the app does not upload your saved trip. Personal JSON files belong in `local-plans/`, which Git ignores and Vite does not copy into the production build. Import them manually in the app. Keep personal files out of `public/`, which Vite copies into `dist/`.

Upload the whole new `dist/` each time, including `sw.js`. On HTTPS the built app caches its files for offline use after the first visit. Refresh after an update to receive the latest app. The new worker also retires the old vanilla app's cache. The development server does not install an offline worker.

## Share a trip

1. Choose **Share plan**, or **Trip notes → Download JSON backup**.
2. Send the `.json` file to your friend.
3. Your friend opens the app and chooses **Import JSON** (in Trip notes on mobile).
4. To get their changes, import the updated file they send back.

These are separate copies, not live collaboration. Import replaces the current plan after confirmation, so export a backup before switching trips. Your existing version 1 JSON files and browser storage key are preserved. Browser data is tied to the site's address and browser; clearing site data can erase it.

## Edit JSON in the app

Open **Trip settings → JSON editor** to edit the complete saved plan inline. Validation updates as you type, with the field causing any problem shown below the editor. **Format JSON** tidies the text and **Reset draft** restores your current saved plan. Choose **Apply JSON** to update the app and browser save, or **Cancel** to discard the draft.

Invalid dates, duplicate IDs, unsupported fields and days outside the trip are rejected instead of silently dropping data. You can still import and export JSON files as before.

## Included

- First-visit JSON import or guided setup for dates, places, pace, interests and optional flights
- Starter stays split across available nights, flexible activity ideas and a booking checklist
- Separate departure and arrival dates for overnight flights; all times stay local to the airport

- Calendar and day-by-day itinerary; city labels stay visible on flight and check-out days, with activities shown chronologically in calendar previews
- Destination stays with check-in/out dates and optional arrival/departure times, accommodation, neighbourhoods and ideas
- Activities ordered by time in the calendar, daily itinerary and day popup; untimed ideas appear last, with the order of equal-time items preserved
- Activities with time, category, location, links, notes and completion
- Mouse and touch drag to move activities between days, with edge scrolling; timed activities keep their chronological display order
- Change the activity's date in its editor as an alternative to dragging
- Day overview and extra notes; trip-wide overview and reminders
- Automatic local saving, storage error feedback and a backup reminder
- JSON import/export, native file sharing where available, and ICS calendar export
- Responsive desktop layout and phone navigation; keyboard-accessible dialogs
- Static hosting under a subfolder, plus offline support for production builds

The date range is limited to a year. Stay check-out is exclusive: Nov 12–15 is three nights. All itinerary dates and times are local to the destination. Optional stay fields `checkInTime` and `checkOutTime` use `HH:MM` (24-hour) or `""`. They describe planned arrival at and departure from a destination; record separate hotel/luggage rules in notes. Old version 1 files without these fields still import, defaulting to blank times. Calendar export uses floating local times; untimed activities become all-day events and timed activities use a one-hour duration. Shortening trip dates is blocked if it would hide saved stays, activities or notes.

## JSON format

Use the [full AI trip-planning prompt](docs/AI_TRIP_PROMPT.md) to request rail-first recommendations and complete compatible JSON, including arrival/departure times.

The schema remains version 1. [tests/fixtures/example-trip.json](tests/fixtures/example-trip.json) is a synthetic example used by the test suite. No personal itinerary is bundled.

```json
{
  "schemaVersion": 1,
  "name": "Our next trip",
  "subtitle": "A week away",
  "startDate": "2026-11-11",
  "endDate": "2026-11-17",
  "overview": "Route and plans",
  "checklist": "Passports and tickets",
  "stays": [
    {
      "id": "stay-1",
      "name": "Harbor City",
      "from": "2026-11-12",
      "to": "2026-11-15",
      "checkInTime": "14:00",
      "checkOutTime": "18:00",
      "color": "#ec7658",
      "hotel": "",
      "area": "Waterfront",
      "notes": "",
      "ideas": "Museum, public gardens"
    }
  ],
  "days": {
    "2026-11-12": {
      "overview": "Arrival day",
      "notes": "Hotel transfer",
      "activities": [
        {
          "id": "activity-1",
          "title": "Arrive at the coast",
          "time": "16:00",
          "location": "Coastal Station",
          "category": "transport",
          "notes": "",
          "url": "",
          "done": false
        }
      ]
    }
  }
}
```

## Development and checks

```sh
bun run test
bun run build
bun run test:e2e
```

Browser tests use installed Google Chrome on macOS if available. Else install Playwright's Chromium (`bunx playwright install chromium`), or set `CHROME_PATH` to a Chrome executable. The tests cover 1440px desktop and 390px mobile layouts, editing, moving and deleting, JSON roundtrips, persisted notes, calendar exports, date boundaries, unsafe imports, dialogs, mouse/touch dragging and offline reload.

`src/main.js` connects the interface, `src/views.js` renders views, `src/editor.js` renders forms, and `src/drag.js` handles pointer dragging. `src/planner.js` owns state, local storage and file actions; `src/plan.js` contains shared date and schema helpers; `src/style.css` retains Roam's coral/slate styling. Vite produces `dist/`, and `scripts/build-service-worker.mjs` generates the matching offline cache.
