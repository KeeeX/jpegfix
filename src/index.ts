import {markers, markerSize, markerStart} from "./jpeg/consts";
import {findSection} from "./jpeg/fields";
import {JPEGAnalyzis} from "./jpeg/types";

/**
 * Return the analysis of the JPEG buffer
 */
export const analyzeJpeg = (
  buffer: Uint8Array,
): JPEGAnalyzis => {
  const fileStart = findSection(buffer, markers.soi);
  const haveStartOfFile = fileStart?.markerPosition === 0;
  const startForThumbnail = fileStart
    ? fileStart.position
    : 0;
  const thumbnailStart = findSection(buffer, markers.soi, startForThumbnail);
  const thumbnailEnd = thumbnailStart
    ? findSection(buffer, markers.eoi, thumbnailStart.position)
    : undefined;
  const startForImage = thumbnailEnd
    ? thumbnailEnd.position
    : startForThumbnail;
  const imageStart = findSection(buffer, markers.dqt, startForImage);
  const imageEnd = imageStart
    ? findSection(buffer, markers.eoi, imageStart.position)
    : undefined;
  const haveEndOfFile = imageEnd?.position === buffer.length;
  return {
    haveStartOfFile,
    haveEndOfFile,
    thumbnailStart: thumbnailStart?.markerPosition,
    thumbnailEnd: thumbnailEnd?.position,
    imageDataStart: imageStart?.markerPosition,
    imageDataEnd: imageEnd?.position ?? buffer.length,
    thumbnailAnalyzis: (thumbnailStart && thumbnailEnd)
      ? analyzeJpeg(buffer.slice(
        thumbnailStart.markerPosition,
        thumbnailEnd.position,
      ))
      : undefined,
  };
};

/**
 * Try to rebuild a single JPEG image
 */
export const rebuildJpeg = (
  buffer: Uint8Array,
  analyzis?: JPEGAnalyzis,
): Uint8Array | undefined => {
  const useAnalyzis = analyzis
    ? analyzis
    : analyzeJpeg(buffer);
  if (useAnalyzis.imageDataStart !== undefined && useAnalyzis.imageDataEnd !== undefined) {
    const outputSize = markerSize + (useAnalyzis.imageDataEnd - useAnalyzis.imageDataStart);
    const outputBuffer = new Uint8Array(outputSize);
    outputBuffer[0] = markerStart;
    outputBuffer[1] = markers.soi.byte;
    outputBuffer.set(
      buffer.slice(
        useAnalyzis.imageDataStart,
        useAnalyzis.imageDataEnd,
      ),
      markerSize,
    );
    return outputBuffer;
  }
  if (
    useAnalyzis.thumbnailAnalyzis
    && useAnalyzis.thumbnailStart !== undefined
    && useAnalyzis.thumbnailEnd !== undefined
  ) {
    return rebuildJpeg(
      buffer.slice(
        useAnalyzis.thumbnailStart,
        useAnalyzis.thumbnailEnd,
      ),
      useAnalyzis.thumbnailAnalyzis,
    );
  }
};
