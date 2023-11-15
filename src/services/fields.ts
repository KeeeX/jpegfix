import {
  FieldDefinition,
  Marker,
} from "./types.js";
import {
  markerStart,
  markerSize,
  fieldSizeBytesCount,
} from "./consts.js";

/**
 * Build the result of findSection()
 */
const buildFieldResult = (
  buffer: Uint8Array,
  marker: Marker,
  markerPosition: number,
): FieldDefinition => {
  const bufferStart = markerPosition + markerSize;
  let position;
  let size;
  if (marker.size) {
    const sizeHi = buffer[bufferStart];
    const sizeLo = buffer[bufferStart + 1];
    const BYTE_MAX = 256;
    size = (sizeHi * BYTE_MAX) + sizeLo - fieldSizeBytesCount;
    position = bufferStart + fieldSizeBytesCount;
  } else {
    position = bufferStart;
  }
  let full;
  if (size !== undefined && marker.noFollowup === true) {
    full = buffer[position + size] === markerStart;
  }
  return {
    markerPosition,
    position,
    size,
    full,
  };
};

/**
 * Detect a section in a buffer.
 */
export const findField = (
  buffer: Uint8Array,
  marker: Marker,
  startOffset?: number,
): FieldDefinition | undefined => {
  const maxCursorPos = buffer.length - markerSize;
  for (
    let i = startOffset ?? 0;
    i <= maxCursorPos;
    ++i
  ) {
    if (
      buffer[i] === markerStart
      && buffer[i + 1] === marker.byte
    ) {
      return buildFieldResult(
        buffer,
        marker,
        i,
      );
    }
  }
};

export const findLastField = (
  buffer: Uint8Array,
  marker: Marker,
  startOffset?: number,
): FieldDefinition | undefined => {
  const minCursorPos = startOffset ?? 0;
  const maxCursorPos = buffer.length - markerSize;
  for (
    let i = maxCursorPos;
    i >= minCursorPos;
    --i
  ) {
    if (
      buffer[i] === markerStart
      && buffer[i + 1] === marker.byte
    ) {
      return buildFieldResult(
        buffer,
        marker,
        i,
      );
    }
  }
};
