import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { object } from "../../shared/validation";
import { sha256, solverPin } from "./build-inputs";

export function checkLicenses(): void {
  const inventory = object(JSON.parse(readFileSync("solver/pen/licenses.json", "utf8")));
  assert.equal(inventory.upstreamSha, solverPin.commit);
  assert.equal(inventory.noticeSha256, sha256(readFileSync("solver/pen/THIRD-PARTY-NOTICES.txt")));
  assert.equal(
    inventory.rustLibraryNoticeSha256,
    sha256(readFileSync("solver/pen/RUST-LIBRARY-COPYRIGHT.html")),
  );
  assert.ok(Array.isArray(inventory.packages));
  const expected = inventory.packages
    .map((value: unknown) => {
      const entry = object(value);
      assert.equal(typeof entry.license, "string");
      return `${String(entry.name)}@${String(entry.version)}:${String(entry.checksum)}`;
    })
    .sort();
  const lock = readFileSync("solver/pen/Cargo.lock", "utf8");
  const actual = lock
    .split("[[package]]")
    .filter((entry) => entry.includes("registry+"))
    .map((entry) => {
      const field = (name: string) => entry.match(new RegExp(`^${name} = "([^"]+)"`, "m"))?.[1];
      return `${field("name")}@${field("version")}:${field("checksum")}`;
    })
    .sort();
  assert.deepEqual(actual, expected, "Dependency graph and shipped license inventory differ.");
}
