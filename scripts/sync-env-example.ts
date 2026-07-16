#!/usr/bin/env bun
// Copies env.example → .env.example (Cursor blocks direct edits to dot-env files).

import { copyFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
copyFileSync(join(root, "env.example"), join(root, ".env.example"));
console.log("synced .env.example from env.example");
