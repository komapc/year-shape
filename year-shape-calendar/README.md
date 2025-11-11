# Year Shape Calendar — Minimal

This is a minimalist interactive calendar visualization that represents the whole year in a shape that can morph from a circle to a square by adjusting corner radius. It divides the year into four seasonal sections arranged counter-clockwise: Winter (top), Spring (left), Summer (bottom), Autumn (right). Features:

- Adjustable corner radius
- Swap seasons (Winter↔Summer)
- Change time flow direction (clockwise / counter-clockwise)
- Refresh calendar events (demo mode) and integrate Google Calendar (client-side)
- Click a week to open a Soviet-style diary weekly detail view (4 days left, 3 days right)

Files
- `index.html` — UI shell
- `styles.css` — Minimal modern styles
- `app.js` — App logic and rendering

Running
Open `index.html` in a modern browser (Chrome/Edge/Firefox). For Google Calendar integration you'll need to register a Google API OAuth client ID and add client-side code; see next section.

Google Calendar integration
This project includes hooks for client-side integration. For a basic client-only flow:

1. Create an OAuth 2.0 Client ID at Google Cloud Console (type: Web application) and add your origin (e.g., `http://localhost:8000`).
2. Add the CLIENT_ID into `app.js` (not included) and implement sign-in using Google's Identity Services.
3. After sign-in, call the Calendar API to list events and map them to weeks/days. The app expects eventsByWeek to be an object mapping week index -> array of events where each event may include a `_day` (0-6) derived from its date.

Notes and next steps
- This is a front-end-only demo. For production you should implement secure server-side OAuth token handling if required.
- Improvements: better event placement, weekly date calculations, localization, keyboard accessibility, unit tests.
