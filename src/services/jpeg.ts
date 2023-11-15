import {
  markers,
  markerSize,
  markerStart,
} from "./consts.js";
import {
  findField,
  findLastField,
} from "./fields.js";
import {
  JPEGAnalyzis,
  JPEGBoundaries,
} from "./types.js";

/** Basis for detection of JPEG content, including thumbnail */
const getRawJpegBoundaries = (
  buffer: Uint8Array,
  startOffset?: number,
  endOffset?: number,
): JPEGBoundaries | undefined => {
  const subBuffer = buffer.slice(startOffset, endOffset);
  const startSection = findField(subBuffer, markers.soi);
  const endSection = findField(subBuffer, markers.eoi, startSection?.position);
  if (!startSection || !endSection) return;
  const start = startSection.markerPosition;
  const end = endSection.position;
  const bundled = getRawJpegBoundaries(subBuffer, start + markerSize, end - markerSize);
  return {start, end, bundled};
};

/** Try to find something in a really broken JPEG */
const getWithoutFullBoundaries = (buffer: Uint8Array): JPEGBoundaries => {
  // Worst case: no single full start/stop section
  // Check if there's an EOI somewhere that is followed by potential image data in case of a
  // really broken thumbnail
  const candidateEOI = findField(buffer, markers.eoi);
  if (candidateEOI) {
    // There is an EOI, is it followed by anything useful?
    const candidateDQT = findField(buffer, markers.dqt, candidateEOI.position);
    if (candidateDQT) {
      // Let's roll with that
      return {
        start: candidateEOI.position,
        end: buffer.length,
        bundled: {start: 0, end: candidateEOI.position},
      };
    }
    // There is an EOI followed by garbage, try before, there might be a usable thumbnail
    return {start: 0, end: candidateEOI.position};
  }
  // No EOI, try to grab the last "plausible" DQT entries and start with them
  let previousCursor = findLastField(buffer, markers.dqt);
  // Nothing to find here
  if (!previousCursor) return {start: 0, end: buffer.length};
  let safety = 100;
  do {
    const cursor = findLastField(buffer.slice(0, previousCursor.markerPosition), markers.dqt);
    if (!cursor) break;
    if (cursor.position + (cursor.size ?? 1) !== previousCursor.markerPosition) break;
    previousCursor = cursor;
  } while (--safety);
  // Hopefully we got the "right" DQT
  return {start: previousCursor.markerPosition, end: buffer.length};
};

/** Make sure there isn't a reasonable-looking jpeg outside of the detected boundaries */
const getWithPossibleThumbnail = (
  buffer: Uint8Array,
  boundaries: JPEGBoundaries,
): JPEGBoundaries => {
  const candidateDQT = findField(buffer, markers.dqt, boundaries.end);
  const candidateSOS = findField(buffer, markers.sos, boundaries.end);
  if (candidateDQT && candidateSOS) {
    // There's something after the end, so it might be a thumbnail after all
    return {
      start: boundaries.end,
      end: buffer.length,
      bundled: {start: boundaries.start, end: boundaries.end},
    };
  }
  return boundaries;
};

/** Detect the actually expected boundaries of JPEG, including broken start/stop*/
const getJpegBoundaries = (buffer: Uint8Array): JPEGBoundaries => {
  const fullBoundaries = getRawJpegBoundaries(buffer);
  // Borked
  if (!fullBoundaries) return getWithoutFullBoundaries(buffer);
  // There's a probable thumbnail, just use that
  if (fullBoundaries.bundled) return fullBoundaries;
  if (fullBoundaries.start === 0 && fullBoundaries.end === buffer.length) return fullBoundaries;
  // Either there's no thumbnail and weird noise before/after the file, or a thumbnail with missing
  // soi/eoi
  return getWithPossibleThumbnail(buffer, fullBoundaries);
};

/**
 * Return the analysis of the JPEG buffer.
 *
 * @public
 */
export const analyzeJpeg = (buffer: Uint8Array): JPEGAnalyzis => {
  // First look for a full JPEG inside the buffer
  const boundaries = getJpegBoundaries(buffer);
  const imageRecoveryStart = boundaries.bundled ? boundaries.bundled.end : boundaries.start;
  const dqtField = findField(buffer, markers.dqt, imageRecoveryStart);
  const sosField = findField(buffer, markers.sos, dqtField?.position);
  const haveEndOfFile = (
    buffer[boundaries.end - 1] === markers.eoi.byte
    && buffer[boundaries.end - markerSize] === markerStart
  );
  return {
    haveStartOfFile: boundaries.start === 0,
    haveEndOfFile,
    thumbnailStart: boundaries.bundled?.start,
    thumbnailEnd: boundaries.bundled?.end,
    imageDataStart: dqtField?.markerPosition,
    imageStartOfScan: sosField?.markerPosition,
    imageDataEnd: boundaries.end - (haveEndOfFile ? markerSize : 0),
    thumbnailAnalyzis: boundaries.bundled
      ? analyzeJpeg(buffer.slice(boundaries.bundled.start, boundaries.bundled.end))
      : undefined,
  };
};

/**
 * If there seems to be enough data to get the image, do it.
 *
 * @public
 */
export const tryRecoverFullImageData = (
  buffer: Uint8Array,
  analyzis: JPEGAnalyzis,
): Uint8Array | undefined => {
  if (
    !analyzis.haveStartOfFile
    || !analyzis.haveEndOfFile
    || analyzis.imageDataStart === undefined
    || analyzis.imageDataEnd === undefined
  ) {
    return;
  }
  const outputSize = markerSize + (analyzis.imageDataEnd - analyzis.imageDataStart) + markerSize;
  const outputBuffer = new Uint8Array(outputSize);
  outputBuffer[0] = markerStart;
  outputBuffer[1] = markers.soi.byte;
  outputBuffer.set(
    buffer.slice(analyzis.imageDataStart, analyzis.imageDataEnd + markerSize),
    markerSize,
  );
  return outputBuffer;
};

/** Return the actual image data size, if any */
const getContentSize = (analyzis: JPEGAnalyzis): number | undefined => {
  if (analyzis.imageStartOfScan === undefined || analyzis.imageDataEnd === undefined) return;
  return analyzis.imageDataEnd - analyzis.imageStartOfScan;
};

/** Return the size of the thumbnail actual image data, if any */
const getThumbnailContentSize = (analyzis: JPEGAnalyzis): number | undefined => {
  if (!analyzis.thumbnailAnalyzis) return;
  return getContentSize(analyzis.thumbnailAnalyzis);
};

/**
 * Return the thumbnail content if it seems fine.
 *
 * @public
 */
export const tryRecoverFromThumbnail = (
  buffer: Uint8Array,
  useAnalyzis: JPEGAnalyzis,
): Uint8Array | undefined => {
  if (
    !useAnalyzis.thumbnailAnalyzis
    || useAnalyzis.thumbnailStart === undefined
    || useAnalyzis.thumbnailEnd === undefined
  ) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return rebuildJpeg(
    buffer.slice(useAnalyzis.thumbnailStart, useAnalyzis.thumbnailEnd),
    useAnalyzis.thumbnailAnalyzis,
  );
};

/** If it seems we're missing a short part at the end of the bytestream, recover that. */
const tryRecoverPartialImageData = (
  buffer: Uint8Array,
  analyzis: JPEGAnalyzis,
): Uint8Array | undefined => {
  if (
    analyzis.imageDataStart === undefined
    || analyzis.imageStartOfScan === undefined
    || analyzis.imageDataEnd === undefined
  ) {
    return;
  }
  const imageContentSize = getContentSize(analyzis);
  if (!imageContentSize) return;
  const thumbnailSize = getThumbnailContentSize(analyzis);
  if (thumbnailSize && thumbnailSize >= imageContentSize) {
    // Thumbnail seems to have more remnants than the actual data
    return tryRecoverFromThumbnail(buffer, analyzis);
  }
  const outputSize = markerSize + (analyzis.imageDataEnd - analyzis.imageDataStart) + markerSize;
  const outputBuffer = new Uint8Array(outputSize);
  outputBuffer[0] = markerStart;
  outputBuffer[1] = markers.soi.byte;
  outputBuffer.set(buffer.slice(analyzis.imageDataStart, analyzis.imageDataEnd), markerSize);
  outputBuffer[outputSize - markerSize] = markerStart;
  outputBuffer[outputSize - 1] = markers.eoi.byte;
  return outputBuffer;
};

/**
 * Try to rebuild a single JPEG image.
 *
 * @public
 */
export const rebuildJpeg = (
  buffer: Uint8Array,
  analyzis?: JPEGAnalyzis,
): Uint8Array | undefined => {
  const useAnalyzis = analyzis ? analyzis : analyzeJpeg(buffer);
  return tryRecoverFullImageData(buffer, useAnalyzis)
    ?? tryRecoverPartialImageData(buffer, useAnalyzis)
    ?? tryRecoverFromThumbnail(buffer, useAnalyzis);
};
