# @keeex/jpegfix
Recovery tool to retrieve picture data from damaged jpeg files.
Basic operation is looking through the file for the essential blocks and create a hopefully viable
output with the image content.

Metadata and other custom fields will be stripped.

## Usage
The CLI tool can be used to process individual images.
There is a built-in help, but the most useful command is:

You can either install it globally:

```bash
npm install -g @keeex/jpegfix
jpegfix -i <input file>
```

Run it from npx:

```bash
npx @keeex/jpegfix -i <input file>
```

Clone the repository and run it from there:

```bash
git clone git@github.com:KeeeX/jpegfix.git
cd jpegfix
npm ci
npm start -- -i <input file>
```

Run the CLI in TypeScript for debugging purpose (with cloned repository):

```bash
git clone git@github.com:KeeeX/jpegfix.git
cd jpegfix
npm ci
./devrun.sh -i <input file>
```

Or use it as a library (see below).

The CLI command will automatically use `<basename input file>.orig.jpg` as the output.

## Behavior
This tool tries to retrieve only the visual data and explicitely kills any "extra" sections besides
these.

To avoid malformed metadata actually containing a thumbnail in JPEG form, the algorithm first look
for a plausible JPEG file inside the JPEG file, and excludes this area when searching actual picture
data.
Best case scenario, the expected fields can be detected and the original visual can be retrieved.
The following outlines the "degraded" recovery modes that this program will recover:

- stripping any non-essential fields
- missing beginning of file
- missing end of file
- broken thumbnail messing with detection
- fallback to the thumbnail if the original data is irrecoverable and a thumbnail exists, with same
  process

In particular, no attempt is done to save the extra metadata (EXIF/JFIF).

## Library usage

The library exposes two main functions, one to analyze a file and one to rebuild a JPEG.

Here's a short example:

```JavaScript
import {analyzeJpeg, rebuildJpeg} from "@keeex/jpegfix";
import {readFileSync} from "fs";

const buffer = readFileSync("somefile.jpg");
const analyze = analyzeJpeg(buffer);
const rebuiltImage = rebuildJpeg(buffer);
```

Some more advanced functions can be called to customize the process, but that should not be
necessary.
