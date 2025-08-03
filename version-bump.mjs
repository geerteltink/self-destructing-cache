import { readFileSync, writeFileSync } from "fs";
import process from "process";

const targetVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("./src/manifest.json", "utf8"));
manifest.version = targetVersion;
writeFileSync("./src/manifest.json", JSON.stringify(manifest, undefined, 2));
