import assert from "assert";
import {testFiles as fixtures} from "./fixtures";
import {join} from "path";
import {readFileSync} from "fs";
import {rebuildJpeg} from "../index";

const getFilePath = (name: string): string => join(
  __dirname,
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
