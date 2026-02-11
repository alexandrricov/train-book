#!/usr/bin/env node

// Migration script for old trainbook exports that lack the "targets" field.
// Reads a JSON export, adds "targets": [] if missing, writes the updated file.
//
// Usage:
//   node scripts/migrate-export.js path/to/trainbook-items.json

const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/migrate-export.js <export-file.json>");
  process.exit(1);
}

const resolved = path.resolve(filePath);

let raw;
try {
  raw = fs.readFileSync(resolved, "utf-8");
} catch (err) {
  console.error(`Cannot read file: ${resolved}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  console.error("Invalid JSON");
  process.exit(1);
}

if (!data || data.schema !== "trainbook.v1") {
  console.error('Missing or wrong schema. Expected schema: "trainbook.v1"');
  process.exit(1);
}

let changed = false;

if (!Array.isArray(data.targets)) {
  data.targets = [];
  changed = true;
  console.log("Added empty targets array");
}

if (changed) {
  fs.writeFileSync(resolved, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Updated: ${resolved}`);
} else {
  console.log("File already has targets — no changes needed.");
}
