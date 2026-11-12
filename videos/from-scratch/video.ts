import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderWelcomeBanner } from "@cosmicdrift/kumiko-dev-server";
import {
  defineVideo,
  type E2eSeededTenant,
  type StagePreview,
  type StagePreviewCard,
  editorStage,
  expect,
  mailCapture,
  type StageOutputLine,
  type TerminalCommand,
  terminalStage,
  type VideoSceneContext,
  type VideoVoice,
} from "@cosmicdrift/kumiko-testing/e2e";
import type { Locator, Page } from "@playwright/test";
import { SQL } from "bun";
import { z } from "zod";
import { seedDemoHostTenant } from "../../e2e/seeds/demo-host";
import { rsvpTable } from "../../src/features/show-pony/schema/rsvp";
import { TIER_MAX_EVENTS, TIER_MAX_GUESTS } from "../../src/marketing/pricing";
import { introCard, outroCard } from "../_cards";
import { fileLines } from "../_source";

const VOICE: VideoVoice = {
  voice: "Kore",
  instructions:
    "Calm, friendly explainer voice, clear and unhurried, short pauses between sentences.",
};

const APEX_URL = "http://localhost:4188";
const FEATURE_DIR = "src/features/show-pony";
const TENANT_KEY_STATE = "tenantKey";
const EVENT_ID_STATE = "eventId";
const AVA_RSVP_ID_STATE = "avaRsvpId";
const EVENT_SLUG = "rooftop-launch";
const GUEST_NAME = "Ava Chen";
const GUEST_EMAIL = "ava@example.com";
const BRANDING_ACCENT = "#f97316";
// Served by heroAssetRoute (bin/prod-options.ts) from dist/heroes, copied from public/heroes.
const BRANDING_HERO_IMAGE = "/heroes/demo-rooftop.webp";
const DESKTOP_SIZE = { width: 1920, height: 1080 };
const PREVIEW_SIZE = { width: 1024, height: 1080 };

const RSVP_SUBMIT = "showpony:write:rsvp:submit";
const RSVP_LIST = "showpony:query:rsvp:list";
const EVENT_LIST = "showpony:query:event:list";
const FORGET_SUBJECT = "crypto-shredding:write:forget-subject";
const DATA_PROTECTION_OFFICER = "DataProtectionOfficer";
const HTTP_OK = 200;
const HTTP_UNPROCESSABLE = 422;
const HTTP_TOO_MANY_REQUESTS = 429;

// The terminal shows the dev port from the banner; the recorded server listens on APEX_URL's port.
const TERMINAL_ORIGIN = "http://localhost:4173";
const RATE_LIMIT_DEMO_IP = "203.0.113.7";
const DEFAULT_DATABASE_URL = "postgresql://kumiko:kumiko@localhost:15432/kumiko_dev";
// Two cells plus separators must fit one line of the half-width terminal, or psql rows wrap.
const MAX_DB_CELL_CHARS = 34;
// Spoken text of "plans" minus the part the live form submit takes.
const PLANS_LIVE_PART_MS = 8000;

const RATE_LIMIT_GUESTS = [
  "Noah Fischer",
  "Mia Lopez",
  "Liam Novak",
  "Sofia Rossi",
  "Emma Kowalski",
  "Lucas Meyer",
  "Olivia Brown",
  "Ethan Silva",
  "Hannah Weber",
  "Mateo Garcia",
  "Zoe Martin",
  "Jonas Becker",
  "Lena Schulz",
  "Oscar Nilsson",
  "Chloe Dubois",
  "Felix Hoffmann",
  "Ines Costa",
  "Leo Rinaldi",
  "Maya Patel",
  "Theo Larsen",
  "Nina Petrov",
] as const;

type DemoApi = ReturnType<E2eSeededTenant["apiAs"]>;
interface DemoApis {
  readonly host: DemoApi;
  readonly dataProtectionOfficer: DemoApi;
}

// Scenes run in the process that ran setup, but ctx.state only carries strings.
let demoApis: DemoApis | undefined;

function apis(): DemoApis {
  if (demoApis === undefined) throw new Error("demo APIs were not set in setup");
  return demoApis;
}

function stateString(state: Map<string, unknown>, key: string): string {
  const value = state.get(key);
  if (typeof value !== "string") throw new Error(`video state "${key}" was not set in setup`);
  return value;
}

function tenantKeyOf(ctx: VideoSceneContext): string {
  return stateString(ctx.state, TENANT_KEY_STATE);
}

function guestOrigin(ctx: VideoSceneContext): string {
  return `http://${tenantKeyOf(ctx)}.localhost:4188`;
}

function guestUrl(ctx: VideoSceneContext): string {
  return `${guestOrigin(ctx)}/e/${EVENT_SLUG}`;
}

function eventDateInThirtyDays(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

const idRowsSchema = z.object({ rows: z.array(z.object({ id: z.string(), name: z.string().optional() })) });

async function firstEventId(): Promise<string> {
  const { rows } = idRowsSchema.parse(await apis().host.queryOk(EVENT_LIST, {}));
  const first = rows[0];
  if (first === undefined) throw new Error("no event found for the demo host");
  return first.id;
}

async function rsvpIdOf(name: string): Promise<string> {
  const { rows } = idRowsSchema.parse(await apis().host.queryOk(RSVP_LIST, {}));
  const row = rows.find((candidate) => candidate.name === name);
  if (row === undefined) throw new Error(`no RSVP named "${name}" in the guest list`);
  return row.id;
}

// A real guest has no session: plain POST to the host's subdomain, with an own client IP per bucket.
async function submitAnonymousRsvp(
  ctx: VideoSceneContext,
  eventId: string,
  name: string,
  clientIp: string,
): Promise<number> {
  const response = await fetch(`${guestOrigin(ctx)}/api/write`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": clientIp },
    body: JSON.stringify({
      type: RSVP_SUBMIT,
      payload: { eventId, name, status: "yes", plusN: 0 },
    }),
  });
  return response.status;
}

const BANNER = renderWelcomeBanner({
  url: "http://localhost:4173",
  admin: { email: "admin@show-pony.local", password: "changeme" },
});

function bannerLines(): readonly (string | StageOutputLine)[] {
  return BANNER.split("\n").map((text, index) => (index === 1 ? { text, tone: "success" } : text));
}

const SCAFFOLD_COMMANDS: readonly TerminalCommand[] = [
  {
    command: "curl -fsSL https://kumiko.rocks/install.sh | bash -s -- show-pony --yes",
    busyMs: 900,
    elapsedMs: 9400,
    output: [
      { text: "kumiko installer v1", tone: "accent" },
      { text: "✓ bun 1.4.4 already installed", tone: "success" },
      '→ Scaffolding kumiko app "show-pony"',
      { text: "Resolving dependencies", tone: "dim" },
      { text: "Resolved, downloaded and extracted [1235]", tone: "dim" },
      {
        text: "Auto-included via requires: user-data-rights, data-retention, compliance-profiles, sessions, auth-foundation, user-data-rights-defaults, files",
        tone: "dim",
      },
      "→ Scaffolding 14 features into ./show-pony/ …",
      { text: "✓ show-pony scaffolded", tone: "success" },
    ],
  },
  { command: "cd show-pony", elapsedMs: 3, promptAfter: "~/code/show-pony" },
  {
    command: "bun install",
    busyMs: 1500,
    elapsedMs: 4930,
    output: [{ text: "570 packages installed [4.93s]", tone: "success" }],
  },
  { command: "cp .env.example .env", elapsedMs: 2 },
  {
    command: "docker compose up -d",
    busyMs: 800,
    output: [
      { text: "Container show-pony-postgres-1 Started", tone: "dim" },
      { text: "Container show-pony-redis-1 Started", tone: "dim" },
    ],
  },
  {
    command: "bun dev",
    busyMs: 1200,
    keepsRunning: true,
    output: [
      { text: "$ bun --watch bin/server.ts", tone: "dim" },
      { text: "[kumiko-server] listening on http://localhost:4173", tone: "dim" },
      ...bannerLines(),
    ],
  },
];

async function showStage(
  ctx: VideoSceneContext,
  stage: { html: string; durationMs: number },
  minMs: number,
): Promise<void> {
  await ctx.tools.stage(stage.html);
  await ctx.tools.animate(Math.max(stage.durationMs, minMs));
}

// Splits the narration over several stages: each stage keeps its own typing time, the surplus is shared.
async function showStages(
  ctx: VideoSceneContext,
  stages: readonly { html: string; durationMs: number }[],
): Promise<void> {
  const total = stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const extraEach = Math.max(0, ctx.speechMs - total) / stages.length;
  for (const stage of stages) await showStage(ctx, stage, stage.durationMs + extraEach);
}

interface AppPreviewOptions {
  readonly url: string;
  readonly highlights?: (page: Page) => readonly Locator[];
  readonly cards?: readonly StagePreviewCard[];
  // Drives the app into the state the shown code produces before the snapshot is taken.
  readonly prepare?: (page: Page) => Promise<void>;
  // Elements the typed code adds: hidden (display:none, so the layout reflows as if absent) for
  // the before shot, restored for the after shot. May be async when it has to inspect the page.
  readonly addedByCode?: (page: Page) => Promise<readonly Locator[]> | readonly Locator[];
  // Before shot taken earlier, for terminal scenes whose command changes app state.
  readonly beforeImageUrl?: string;
}

const nextFrame = (page: Page): Promise<void> =>
  page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => done())));

const HIDDEN_FOR_BEFORE_ATTR = "data-video-before-hidden";

// Role locators skip hidden elements, so restoring goes by a marker instead of the same locators.
async function hideAddedByCode(locators: readonly Locator[]): Promise<void> {
  for (const locator of locators) {
    await locator.evaluateAll((elements, attr) => {
      for (const element of elements) {
        element.setAttribute(attr, "");
        element.style.display = "none";
      }
    }, HIDDEN_FOR_BEFORE_ATTR);
  }
}

async function restoreAddedByCode(page: Page): Promise<void> {
  await page.locator(`[${HIDDEN_FOR_BEFORE_ATTR}]`).evaluateAll((elements, attr) => {
    for (const element of elements) {
      element.removeAttribute(attr);
      element.style.display = "";
    }
  }, HIDDEN_FOR_BEFORE_ATTR);
}

// Snapshot with the code-added elements hidden; they are restored afterwards.
async function snapshotWithout(
  page: Page,
  ctx: VideoSceneContext,
  addedByCode: NonNullable<AppPreviewOptions["addedByCode"]>,
): Promise<string> {
  const added = await addedByCode(page);
  for (const locator of added) await expect(locator.first()).toBeVisible();
  await hideAddedByCode(added);
  for (const locator of added) await expect(locator.first()).toBeHidden();
  await nextFrame(page);
  const imageUrl = await ctx.tools.snapshot();
  await restoreAddedByCode(page);
  await nextFrame(page);
  return imageUrl;
}

const THEME_FILE = "src/theme.ts";
const THEMING_TOKENS = ["primary", "primary-foreground", "sidebar", "sidebar-primary", "background"];

// The renderer's own palette: dark lives in its @theme block, light after `:root:not(.dark)`.
function rendererDefaultColor(css: string, token: string, mode: "light" | "dark"): string {
  const from = mode === "light" ? css.indexOf(":root:not(.dark) {") : 0;
  const match = css.slice(from).match(new RegExp(`--color-${token}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`renderer default for --color-${token} (${mode}) not found`);
  return match[1];
}

// Resets the typed theme tokens to the renderer defaults in both modes, so the "before" matches whichever mode is recorded.
async function resetThemeTokensToRendererDefaults(page: Page): Promise<void> {
  const css = readFileSync(import.meta.resolveSync("@cosmicdrift/kumiko-renderer/web/styles.css"), "utf8");
  const declarations = (mode: "light" | "dark") =>
    THEMING_TOKENS.map((token) => `--color-${token}: ${rendererDefaultColor(css, token, mode)};`).join(" ");
  await page.addStyleTag({
    content: `:root:not(.dark) { ${declarations("light")} } .dark { ${declarations("dark")} }`,
  });
  await nextFrame(page);
}

function themeTokenLineNumbers(): number[] {
  const lines = readFileSync(resolve(import.meta.dir, "../..", THEME_FILE), "utf8").split("\n");
  return THEMING_TOKENS.map((token) => {
    const index = lines.findIndex((line) => line.trim().replace(/^"/, "").startsWith(`${token}"`) || line.trim().startsWith(`${token}:`));
    if (index < 0) throw new Error(`token ${token} not found in ${THEME_FILE}`);
    return index + 1;
  });
}

// Plain snapshot of a page in its current state, e.g. before a terminal command changes it.
async function snapshotOf(
  page: Page,
  ctx: VideoSceneContext,
  options: Pick<AppPreviewOptions, "url" | "prepare" | "addedByCode">,
): Promise<string> {
  await page.setViewportSize(PREVIEW_SIZE);
  await page.goto(options.url);
  await options.prepare?.(page);
  const imageUrl = options.addedByCode
    ? await snapshotWithout(page, ctx, options.addedByCode)
    : await ctx.tools.snapshot();
  await page.setViewportSize(DESKTOP_SIZE);
  return imageUrl;
}

// Nothing is recorded while no tool call runs.
async function appPreview(
  page: Page,
  ctx: VideoSceneContext,
  options: AppPreviewOptions,
): Promise<StagePreview> {
  const { url } = options;
  await page.setViewportSize(PREVIEW_SIZE);
  await page.goto(url);
  await options.prepare?.(page);
  const beforeImageUrl = options.addedByCode
    ? await snapshotWithout(page, ctx, options.addedByCode)
    : options.beforeImageUrl;
  const targets = options.highlights?.(page) ?? [];
  await expect(targets[0] ?? page.getByRole("heading").first()).toBeVisible();
  const imageUrl = await ctx.tools.snapshot();
  const highlights: { x: number; y: number; width: number; height: number }[] = [];
  for (const target of targets) {
    const box = await target.boundingBox();
    if (box === null) throw new Error(`preview highlight for ${url} has no bounding box`);
    highlights.push(box);
  }
  await page.setViewportSize(DESKTOP_SIZE);
  return {
    imageUrl,
    beforeImageUrl,
    imageWidthPx: PREVIEW_SIZE.width,
    imageHeightPx: PREVIEW_SIZE.height,
    highlights,
    cards: options.cards,
  };
}

// The Field div: innermost div holding both the label and its control(s), so date and time stay together.
function fieldWrapper(page: Page, label: string): Locator {
  return page
    .locator("div")
    .filter({ has: page.locator("label").filter({ hasText: new RegExp(`^${label}`) }) })
    .filter({ has: page.locator("input, select, textarea") })
    .last();
}

async function columnCells(page: Page, header: string): Promise<readonly Locator[]> {
  await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const headers = await page.getByRole("columnheader").allInnerTexts();
  const index = headers.findIndex((text) => text.includes(header));
  if (index < 0) throw new Error(`no column header "${header}" on ${page.url()}`);
  return [page.locator(`table tr > :nth-child(${index + 1})`)];
}

function readRateLimit(): { limit: number; windowSeconds: number } {
  const match = readFileSync(
    resolve(import.meta.dir, "../..", FEATURE_DIR, "handlers/rsvp-submit.write.ts"),
    "utf8",
  ).match(/rateLimit: \{[^}]*limit: (\d+), windowSeconds: (\d+)/);
  if (!match) throw new Error("rateLimit line not found in rsvp-submit.write.ts");
  return { limit: Number(match[1]), windowSeconds: Number(match[2]) };
}

function rateLimitCardLine(): string {
  const { limit, windowSeconds } = readRateLimit();
  return `${limit} requests / ${windowSeconds} s per IP`;
}

const formatCap = (value: number | null, noun: string): string =>
  value === null
    ? `unlimited ${noun}s`
    : `${value.toLocaleString("en-US")} ${noun}${value === 1 ? "" : "s"}`;

function tierCardLine(label: string, tier: keyof typeof TIER_MAX_EVENTS): string {
  return `${label}: ${formatCap(TIER_MAX_EVENTS[tier], "event")}, ${formatCap(TIER_MAX_GUESTS[tier], "guest")}`;
}

type CapturedMail = Awaited<ReturnType<typeof mailCapture>>;

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

function mailCardHtml(mail: CapturedMail): string {
  const sender = mail.fromName || mail.from;
  const fromRow = !sender ? "" : `<div><span class="label">From</span>${escapeHtml(sender)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    body { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(ellipse at 50% 35%, #2d1b4e 0%, #140a24 70%);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    .card { width: 960px; height: 700px; background: #fff; border-radius: 14px; overflow: hidden;
      display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .head { padding: 18px 26px; background: #f4f1fb; border-bottom: 1px solid #ddd5f0; color: #1e1033; font-size: 18px; line-height: 1.6; }
    .subject { font-size: 26px; font-weight: 600; margin-bottom: 6px; }
    .label { color: #5b4785; display: inline-block; width: 70px; }
    iframe { flex: 1; border: 0; width: 100%; background: #fff; }
  </style></head><body><div class="card">
    <div class="head"><div class="subject">${escapeHtml(mail.subject)}</div>
      ${fromRow}
      <div><span class="label">To</span>${escapeHtml(mail.to)}</div></div>
    <iframe srcdoc="${escapeHtml(mail.html)}"></iframe>
  </div></body></html>`;
}

async function fillGuestForm(page: Page, ctx: VideoSceneContext): Promise<void> {
  await ctx.tools.type(page.getByRole("textbox", { name: "Name" }), GUEST_NAME);
  await ctx.tools.click(page.getByRole("button", { name: "I'm in" }));
  const plusN = page.locator("#rsvp-plus-n");
  await plusN.fill("1");
  await ctx.tools.type(page.getByRole("textbox", { name: /Email/i }), GUEST_EMAIL);
  await ctx.tools.hold(500);
}

// Sends one more reply than the limit from a single address and returns the real status codes.
async function replyPastRateLimit(
  ctx: VideoSceneContext,
  eventId: string,
): Promise<readonly { name: string; status: number }[]> {
  const { limit } = readRateLimit();
  if (RATE_LIMIT_GUESTS.length !== limit + 1) {
    throw new Error(`rate-limit demo needs ${limit + 1} guest names, has ${RATE_LIMIT_GUESTS.length}`);
  }
  const results: { name: string; status: number }[] = [];
  for (const name of RATE_LIMIT_GUESTS) {
    results.push({ name, status: await submitAnonymousRsvp(ctx, eventId, name, RATE_LIMIT_DEMO_IP) });
  }
  const allowed = results.slice(0, limit);
  const rejected = results[limit];
  if (!allowed.every((result) => result.status === HTTP_OK) || rejected?.status !== HTTP_TOO_MANY_REQUESTS) {
    throw new Error(`rate-limit demo: unexpected statuses ${results.map((r) => r.status).join(",")}`);
  }
  return results;
}

function rateLimitOutput(
  results: readonly { name: string; status: number }[],
): readonly StageOutputLine[] {
  return results.map(({ name, status }) => ({
    text: `${status} ${name}`,
    tone: status === HTTP_OK ? "dim" : "error",
  }));
}

function rateLimitCommand(ctx: VideoSceneContext): string {
  return `for guest in $(cat guests.txt); do curl -s -o /dev/null -w "%{http_code} $guest\\n" -H "content-type: application/json" -d "$(reply "$guest")" http://${tenantKeyOf(ctx)}.localhost:4173/api/write; done`;
}

// Fills the free plan's guest list with anonymous replies, each from its own address
// so the rate limit never interferes; stops at the first rejection, which must be the cap.
async function fillGuestListToCap(ctx: VideoSceneContext, eventId: string): Promise<void> {
  const maxGuests = TIER_MAX_GUESTS.free;
  if (maxGuests === null) throw new Error("the free plan has no guest limit to fill up");
  for (let index = 1; index <= maxGuests + 1; index += 1) {
    const status = await submitAnonymousRsvp(ctx, eventId, `Guest ${index}`, `198.51.100.${index}`);
    if (status === HTTP_OK) continue;
    if (status === HTTP_UNPROCESSABLE) return;
    throw new Error(`filling the guest list: unexpected status ${status} for guest ${index}`);
  }
  throw new Error(`the guest list did not hit its cap of ${maxGuests}`);
}

const storedGuestRowSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
});

function truncateCell(value: string | null): string {
  const text = value ?? "";
  return text.length > MAX_DB_CELL_CHARS ? `${text.slice(0, MAX_DB_CELL_CHARS)}…` : text;
}

// Same layout as psql's aligned output.
function psqlTable(columns: readonly string[], rows: readonly (readonly string[])[]): string[] {
  const widths = columns.map((column, index) =>
    Math.max(column.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const line = (cells: readonly string[]) =>
    ` ${cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join(" | ")}`;
  return [
    line(columns),
    widths.map((width) => "-".repeat(width + 2)).join("+"),
    ...rows.map(line),
    `(${rows.length} ${rows.length === 1 ? "row" : "rows"})`,
  ];
}

// The recorded server runs on an ephemeral kumiko_test_* database next to the dev one, so look
// for the database that holds the known RSVP and read the stored (encrypted) values from there.
async function storedGuestRows(rsvpId: string): Promise<string[]> {
  const adminUrl = new URL(process.env["DATABASE_URL"] ?? DEFAULT_DATABASE_URL);
  const admin = new SQL(adminUrl.toString());
  try {
    const databases = z
      .array(z.object({ datname: z.string() }))
      .parse(await admin`select datname from pg_database where datname like 'kumiko_test_%'`);
    for (const { datname } of databases) {
      const databaseUrl = new URL(adminUrl);
      databaseUrl.pathname = `/${datname}`;
      const database = new SQL(databaseUrl.toString());
      try {
        const rows = z.array(storedGuestRowSchema).parse(
          await database`select name, email from ${database(rsvpTable.tableName)} order by (id = ${rsvpId}) desc limit 3`,
        );
        const holdsKnownGuest =
          (await database`select 1 as found from ${database(rsvpTable.tableName)} where id = ${rsvpId}`).length > 0;
        if (!holdsKnownGuest) continue;
        return psqlTable(
          ["name", "email"],
          rows.map((row) => [truncateCell(row.name), truncateCell(row.email)]),
        );
      } catch {
        // A leftover test database without the table is simply not the recorded one.
        continue;
      } finally {
        await database.close();
      }
    }
    throw new Error(`no kumiko_test_* database holds RSVP ${rsvpId}`);
  } finally {
    await admin.close();
  }
}

export default defineVideo({
  voice: VOICE,
  playbackRate: 1.1,
  setup: async (page, ctx) => {
    const { tenant, host, identities } = await seedDemoHostTenant(ctx.seedTenant);
    ctx.presentIdentities(identities);
    const officer = await tenant.addUser([DATA_PROTECTION_OFFICER]);
    demoApis = { host: tenant.apiAs(host), dataProtectionOfficer: tenant.apiAs(officer) };
    await tenant.loginAs(page, host);
    ctx.state.set(TENANT_KEY_STATE, tenant.key);
    await page.goto(`${APEX_URL}/host/event-list`);
  },
  scenes: [
    {
      id: "intro",
      do: async (_page, ctx) => {
        await ctx.tools.stage(introCard());
        await ctx.tools.animate(ctx.speechMs);
      },
    },
    {
      id: "scaffold",
      do: async (_page, ctx) => {
        const stage = terminalStage({
          prompt: "~/code",
          fontSizePx: 22,
          commands: SCAFFOLD_COMMANDS,
        });
        await showStage(ctx, stage, ctx.speechMs);
      },
    },
    {
      id: "data-model",
      do: async (page, ctx) => {
        const codeFields = (p: Page) =>
          ["Starts at", "Location", "Guest limit"].map((label) => fieldWrapper(p, label));
        const preview = await appPreview(page, ctx, {
          url: `${APEX_URL}/host/event-edit`,
          addedByCode: codeFields,
          highlights: codeFields,
          cards: [
            {
              title: "Field → form",
              lines: [
                "required: true → red star",
                "createTimestampField → date + time",
                "createNumberField → number input",
              ],
            },
            {
              title: "Also from this entity",
              lines: ["Postgres table", "Write + read API", "Event history"],
            },
          ],
        });
        const event = editorStage({
          fileName: `${FEATURE_DIR}/schema/event.ts`,
          firstLineNumber: 15,
          fontSizePx: 18,
          preview,
          lines: fileLines(
            `${FEATURE_DIR}/schema/event.ts`,
            15,
            41,
            [31, 32, 39],
            "export const eventEntity",
          ),
        });
        await showStage(ctx, event, ctx.speechMs);
      },
    },
    {
      id: "create-event",
      do: async (page, ctx) => {
        await page.goto(`${APEX_URL}/host/event-list`);
        await ctx.tools.hold(800);
        await page.goto(`${APEX_URL}/host/event-edit`);
        await expect(page.getByRole("textbox", { name: /Title/i })).toBeVisible();
        await ctx.tools.type(page.getByRole("textbox", { name: /Title/i }), "Rooftop Launch");
        await ctx.tools.type(page.getByRole("textbox", { name: /Slug/i }), EVENT_SLUG);
        await ctx.tools.type(
          page.getByRole("textbox", { name: /Starts at/i }),
          eventDateInThirtyDays(),
        );
        await ctx.tools.type(page.getByRole("textbox", { name: "Time" }), "1900");
        await ctx.tools.type(page.getByRole("textbox", { name: /Location/i }), "Sky Lounge");
        await ctx.tools.type(page.getByLabel("Guest limit"), "80");
        await ctx.tools.type(
          page.getByRole("textbox", { name: /Description/i }),
          "Drinks and music on the roof.",
        );
        await ctx.tools.click(page.getByRole("button", { name: /Create|Save/i }));
        await expect(page).toHaveURL(/\/host\/event-list/);
        const row = page.getByRole("row", { name: /Rooftop Launch/ });
        await expect(row).toBeVisible();
        ctx.state.set(EVENT_ID_STATE, await firstEventId());
        await ctx.tools.focus(row);
        await ctx.tools.hold(1500);
      },
    },
    {
      id: "screens",
      do: async (page, ctx) => {
        const preview = await appPreview(page, ctx, {
          url: `${APEX_URL}/host/event-list`,
          addedByCode: (p) => columnCells(p, "Guest limit"),
          highlights: (p) => [
            p.getByRole("columnheader", { name: /Guest limit/ }),
            p
              .getByRole("row", { name: /Rooftop Launch/ })
              .getByRole("cell", { name: "80", exact: true }),
          ],
        });
        const stage = editorStage({
          fileName: `${FEATURE_DIR}/register/screens.ts`,
          firstLineNumber: 9,
          fontSizePx: 18,
          preview,
          lines: fileLines(
            `${FEATURE_DIR}/register/screens.ts`,
            9,
            19,
            [13],
            "export const eventListScreen",
          ),
        });
        await showStage(ctx, stage, ctx.speechMs);
      },
    },
    {
      id: "theming",
      do: async (page, ctx) => {
        const url = `${APEX_URL}/host/event-edit`;
        const createButton = (p: Page) => p.getByRole("button", { name: /Create|Save/i });
        // Light violet is hard to tell from the neutral default; dark mode shows the switch clearly.
        // The class is not persisted, so the next scene's navigation is light again.
        const showDarkMode = async (p: Page) => {
          await expect(createButton(p)).toBeVisible();
          await p.evaluate(() => document.documentElement.classList.add("dark"));
        };
        const beforeImageUrl = await snapshotOf(page, ctx, {
          url,
          prepare: async (p) => {
            await showDarkMode(p);
            await resetThemeTokensToRendererDefaults(p);
          },
        });
        const preview = await appPreview(page, ctx, {
          url,
          beforeImageUrl,
          prepare: showDarkMode,
          highlights: (p) => [p.locator('[data-slot="sidebar-container"]')],
        });
        const stage = editorStage({
          fileName: THEME_FILE,
          firstLineNumber: 3,
          fontSizePx: 18,
          preview,
          lines: fileLines(THEME_FILE, 3, 10, themeTokenLineNumbers(), "export const showPonyTheme"),
        });
        await showStage(ctx, stage, ctx.speechMs);
      },
    },
    {
      id: "anonymous-rsvp",
      do: async (page, ctx) => {
        const file = `${FEATURE_DIR}/handlers/rsvp-submit.write.ts`;
        const preview = await appPreview(page, ctx, {
          url: guestUrl(ctx),
          addedByCode: (p) => [
            p.locator("section").filter({ has: p.getByRole("heading", { name: "RSVP", exact: true }) }),
          ],
          highlights: (p) => [p.locator("form").first()],
          cards: [
            { title: "Public, no login", lines: ["roles: access.anonymous"] },
            { title: "Rate limited", lines: [rateLimitCardLine()] },
            { title: "Host from the link", lines: [`${tenantKeyOf(ctx)}.localhost → this host`] },
          ],
        });
        const stage = editorStage({
          fileName: file,
          firstLineNumber: 19,
          fontSizePx: 18,
          preview,
          lines: fileLines(file, 19, 26, [22, 23], "const rsvpSubmitBase"),
        });
        await showStage(ctx, stage, ctx.speechMs);
      },
    },
    {
      id: "invite-branding",
      do: async (page, ctx) => {
        const inviteHeading = page.getByRole("heading", { name: /Rooftop Launch/i });
        await page.goto(guestUrl(ctx));
        await expect(inviteHeading).toBeVisible();
        await ctx.tools.hold(1500);

        await page.goto(`${APEX_URL}/host/event-list`);
        const brandingLink = page.getByRole("link", { name: /Invite branding/i });
        if (!(await brandingLink.isVisible())) {
          await ctx.tools.click(page.getByText("Appearance", { exact: true }));
        }
        await ctx.tools.click(brandingLink);
        await expect(page.getByRole("textbox", { name: /Accent color/i })).toBeVisible();
        await ctx.tools.type(page.getByRole("textbox", { name: /Accent color/i }), BRANDING_ACCENT);
        await ctx.tools.type(
          page.getByRole("textbox", { name: /Hero image URL/i }),
          BRANDING_HERO_IMAGE,
        );
        await ctx.tools.click(page.getByRole("radio", { name: /Split/i }));
        await ctx.tools.click(page.getByRole("button", { name: /Save changes/i }));
        await expect(page.getByText("No unsaved changes")).toBeVisible();

        await page.goto(guestUrl(ctx));
        await expect(inviteHeading).toBeVisible();
        await ctx.tools.focus(page.locator("header.sp-hero-split"));
        await ctx.tools.hold(1500);
      },
    },
    {
      id: "guest-rsvp",
      do: async (page, ctx) => {
        await page.goto(guestUrl(ctx));
        await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
        await ctx.tools.hold(800);
        await fillGuestForm(page, ctx);
        await ctx.tools.click(page.getByRole("button", { name: "Send RSVP" }));
        await expect(page.getByText(/Thanks, Ava Chen/)).toBeVisible();
        await ctx.tools.hold(1500);
      },
    },
    {
      id: "guest-list",
      do: async (page, ctx) => {
        await page.goto(`${APEX_URL}/host/rsvp-list`);
        const row = page.getByRole("row", { name: /Ava Chen/ });
        await expect(row).toBeVisible();
        ctx.state.set(AVA_RSVP_ID_STATE, await rsvpIdOf(GUEST_NAME));
        await ctx.tools.focus(row);
        await ctx.tools.hold(1500);
      },
    },
    {
      id: "mail-calendar",
      do: async (page, ctx) => {
        const mail = await mailCapture(page.request, GUEST_EMAIL);
        await ctx.tools.stage(mailCardHtml(mail));
        await ctx.tools.animate(Math.round(ctx.speechMs / 2));
        await page.goto(guestUrl(ctx));
        await ctx.tools.focus(page.getByRole("link", { name: /Add to calendar/i }));
        await ctx.tools.hold(1500);
      },
    },
    {
      id: "rate-limit",
      do: async (page, ctx) => {
        const listUrl = `${APEX_URL}/host/rsvp-list`;
        const beforeImageUrl = await snapshotOf(page, ctx, {
          url: listUrl,
          prepare: async (p) => {
            await expect(p.getByRole("row", { name: /Ava Chen/ })).toBeVisible();
          },
        });
        const results = await replyPastRateLimit(ctx, stateString(ctx.state, EVENT_ID_STATE));
        const preview = await appPreview(page, ctx, {
          url: listUrl,
          beforeImageUrl,
          prepare: async (p) => {
            await expect(p.getByRole("row", { name: /Emma Kowalski/ })).toBeVisible();
          },
        });
        const stage = terminalStage({
          prompt: "~/code/show-pony",
          fontSizePx: 18,
          preview,
          commands: [
            {
              command: rateLimitCommand(ctx),
              busyMs: 600,
              output: rateLimitOutput(results),
            },
          ],
        });
        await showStage(ctx, stage, ctx.speechMs);
      },
    },
    {
      id: "search",
      do: async (page, ctx) => {
        const file = `${FEATURE_DIR}/schema/rsvp.ts`;
        const listUrl = `${APEX_URL}/host/rsvp-list`;
        const searchInput = (p: Page) => p.getByPlaceholder("Search…", { exact: true });
        // Before: the unfiltered list without the search box the typed code adds.
        const beforeImageUrl = await snapshotOf(page, ctx, {
          url: listUrl,
          // The parent holds the input together with its search icon.
          addedByCode: (p) => [searchInput(p).locator("..")],
        });
        const preview = await appPreview(page, ctx, {
          url: listUrl,
          beforeImageUrl,
          highlights: (p) => [p.getByRole("row", { name: /Emma Kowalski/ })],
          prepare: async (p) => {
            await searchInput(p).fill("kowalsky");
            await expect(p.getByRole("row", { name: /Emma Kowalski/ })).toBeVisible();
            await expect(p.getByRole("row", { name: /Ava Chen/ })).toBeHidden();
          },
        });
        const stage = editorStage({
          fileName: file,
          firstLineNumber: 32,
          fontSizePx: 18,
          preview,
          lines: fileLines(file, 32, 36, [35], "name:"),
        });
        await showStage(ctx, stage, ctx.speechMs);
      },
    },
    {
      id: "personal-data",
      do: async (page, ctx) => {
        const avaId = stateString(ctx.state, AVA_RSVP_ID_STATE);
        const avaRow = (p: Page) => p.getByRole("row", { name: /Ava Chen/ });
        const storedPreview = await appPreview(page, ctx, {
          url: `${APEX_URL}/host/rsvp-list`,
          highlights: (p) => [avaRow(p)],
        });
        const stored = terminalStage({
          prompt: "~/code/show-pony",
          fontSizePx: 18,
          preview: storedPreview,
          commands: [
            {
              command: `psql "$DATABASE_URL" -c "select name, email from ${rsvpTable.tableName} limit 3"`,
              busyMs: 500,
              output: await storedGuestRows(avaId),
            },
          ],
        });

        const reply = await apis().dataProtectionOfficer.writeOk(FORGET_SUBJECT, {
          subject: { kind: "user", userId: avaId },
          reason: "Erasure request from the guest",
        });
        const erasedPreview = await appPreview(page, ctx, {
          url: `${APEX_URL}/host/rsvp-list`,
          beforeImageUrl: storedPreview.imageUrl,
          // The renderer shows erased PII as a localized "Deleted", not the raw sentinel.
          highlights: (p) => [
            p.getByRole("row").filter({ has: p.getByRole("cell", { name: "Deleted", exact: true }) }),
          ],
        });
        const forgetBody = {
          type: FORGET_SUBJECT,
          payload: {
            subject: { kind: "user", userId: `${avaId.slice(0, 8)}…` },
            reason: "Erasure request",
          },
        };
        const erased = terminalStage({
          prompt: "~/code/show-pony",
          fontSizePx: 18,
          preview: erasedPreview,
          commands: [
            {
              command: `curl -s -b officer.cookies -H "content-type: application/json" -d '${JSON.stringify(forgetBody)}' ${TERMINAL_ORIGIN}/api/write`,
              busyMs: 500,
              output: [{ text: JSON.stringify(reply).slice(0, 120), tone: "success" }],
            },
          ],
        });
        await showStages(ctx, [stored, erased]);
      },
    },
    {
      id: "plans",
      do: async (page, ctx) => {
        const preview = await appPreview(page, ctx, {
          url: `${APEX_URL}/host/billing`,
          highlights: (p) => [p.getByTestId("showpony-usage-panel")],
          cards: [
            {
              title: "Limits without extra code",
              lines: [
                tierCardLine("Free", "free"),
                tierCardLine("Pro", "pro"),
                tierCardLine("Studio", "studio"),
              ],
            },
          ],
        });
        const stage = editorStage({
          fileName: `${FEATURE_DIR}/tier-map.ts`,
          firstLineNumber: 29,
          fontSizePx: 18,
          lines: fileLines(
            `${FEATURE_DIR}/tier-map.ts`,
            29,
            46,
            [],
            "export const SHOWPONY_TIER_MAP",
          ),
          preview,
        });
        await fillGuestListToCap(ctx, stateString(ctx.state, EVENT_ID_STATE));
        await showStage(ctx, stage, Math.max(stage.durationMs, ctx.speechMs - PLANS_LIVE_PART_MS));
        await page.goto(guestUrl(ctx));
        await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
        await ctx.tools.type(page.getByRole("textbox", { name: "Name" }), "Sam Taylor");
        await ctx.tools.click(page.getByRole("button", { name: "I'm in" }));
        await ctx.tools.click(page.getByRole("button", { name: "Send RSVP" }));
        const refusal = page.getByText("The guest list is full.");
        await expect(refusal).toBeVisible();
        await ctx.tools.focus(refusal);
        await ctx.tools.hold(1500);
      },
    },
    {
      id: "outro",
      do: async (_page, ctx) => {
        await ctx.tools.stage(outroCard());
        await ctx.tools.animate(ctx.speechMs);
      },
    },
  ],
});
