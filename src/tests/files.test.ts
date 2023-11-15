import assert from "node:assert";
import {join, dirname} from "node:path";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {rebuildJpeg} from "../services/jpeg.js";
import {testFiles as fixtures} from "./fixtures.js";

const selfPath = dirname(fileURLToPath(import.meta.url));

const getFilePath = (name: string): string => join(
  selfPath,
  "..",
  "..",
  "res",
  "tests",
  `${name}.jpg`,
);

const testFixture = (
  source: string,
  expected: string,
) => {
  const sourcePath = getFilePath(source);
  const expectedPath = getFilePath(expected);
  const sourceBuffer = readFileSync(sourcePath);
  const expectedBuffer = readFileSync(expectedPath);
  const rebuilt = rebuildJpeg(sourceBuffer);
  if (!rebuilt) {
    assert.fail();
  }
  assert.deepStrictEqual(
    new Uint8Array(rebuilt),
    new Uint8Array(expectedBuffer),
  );
};

const testFiles = () => {
  fixtures.forEach(({source, expected}) => {
    it(`Fixing "${source}"`, () => testFixture(source, expected));
  });
};

describe("Checking expected behavior on test files", testFiles);
