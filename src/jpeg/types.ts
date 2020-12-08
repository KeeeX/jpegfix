/**
 * A sequence to look for in a file
 */
export interface Marker {
  /**
   * JPEG header's second byte
   */
  byte: number
  /**
   * true if the marker have variable size payload defined in the next uint16
   * false if no payload
   * a numeric value for fixed size payload
   */
  size: boolean,
  /**
   * Set to true if it is normal to not find another field after this one
   */
  noFollowup?: boolean,
}

/**
 * Position and size (if applicable) of a field
 */
export interface FieldDefinition {
  /**
   * Start position in the buffer
   */
  position: number,
  /**
   * Position of the marker first byte
   */
  markerPosition: number,
  /**
   * Size of the detected field (if applicable)
   */
  size?: number,
  /**
   * If the field is immediately followed by another field (unless noFollowup is set)
   */
  full?: boolean,
}

export interface JPEGAnalyzis {
  haveStartOfFile: boolean,
  haveEndOfFile: boolean,
  thumbnailStart?: number,
  thumbnailEnd?: number,
  imageDataStart?: number,
  imageDataEnd?: number,
  thumbnailAnalyzis?: JPEGAnalyzis,
}
