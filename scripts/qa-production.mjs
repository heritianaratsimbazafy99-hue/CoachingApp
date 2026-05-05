import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const baseUrl = process.env.QA_BASE_URL ?? "https://coaching-app-pi-olive.vercel.app";
const password = process.env.QA_PASSWORD;
const contentFileId =
  process.env.QA_CONTENT_FILE_ID ?? "47ec5791-dbb0-4e24-aa70-4f5db11fb269";
const skipBrowser = process.env.QA_SKIP_BROWSER === "1";
const keepArtifacts = process.env.QA_KEEP_ARTIFACTS === "1";
const pwcli =
  process.env.PWCLI ??
  join(homedir(), ".codex", "skills", "playwright", "scripts", "playwright_cli.sh");

const roles = [
  {
    name: "admin",
    email: process.env.QA_ADMIN_EMAIL ?? "admin@ecce.mg",
    landing: "/admin",
    desktopRoutes: [
      "/admin",
      "/admin/users",
      "/admin/coaches",
      "/admin/coachees",
      "/admin/cohorts",
      "/admin/stats",
    ],
    mobileRoutes: [
      "/admin",
      "/admin/users",
      "/admin/coaches",
      "/admin/cohorts",
      "/admin/stats",
    ],
  },
  {
    name: "coach",
    email: process.env.QA_COACH_EMAIL ?? "coach@ecce.mg",
    landing: "/coach",
    desktopRoutes: [
      "/coach",
      "/coach/library",
      "/coach/quizzes",
      "/coach/assignments",
      "/coach/messages",
      "/coach/calendar",
      "/coach/paths",
      "/coach/notifications",
      "/coach/settings",
      "/coach/coachees",
      "/coach/corrections",
      "/coach/quiz-results",
    ],
    mobileRoutes: [
      "/coach",
      "/coach/library",
      "/coach/quizzes",
      "/coach/assignments",
      "/coach/messages",
      "/coach/calendar",
      "/coach/paths",
      "/coach/notifications",
    ],
  },
  {
    name: "coachee",
    email: process.env.QA_COACHEE_EMAIL ?? "coachee@ecce.mg",
    landing: "/coachee",
    desktopRoutes: [
      "/coachee",
      "/coachee/tasks",
      "/coachee/paths",
      "/coachee/calendar",
      "/coachee/messages",
      "/coachee/notifications",
      "/coachee/results",
      "/coachee/profile",
    ],
    mobileRoutes: [
      "/coachee",
      "/coachee/tasks",
      "/coachee/paths",
      "/coachee/calendar",
      "/coachee/messages",
      "/coachee/notifications",
      "/coachee/results",
      "/coachee/profile",
    ],
  },
];

async function main() {
  console.log(`QA production: ${baseUrl}`);

  await runHttpSmoke();

  if (skipBrowser) {
    console.log("QA navigateur ignoree: QA_SKIP_BROWSER=1");
    return;
  }

  if (!password) {
    throw new Error(
      "QA_PASSWORD est requis pour la QA navigateur. Utiliser QA_SKIP_BROWSER=1 pour les sondes HTTP seules.",
    );
  }

  if (!existsSync(pwcli)) {
    throw new Error(
      `Playwright CLI introuvable: ${pwcli}. Definir PWCLI ou lancer QA_SKIP_BROWSER=1.`,
    );
  }

  const result = await runBrowserQa();

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    throw new Error("QA navigateur production en echec.");
  }

  console.log(
    [
      `QA navigateur OK: ${result.routeCount} routes`,
      `diagnostics admin: ${result.diagnostics?.status}/${result.diagnostics?.ok}`,
      `coach download: ${result.downloads?.coach?.fileName ?? "n/a"}`,
      `coachee download: ${result.downloads?.coachee?.fileName ?? "n/a"}`,
    ].join("\n"),
  );
}

async function runHttpSmoke() {
  const checks = [
    { label: "root", path: "/", expected: 200 },
    {
      label: "content-files invalid",
      path: "/content-files/not-a-uuid",
      expected: 404,
    },
    {
      label: "cron without secret",
      path: "/api/cron/calendar-reminders",
      expected: 401,
    },
  ];

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`, { method: "HEAD" });
    if (response.status !== check.expected) {
      throw new Error(
        `${check.label}: HTTP ${response.status}, attendu ${check.expected}`,
      );
    }
    console.log(`${check.label}: HTTP ${response.status}`);
  }
}

async function runBrowserQa() {
  const qaFile = join(tmpdir(), `coachingapp-qa-${Date.now()}.js`);
  await writeFile(qaFile, buildBrowserQaSource(), "utf8");

  try {
    await runPwcli(["open", `${baseUrl}/login`]);
    const stdout = await runPwcli(["--raw", "run-code", "--filename", qaFile], {
      timeoutMs: 360000,
    });
    return parseQaResult(stdout);
  } finally {
    await runPwcli(["close"], { allowFailure: true });
    await rm(qaFile, { force: true });
    if (!keepArtifacts) {
      await rm(join(process.cwd(), ".playwright-cli"), {
        recursive: true,
        force: true,
      });
    }
  }
}

function runPwcli(args, options = {}) {
  const { allowFailure = false, timeoutMs = 60000 } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(pwcli, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Timeout Playwright CLI: ${args.join(" ")}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 || allowFailure) {
        resolve(stdout.trim());
        return;
      }
      reject(
        new Error(
          [
            `Playwright CLI a echoue (${code}): ${args.join(" ")}`,
            stdout,
            stderr,
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });
}

function parseQaResult(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    const match = stdout.match(/### Result\s*([\s\S]*?)\s*### Ran Playwright code/);
    if (!match) {
      throw new Error(`Resultat QA illisible:\n${stdout}`);
    }
    return JSON.parse(match[1]);
  }
}

function buildBrowserQaSource() {
  return `async (page) => {
  const base = ${JSON.stringify(baseUrl)};
  const password = ${JSON.stringify(password)};
  const contentFileId = ${JSON.stringify(contentFileId)};
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const roles = ${JSON.stringify(roles)};

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    const url = request.url();
    if (!failure || url.startsWith("data:") || failure.errorText === "net::ERR_ABORTED") {
      return;
    }
    requestFailures.push(\`\${request.method()} \${url} \${failure.errorText}\`);
  });

  function pathOf(url) {
    const withoutOrigin = url.replace(/^https?:\\/\\/[^/]+/, "");
    return withoutOrigin.split(/[?#]/)[0] || "/";
  }

  async function clearSession() {
    await page.context().clearCookies();
    await page.goto(\`\${base}/login\`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async function login(role) {
    await clearSession();
    await page.goto(\`\${base}/login\`, { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "Email" }).fill(role.email);
    await page.getByRole("textbox", { name: "Mot de passe" }).fill(password);
    await Promise.all([
      page.waitForURL((url) => url.pathname.startsWith(role.landing), {
        timeout: 20000,
      }),
      page.getByRole("button", { name: "Se connecter" }).click(),
    ]);
  }

  async function checkRoute(role, route, viewport) {
    await page.setViewportSize(viewport);
    const beforeConsole = consoleErrors.length;
    const response = await page.goto(\`\${base}\${route}\`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(350);

    const actualPath = pathOf(page.url());
    const title = await page.title();
    const bodyText = ((await page.locator("body").textContent()) ?? "")
      .replace(/\\s+/g, " ")
      .slice(0, 240);
    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      return {
        innerWidth: window.innerWidth,
        documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
        h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      };
    });

    const status = response?.status() ?? null;
    const redirectedToLogin = actualPath === "/login";
    const wrongRoleRedirect = !actualPath.startsWith(role.landing);
    const overflowX = metrics.documentWidth > metrics.innerWidth + 2;
    const newConsoleErrors = consoleErrors.slice(beforeConsole);
    const ok =
      status !== null &&
      status < 400 &&
      !redirectedToLogin &&
      !wrongRoleRedirect &&
      !overflowX &&
      newConsoleErrors.length === 0;

    return {
      role: role.name,
      viewport: viewport.width < 600 ? "mobile" : "desktop",
      route,
      status,
      actualPath,
      title,
      h1: metrics.h1,
      overflowX,
      consoleErrors: newConsoleErrors,
      bodySample: ok ? undefined : bodyText,
      ok,
    };
  }

  const routeResults = [];
  let diagnostics = null;
  let coachDownload = null;
  let coacheeDownload = null;

  for (const role of roles) {
    await login(role);

    if (role.name === "admin") {
      const response = await page.goto(\`\${base}/api/admin-diagnostics\`, {
        waitUntil: "networkidle",
      });
      const raw = (await page.locator("body").textContent()) ?? "";
      const parsed = JSON.parse(raw);
      diagnostics = {
        status: response?.status() ?? null,
        ok: parsed.ok,
        checks: parsed.checks?.map((check) => ({
          name: check.name,
          ok: check.ok,
        })),
        env: parsed.env,
      };
    }

    for (const route of role.desktopRoutes) {
      routeResults.push(await checkRoute(role, route, { width: 1440, height: 1000 }));
    }

    for (const route of role.mobileRoutes) {
      routeResults.push(await checkRoute(role, route, { width: 390, height: 900 }));
    }

    if (role.name === "coach" || role.name === "coachee") {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
      await page
        .goto(\`\${base}/content-files/\${contentFileId}\`, {
          waitUntil: "domcontentloaded",
        })
        .catch((error) => {
          if (!String(error?.message ?? error).includes("Download is starting")) {
            throw error;
          }
        });
      const download = await downloadPromise;
      const result = {
        fileName: download.suggestedFilename(),
        pagePath: pathOf(page.url()),
      };
      if (role.name === "coach") {
        coachDownload = result;
      } else {
        coacheeDownload = result;
      }
    }
  }

  const failedRoutes = routeResults.filter((result) => !result.ok);
  return {
    base,
    routeCount: routeResults.length,
    failedRoutes,
    diagnostics,
    downloads: {
      coach: coachDownload,
      coachee: coacheeDownload,
    },
    globalConsoleErrors: consoleErrors,
    pageErrors,
    requestFailures,
    ok:
      failedRoutes.length === 0 &&
      diagnostics?.status === 200 &&
      diagnostics?.ok === true &&
      Boolean(coachDownload?.fileName) &&
      Boolean(coacheeDownload?.fileName) &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      requestFailures.length === 0,
  };
}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
