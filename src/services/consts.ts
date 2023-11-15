import {Marker} from "./types.js";

/**
 * First byte of all JPEG markers.
 *
 * @internal
 */
export const markerStart = 0xff;

/**
 * Length of the size of a field, if available.
 *
 * @internal
 */
export const fieldSizeBytesCount = 2;

/**
 * Size of a JPEG field marker.
 *
 * @internal
 */
export const markerSize = 2;

/**
 * List of common markers found in a JPEG file.
 *
 * @internal
 */
export const markers: Record<string, Marker> = {
  soi: {byte: 0xd8, size: false},
  sof0: {byte: 0xc0, size: true},
  sof2: {byte: 0xc2, size: true},
  dht: {byte: 0xc4, size: true},
  dqt: {byte: 0xdb, size: true},
  dri: {byte: 0xdd, size: true},
  sos: {byte: 0xda, size: false},
  rst0: {byte: 0xd0, size: false},
  rst1: {byte: 0xd1, size: false},
  rst2: {byte: 0xd2, size: false},
  rst3: {byte: 0xd3, size: false},
  rst4: {byte: 0xd4, size: false},
  rst5: {byte: 0xd5, size: false},
  rst6: {byte: 0xd6, size: false},
  rst7: {byte: 0xd7, size: false},
  app0: {byte: 0xe0, size: true},
  app1: {byte: 0xe1, size: true},
  app2: {byte: 0xe2, size: true},
  app3: {byte: 0xe3, size: true},
  app4: {byte: 0xe4, size: true},
  app5: {byte: 0xe5, size: true},
  app6: {byte: 0xe6, size: true},
  app7: {byte: 0xe7, size: true},
  app8: {byte: 0xe8, size: true},
  app9: {byte: 0xe9, size: true},
  appA: {byte: 0xea, size: true},
  appB: {byte: 0xeb, size: true},
  appC: {byte: 0xec, size: true},
  appD: {byte: 0xed, size: true},
  appE: {byte: 0xee, size: true},
  appF: {byte: 0xef, size: true},
  com: {byte: 0xfe, size: true},
  eoi: {byte: 0xd9, size: false, noFollowup: true},
};
