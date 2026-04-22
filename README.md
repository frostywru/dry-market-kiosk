# 🧅 Tindahan ni Aling Nena — Setup Guide

## Files in this project
```
dry-market-kiosk/
├── index.html   ← Main kiosk page
├── style.css    ← All styles
├── app.js       ← All logic + Firebase
└── README.md    ← This file
```

---

## STEP 1 — Create a Free GitHub Account + Repository

1. Go to https://github.com and sign up (free)
2. Click **"New repository"** (green button)
3. Name it: `dry-market-kiosk`
4. Set it to **Public**
5. Click **"Create repository"**

---

## STEP 2 — Install VS Code (Free)

1. Go to https://code.visualstudio.com
2. Download and install for your OS
3. Open VS Code → open the `dry-market-kiosk` folder

---

## STEP 3 — Create a Free Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `dry-market-kiosk`
3. Disable Google Analytics (optional) → **Create project**

### Enable Firestore:
4. In left sidebar → **Build → Firestore Database**
5. Click **"Create database"**
6. Choose **"Start in test mode"** → Next → select a region → **Enable**

### Get your config:
7. In left sidebar → ⚙️ **Project Settings** (gear icon)
8. Scroll to **"Your apps"** → click the `</>` (Web) icon
9. Register app name: `kiosk` → click **Register app**
10. Copy the `firebaseConfig` object — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "dry-market-kiosk.firebaseapp.com",
  projectId: "dry-market-kiosk",
  storageBucket: "dry-market-kiosk.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## STEP 4 — Paste your Firebase Config into app.js

Open `app.js` in VS Code.

Find this section near the top:
```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  ...
};
```

Replace with your actual config values from Step 3.

Also change the admin password if you want:
```js
const ADMIN_PASSWORD = "admin1234"; // ← change this
```

---

## STEP 5 — Update Firestore Security Rules (Important!)

In Firebase Console → **Firestore → Rules** tab, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**. (This allows public read/write — fine for a local kiosk. For internet-facing, tighten later.)

---

## STEP 6 — Push Files to GitHub

### Option A — Using VS Code (Easiest):
1. In VS Code, open Terminal → **View → Terminal**
2. Run these commands one by one:

```bash
cd path/to/dry-market-kiosk
git init
git add .
git commit -m "Initial kiosk app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dry-market-kiosk.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Option B — GitHub Desktop (No command line):
1. Download https://desktop.github.com
2. File → Add Local Repository → select your folder
3. Commit all files → Push origin

---

## STEP 7 — Enable GitHub Pages (Free Hosting)

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Left sidebar → **Pages**
4. Under **Source** → select **Deploy from a branch**
5. Branch: **main** / Folder: **/ (root)**
6. Click **Save**

Wait 1-2 minutes. Your site will be live at:
```
https://YOUR_USERNAME.github.io/dry-market-kiosk/
```

---

## STEP 8 — Test Everything

1. Open the live URL on any device
2. Try adding items to cart and placing an order
3. Click ⚙ Admin → enter your password → check inventory and orders
4. Edit a price → it updates live on the kiosk!

---

## HOW TO UPDATE PRICES (Daily Use)

1. Open your website URL
2. Click **⚙ Admin** button (top right)
3. Enter your admin password
4. In **📦 Inventory** tab → click **✏ Edit** on any item
5. Change the price → **Save**
6. Price updates immediately on the kiosk! ✅

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| Blank screen / errors | Check browser console (F12), verify Firebase config in app.js |
| Products not loading | Make sure Firestore rules are set to allow read/write |
| Admin login not working | Check ADMIN_PASSWORD in app.js |
| GitHub Pages shows 404 | Wait 2-3 minutes after enabling Pages, or check the branch is "main" |

---

## DEFAULT ADMIN PASSWORD
```
admin1234
```
Change it in `app.js` → `const ADMIN_PASSWORD = "your-new-password";`
Then push to GitHub again.
