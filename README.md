# Roam · your own trip planner

A small Vite + plain JavaScript trip planner for you and a friend. It is entirely frontend: no Python, backend, accounts, database or API keys. Plans save in your browser and travel between devices as JSON files.

## Run locally

Requires Node.js 20.19+ / 22.12+ and Bun (or use the equivalent npm commands).

```sh
cd roam-trip-planner
bun install
bun run dev
```

Open the local URL printed by Vite. Start with a blank week, change **Trip settings**, then add destinations and activities. The optional China itinerary is under **Trip notes → Load China sample**.

## Upload to your own private site

```sh
bun run build
```

Upload **the contents of `dist/`** to your site's folder. The folder contains everything needed; your host only serves static files. Neither Node nor Python is required on the server. Relative asset paths support a subfolder such as `https://your-site.example/roam/`. No SPA routing rules are needed.

To check the production build locally:

```sh
bun run preview
```

The website's access protection comes from your existing private host. Trip data stays in the browser; uploading the app does not upload your saved trip. The bundled China sample **is** in the uploaded files: omit `dist/examples/` if you don't want it hosted (the sample button will then report that it is unavailable).

Upload the whole new `dist/` each time, including `sw.js`. On HTTPS the built app caches its files for offline use after the first visit. Refresh after an update to receive the latest app. The new worker also retires the old vanilla app's cache. The development server does not install an offline worker.

## Share a trip

1. Choose **Share plan**, or **Trip notes → Download JSON backup**.
2. Send the `.json` file to your friend.
3. Your friend opens the app and chooses **Import JSON** (in Trip notes on mobile).
4. To get their changes, import the updated file they send back.

These are separate copies, not live collaboration. Import replaces the current plan after confirmation, so export a backup before switching trips. Your existing version 1 JSON files and browser storage key are preserved. Browser data is tied to the site's address and browser; clearing site data can erase it.

## Included

- Calendar and day-by-day itinerary
- Destination stays, check-in/out, accommodation, neighbourhoods and ideas
- Activities with time, category, location, links, notes and completion
- Mouse and touch drag to reorder/move activities, with edge scrolling
- Change the activity's date in its editor as an alternative to dragging
- Day overview and extra notes; trip-wide overview and reminders
- Automatic local saving, storage error feedback and a backup reminder
- JSON import/export, native file sharing where available, and ICS calendar export
- Responsive desktop layout and phone navigation; keyboard-accessible dialogs
- Static hosting under a subfolder, plus offline support for production builds

The date range is limited to a year. Stay check-out is exclusive: Nov 12–15 is three nights. All itinerary dates and times are local to the destination. Calendar export uses floating local times; untimed activities become all-day events and timed activities use a one-hour duration. Shortening trip dates is blocked if it would hide saved stays, activities or notes.

## JSON format

The schema remains version 1. [examples/china-2026.json](examples/china-2026.json) is a complete example.

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
      "name": "Guangzhou",
      "from": "2026-11-12",
      "to": "2026-11-15",
      "color": "#ec7658",
      "hotel": "",
      "area": "Tianhe",
      "notes": "",
      "ideas": "Canton Tower, Pearl River"
    }
  ],
  "days": {
    "2026-11-12": {
      "overview": "Arrival day",
      "notes": "Hotel transfer",
      "activities": [
        {
          "id": "activity-1",
          "title": "Arrive Guangzhou",
          "time": "16:00",
          "location": "Baiyun Airport",
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
