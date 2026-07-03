# Steam Hour Bot 🤖

A self-hosted, web-based **Steam hour idling bot** built with Node.js. Log into your Steam account through a clean browser interface, pick the games you want, and let the bot accumulate playtime by appearing in-game — no Steam client required.

The control panel ships in **English by default**, with a one-click switch to Turkish, and supports both **dark and light** themes.

![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518.x-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)

---

## Table of Contents

- [Features](#features-)
- [How It Works](#how-it-works-)
- [Requirements](#requirements-)
- [Installation](#installation-)
- [Usage](#usage-)
- [Configuration](#configuration-optional-)
- [Data & Security](#data--security-)
- [Architecture](#architecture-)
- [Project Structure](#project-structure-)
- [Troubleshooting & FAQ](#troubleshooting--faq-)
- [Important Notes](#-important-notes-)
- [Contributing](#contributing-)
- [License](#license-)
- [Get in Touch / Support](#get-in-touch-or-support-me-)
- [Screenshots](#screenshots-)

---

## Features ✨

* **Easy Steam Login** — Username + password login with full **Steam Guard** support (both email codes and mobile authenticator codes).
* **Multi-Game Idling** — Idle up to **32 games simultaneously**, the maximum Steam allows.
* **Real Game Names** — Idled games are displayed with their actual Steam store names, not just raw AppIDs. Names are fetched once and cached locally.
* **Persistent AppID Memory** — The games you idled last time are remembered **per account** and auto-filled on your next login.
* **Playtime Tracking** — A live **session timer** plus an **all-time total** of accumulated idle time, persisted across restarts.
* **Automatic Reconnect** — If the connection to Steam drops (network blip, laptop sleep, Steam maintenance…), the bot reconnects using a saved **refresh token** and resumes idling automatically — no password re-entry needed.
* **Resume After Restart** — If the server process itself restarts, the bot silently logs back in and continues idling the same games.
* **Live Status Everywhere** — Bot status is broadcast over **WebSocket** to every open browser tab in real time.
* **English & Turkish UI** — English by default; switch languages with a single click. Your choice is remembered.
* **Dark & Light Themes** — Pick whichever is easier on your eyes. Also remembered.
* **Mobile-Friendly** — The control panel works comfortably on phones and tablets.
* **Optional Access Protection** — Lock the panel behind HTTP Basic Auth and/or serve it over HTTPS/WSS when exposing it beyond localhost.
* **Zero Frontend Tooling** — Plain HTML/CSS/JS. No build step, no framework, nothing to compile.

---

## How It Works 🧠

1. The Node.js server hosts the web control panel and keeps a single persistent connection to Steam via [`steam-user`](https://github.com/DoctorMcKay/node-steam-user).
2. When you log in, Steam issues a **refresh token**. The bot stores that token locally and uses it for all future logins — your password is used exactly once and never written to disk.
3. When you press **Start**, the bot tells Steam it is "playing" your chosen AppIDs. Steam counts that as real playtime.
4. Your browser talks to the server over a WebSocket, so status changes (running/stopped, reconnecting, timers, game list) appear instantly in every open tab.
5. Playtime is written to disk whenever a session ends or the connection drops, so your total hours survive crashes and restarts.

---

## Requirements 🛠️

* **[Node.js](https://nodejs.org/) v18 or higher** (v20+ recommended)
* **npm** (bundled with Node.js)
* An **internet connection** and a **Steam account**

---

## Installation 🚀

1. **Clone the repository:**
    ```bash
    git clone https://github.com/ayazdoruck/steam-hour-bot.git
    ```

2. **Enter the project directory:**
    ```bash
    cd steam-hour-bot
    ```

3. **Install dependencies:**
    ```bash
    npm install
    ```

4. **Start the bot:**
    ```bash
    npm start
    ```

5. **(Optional) Development mode** — auto-restarts on file changes:
    ```bash
    npm run dev
    ```

6. **(Optional) Run the test suite:**
    ```bash
    npm test
    ```

---

## Usage 🎮

1. Start the bot and open **http://localhost:3443** in your browser.
2. Enter your **Steam username and password** and click **Login**.
3. If **Steam Guard** is enabled, type the code from your email or mobile authenticator when prompted.
4. Enter the **AppIDs** of the games you want to idle, separated by commas — e.g. `730,440` (**730** = Counter-Strike 2, **440** = Team Fortress 2). You can find any game's AppID in its Steam store page URL, or on [SteamDB](https://steamdb.info/). If you've idled before, this field is pre-filled automatically.
5. Click **Start**. The bot appears in-game and the panel shows the game names, a live session timer, and your all-time total.
6. Monitor everything live from any number of open tabs.
7. Click **Stop** to pause idling, or **Logout** to fully sign out of the Steam account (this also deletes the saved session token).
8. Use the buttons in the top-right corner to switch the **language** (English/Turkish) or the **theme** (dark/light).
9. If the Steam connection drops, don't worry — the bot reconnects and resumes idling on its own.

---

## Configuration (optional) ⚙️

Everything is configured through environment variables. **None are required** for personal use on `localhost`.

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the web panel listens on. | `3443` |
| `APP_USERNAME` / `APP_PASSWORD` | If **both** are set, the web UI **and** the WebSocket are protected with HTTP Basic Auth. Strongly recommended for any deployment reachable beyond your own machine. | disabled |
| `SSL_KEY_PATH` / `SSL_CERT_PATH` | If **both** are set, the server runs over **HTTPS/WSS** using the given key/certificate files instead of plain HTTP/WS. | disabled |

**Example (PowerShell):**
```powershell
$env:APP_USERNAME = "admin"
$env:APP_PASSWORD = "a-strong-password"
npm start
```

**Example (bash):**
```bash
APP_USERNAME=admin APP_PASSWORD=a-strong-password npm start
```

---

## Data & Security 🔒

* Your Steam session is kept alive with a **refresh token**, not your password. The password is sent to Steam once at login and is **never written to disk**.
* All local state lives in the `data/` folder as plain JSON files (git-ignored, never committed):

  | File | Contents |
  |---|---|
  | `data/sessions.json` | Steam refresh token for the active account |
  | `data/appids.json` | Last idled AppIDs, per account |
  | `data/playtime.json` | Accumulated idle seconds, per account |
  | `data/gameNames.json` | Cached AppID → game name lookups |

* **Logout** clears the stored refresh token for the account.
* If you expose the bot beyond `localhost` (e.g. on a VPS), **set `APP_USERNAME`/`APP_PASSWORD`** and ideally `SSL_KEY_PATH`/`SSL_CERT_PATH` — otherwise anyone who can reach the port can control your Steam account.

---

## Architecture 🧩

* **`index.js`** — Express + WebSocket server. Serves the panel, relays browser commands to the Steam client, broadcasts status to all connected tabs, and silently resumes the previous session after a restart.
* **`steamClient.js`** — The single persistent `steam-user` session: login/logout, Steam Guard flow, connection-state machine (`idle → connecting → online → reconnecting/error`), automatic reconnect, and farming state.
* **`sessionStore.js`** / **`appidStore.js`** / **`playtimeStore.js`** / **`gameNameStore.js`** — Small JSON-file-backed stores (built on the shared `fileStore.js` helper) for refresh tokens, remembered AppIDs, accumulated playtime, and cached game names.
* **`public/`** — The vanilla HTML/CSS/JS control panel. No build step, no frontend framework.
* **`test/`** — `node:test` unit tests covering the data stores.

---

## Project Structure 📁

```
steam-hour-bot/
├── index.js            # Express + WebSocket server (entry point)
├── steamClient.js      # Persistent Steam session & farming logic
├── fileStore.js        # Shared JSON-file persistence helper
├── sessionStore.js     # Refresh token storage
├── appidStore.js       # Remembered AppIDs per account
├── playtimeStore.js    # Accumulated playtime per account
├── gameNameStore.js    # AppID → game name cache
├── public/
│   ├── index.html      # Control panel markup
│   ├── app.js          # UI logic, i18n, WebSocket client
│   └── style.css       # Themes & layout
├── test/               # node:test unit tests
├── data/               # Runtime JSON state (git-ignored)
└── screenshots/        # README images
```

---

## Troubleshooting & FAQ ❓

**The panel shows "No Connection".**
The browser lost its WebSocket to the server. It retries automatically with backoff; make sure the Node process is still running.

**"Incorrect username or password" but my credentials are right.**
Steam sometimes returns this after too many rapid attempts. Wait a few minutes and try again ("Too many attempts" may also appear explicitly).

**Steam Guard code is rejected.**
Codes are time-limited and single-use. Request a fresh one by logging in again. Pending Steam Guard prompts expire after 5 minutes.

**Does idling work while the account plays elsewhere?**
Steam allows one "playing" session per account. Starting the bot kicks other playing sessions, and playing on your PC will interrupt the bot.

**Do I earn card drops with this?**
The bot only accumulates **playtime**. Trading card drops follow Steam's own rules and are not guaranteed by idling.

**Where is my data stored? Is anything sent anywhere?**
Everything stays on your machine in the `data/` folder. The bot only talks to Steam.

---

## ❗ Important Notes ❗

* Only **one Steam account** can be logged in at a time.
* Idling hours may violate the terms of certain games or communities. **Any ban or penalty is your own responsibility.** Use at your own risk.
* This project is not affiliated with Valve or Steam.

---

## Contributing 🤝

Contributions are welcome! Feel free to open an issue or a pull request. You may modify and share this project freely **as long as you give credit**.

---

## License 📄

Released under the **MIT License**.

---

## Get in Touch or Support Me 📧

* **☕ Buy me a coffee:** [coff.ee/pahiy](https://coff.ee/pahiy)
* **🅾 Instagram:** [@ayazdoruck](https://www.instagram.com/ayazdoruck/)

---

## Screenshots 📸

<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">
    <img src="screenshots/sc1.png" alt="Login Page" width="300">
    <img src="screenshots/sc3.png" alt="Steam Guard" width="300">
    <img src="screenshots/sc2.png" alt="Control Panel" width="300">
</div>
