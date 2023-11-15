import * as fs from "node:fs";
import * as path from "node:path";
import {fileURLToPath} from "node:url";
import {ArgumentParser} from "argparse";
import {rebuildJpeg} from "../services/jpeg.js";

const selfPath = path.dirname(fileURLToPath(import.meta.url));

/** Read version from package.json */
const getVersion = (): string => {
  const pkg = fs.readFileSync(path.join(selfPath, "..", "..", "package.json"), "utf8");
  const pkgJson = JSON.parse(pkg) as Record<string, string>;
  return pkgJson.version;
};

/** Settings from CLI */
interface CLIArgs {
  input?: string;
  output?: string;
}

/** Retrieve settings from CLI */
const getArgs = (): CLIArgs => {
  const parser = new ArgumentParser({
    description: "Recovery tool for broken JPEG files",
    // eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
    add_help: true,
    prog: "jpegfix",
    epilog: "ⓒ Copyright 2023 KeeeX SAS",
  });
  parser.add_argument("-v", "--version", {action: "version", version: getVersion()});
  parser.add_argument(
    "-i",
    "--input",
    {
      action: "store",
      help: "Input file. Defaults to \"-\" meaning standard input.",
    },
  );
  parser.add_argument(
    "-o",
    "--output",
    {
      action: "store",
      help: "Output file. Defaults to the original basename + \".orig\", or \"-\" for standard output.",
    },
  );
  return parser.parse_args() as CLIArgs;
};

const STREAM = "-";

/** Retrieve input */
const getInputBuffer = (input: string): Uint8Array => {
  if (input === STREAM) return fs.readFileSync(process.stdin.fd);
  return fs.readFileSync(input);
};

/** STDOUT file descriptor */
const STDOUT = 1;

/** Save output */
const writeOutputBuffer = (output: string, buffer: Uint8Array): void => {
  if (output === STREAM) {
    fs.writeFileSync(STDOUT, buffer);
  } else {
    fs.writeFileSync(output, buffer);
  }
};

/** Sanitize input name */
const computeInputName = (input?: string): string => input ?? STREAM;

/** Sanitize output name */
const computeOutputName = (inputName: string, output?: string): string => {
  if (output !== undefined) return output;
  if (inputName === STREAM) return STREAM;
  const ext = path.extname(inputName);
  const dir = path.dirname(inputName);
  const base = path.basename(inputName, ext);
  return path.join(dir, `${base}.orig${ext}`);
};

const main = () => {
  const args = getArgs();
  const inputName = computeInputName(args.input);
  const outputName = computeOutputName(inputName, args.output);
  const inputBuffer = getInputBuffer(inputName);
  const outBuffer = rebuildJpeg(inputBuffer);
  if (!outBuffer) throw new Error("Could not recover input file");
  writeOutputBuffer(outputName, outBuffer);
};

main();
