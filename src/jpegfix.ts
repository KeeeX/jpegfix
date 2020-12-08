import {ArgumentParser} from "argparse";
import {rebuildJpeg} from "./index";
import {readFileSync, writeFileSync} from "fs";
import {join, dirname, basename, extname} from "path";

/**
 * Read version from package.json
 */
const getVersion = (): string => {
  const pkg = readFileSync(join(__dirname, "..", "package.json"), "utf8");
  const pkgJson = JSON.parse(pkg) as Record<string, string>;
  return pkgJson.version;
};

/**
 * Settings from CLI
 */
interface CLIArgs {
  input?: string,
  output?: string,
}

/**
 * Retrieve settings from CLI
 */
const getArgs = (): CLIArgs => {
  const parser = new ArgumentParser({
    description: "Recovery tool for broken JPEG files",
    // eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
    add_help: true,
    prog: "jpegfix",
    epilog: "ⓒ Copyright 2020 KeeeX SAS",
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

/**
 * Retrieve input
 */
const getInputBuffer = (input: string): Uint8Array => {
  if (input === STREAM) {
    return readFileSync(process.stdin.fd);
  }
  return readFileSync(input);
};

/**
 * Save output
 */
const writeOutputBuffer = (output: string, buffer: Uint8Array): void => {
  const STDOUT = 1;
  if (output === STREAM) {
    writeFileSync(STDOUT, buffer);
  } else {
    writeFileSync(output, buffer);
  }
};

/**
 * Sanitize input name
 */
const computeInputName = (input?: string): string => input ?? STREAM;

/**
 * Sanitize output name
 */
const computeOutputName = (inputName: string, output?: string): string => {
  if (output !== undefined) {
    return output;
  }
  if (inputName === STREAM) {
    return STREAM;
  }
  const ext = extname(inputName);
  const dir = dirname(inputName);
  const base = basename(inputName, ext);
  return join(dir, `${base}.orig${ext}`);
};

const main = () => {
  const args = getArgs();
  const inputName = computeInputName(args.input);
  const outputName = computeOutputName(inputName, args.output);
  const inputBuffer = getInputBuffer(inputName);
  const outBuffer = rebuildJpeg(inputBuffer);
  if (!outBuffer) {
    throw new Error("Could not recover input file");
  }
  writeOutputBuffer(outputName, outBuffer);
};

main();
