import assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import {fileURLToPath} from "node:url";
import * as jpegSrv from "../services/jpeg.js";
import {testFiles as fixtures} from "./fixtures.js";

const selfPath = path.dirname(fileURLToPath(import.meta.url));

const getFilePath = (name: string): string => path.join(
  selfPath,
  "..",
  "..",
  "res",
  "tests",
  `${name}.jpg`,
);

const testFixture = (source: string, expected: string) => {
  const sourcePath = getFilePath(source);
  const expectedPath = getFilePath(expected);
  const sourceBuffer = fs.readFileSync(sourcePath);
  const expectedBuffer = fs.readFileSync(expectedPath);
  const rebuilt = jpegSrv.rebuildJpeg(sourceBuffer);
  assert(rebuilt);
  assert.deepStrictEqual(new Uint8Array(rebuilt), new Uint8Array(expectedBuffer));
};

const testFiles = () => {
  fixtures.forEach(({source, expected}) => {
    it(`Fixing "${source}"`, () => testFixture(source, expected));
  });
};

describe("Checking expected behavior on test files", testFiles);
