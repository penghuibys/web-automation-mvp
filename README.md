# Web Automation MVP

## Project Overview

This is a production-grade Web Automation MVP built with Playwright + TypeScript + Node.js.  
Features include:

- Login to any website (username/password, form-based)  
- Session reuse (Cookies/Headers) for multi-page fetching  
- Return HTML/Markdown content  
- Per-step logs + screenshots for non-technical users  
- Include/exclude URL prefix rules  
- Session can be handed off to other crawlers (via Cookie Header)  
- Lightweight admin endpoint to view status

---

## Install Dependencies

```bash
npm install
npx playwright install
