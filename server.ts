import express from "express";
import bodyParser from "body-parser";
import { chromium, Browser, Page } from "playwright";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs-extra";
import * as path from "path";

const app = express();
app.use(bodyParser.json());

const PORT = 8000;
const screenshotsDir = path.resolve("screenshots");
fs.ensureDirSync(screenshotsDir);

interface SessionData {
  cookieHeader: string;
  logs: string[];
}

const sessions: Record<string, SessionData> = {};

// Helper: 截图
async function takeScreenshot(page: Page, sessionId: string, prefix: string) {
  const screenshotPath = path.join(screenshotsDir, `${sessionId}_${prefix}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Helper: URL include/exclude
function isUrlAllowed(url: string, includePaths?: string[], excludePaths?: string[]): boolean {
  const pathName = new URL(url).pathname;
  if (excludePaths && excludePaths.some(prefix => pathName.startsWith(prefix))) return false;
  if (includePaths && includePaths.length > 0 && !includePaths.some(prefix => pathName.startsWith(prefix))) return false;
  return true;
}

// Login endpoint
app.post("/login", async (req, res) => {
  const { loginUrl, username, password, usernameSelector, passwordSelector, submitSelector } = req.body;
  const logs: string[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    logs.push(`Navigating to ${loginUrl}`);
    await page.goto(loginUrl, { waitUntil: "networkidle" });

    logs.push("Filling username/password");
    await page.fill(usernameSelector, username);
    await page.fill(passwordSelector, password);
    await page.click(submitSelector);

    await page.waitForLoadState("networkidle");
    logs.push("Login complete, extracting cookies");

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const sessionId = uuidv4();
    sessions[sessionId] = { cookieHeader, logs };
    const screenshotPath = await takeScreenshot(page, sessionId, "login");

    res.json({ sessionId, cookieHeader, screenshotPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message, logs });
  } finally {
    if (browser) await browser.close();
  }
});

// Fetch page endpoint
app.post("/fetch_page", async (req, res) => {
  const { sessionId, url, includePaths, excludePaths } = req.body;
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ html: "", screenshotPath: "" });

  const logs = session.logs;
  const cookieHeader = session.cookieHeader;

  if (!isUrlAllowed(url, includePaths, excludePaths)) {
    logs.push(`URL blocked by rules: ${url}`);
    return res.status(403).json({ html: "", screenshotPath: "" });
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    const domain = new URL(url).hostname;
    const cookiePairs = cookieHeader.split("; ");
    const cookies = cookiePairs.map(pair => {
      const [name, value] = pair.split("=");
      return { name, value, domain, path: "/" };
    });
    await context.addCookies(cookies);

    const page = await context.newPage();
    logs.push(`Fetching page: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    const html = await page.content();
    const screenshotPath = await takeScreenshot(page, sessionId, "fetch");

    logs.push(`Page fetched, screenshot: ${screenshotPath}`);
    res.json({ html, screenshotPath });
  } catch (err: any) {
    const screenshotPath = path.join(screenshotsDir, `${sessionId}_fetch_fail.png`);
    logs.push(`Fetch failed: ${err.message}, screenshot: ${screenshotPath}`);
    res.status(500).json({ html: "", screenshotPath });
  } finally {
    if (browser) await browser.close();
  }
});

// Status endpoint
app.get("/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  const logs = session.logs;
  const lastScreenshot = path.join(screenshotsDir, `${sessionId}_fetch.png`);
  res.json({ logs, lastScreenshot: fs.existsSync(lastScreenshot) ? lastScreenshot : null });
});

app.use(express.static(__dirname));
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
