import axios from "axios";

const SERVER_URL = "http://localhost:8000";

async function login() {
  const resp = await axios.post(`${SERVER_URL}/login`, {
    loginUrl: SERVER_URL,
    username: "testuser",
    password: "password123",
    usernameSelector: "input[name=\"username\"]",
    passwordSelector: "input[name=\"password\"]",
    submitSelector: "button[type=\"submit\"]"
  });
  console.log("Login response:", resp.data);
  return resp.data.sessionId;
}

async function fetchPage(sessionId: string, url: string) {
  const resp = await axios.post(`${SERVER_URL}/fetch_page`, {
    sessionId,
    url,
    includePaths: ["/course"],
    excludePaths: ["/admin"]
  });
  console.log(`Fetched page: ${url}`);
  console.log(`Screenshot path: ${resp.data.screenshotPath}`);
}

async function showStatus(sessionId: string) {
  const resp = await axios.get(`${SERVER_URL}/status/${sessionId}`);
  console.log("Logs:", resp.data.logs);
  console.log("Last screenshot:", resp.data.lastScreenshot);
}

async function main() {
  try {
    const sessionId = await login();

    const urls = [
      "https://example.com/course/lesson1",
      "https://example.com/course/lesson2"
    ];

    for (const url of urls) {
      await fetchPage(sessionId, url);
    }

    await showStatus(sessionId);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
