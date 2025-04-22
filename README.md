# 4Chan Image Downloader

A Node.js script that scrapes images from 4chan threads using Puppeteer with stealth mode to avoid detection. Downloads are saved with proper referer headers and random delays to mimic human behavior.

## Features

- 🕵️‍♂️ Uses Puppeteer with StealthPlugin to avoid bot detection
- 📥 Downloads full-size images from threads
- 🗂 Organizes downloads by thread and page number
- ⏳ Includes random delays between requests to avoid rate limiting
- ♻️ Automatic retries for failed downloads
- 🚫 Blocks unnecessary resources (CSS, fonts) for faster loading

## 📦 Prerequisites

- Node.js (v14 or higher)
- npm/yarn

## 🛠 Installation

1. Clone this repository or download the script
2. Install dependencies:

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth axios
```

## 🚀 Usage

```bash
node 4chan_downloader.js [mode] [thread] [page]
```

Modes:

f1 - Download single page
f10 - Download first 10 pages

Examples:

Download first 10 pages of /wg/ thread

```bash
node 4chan_downloader.js f10 wg
```

Download page 3 of /b/ thread

```bash
node 4chan_downloader.js f1 b 3
```

## ⚙️ Configuration

You can modify these constants in the script:

BASE_URL: The 4chan board URL (default: https://boards.4channel.org)

DOWNLOAD_DIR: Where to save images (default: ./4chan_downloads)

USER_AGENT: Browser user agent to use

Delays and timeouts can be adjusted in the code

## ⚠️ Notes

Referer Headers: Automatically included (required by 4chan)

Delays: Randomized between requests (1-3s)

## 📂 Folder Structure:

```bash
4chan_downloads/
└── wg/
    └── page_1_123456789/
        ├── image1.jpg
        └── image2.png
```

## 📜 Disclaimer

This project is for educational purposes only. Respect 4chan's Terms of Service. Use at your own risk.
