export interface JPEGTestFile {
  source: string;
  expected: string;
}

export const testFiles: Array<JPEGTestFile> = [
  {
    source: "broken_brokenthumbnail",
    expected: "fixed_brokenthumbnail",
  },
  {
    source: "broken_end",
    expected: "fixed_end",
  },
  {
    source: "broken_favorfull",
    expected: "fixed_favorfull",
  },
  {
    source: "broken_favorthumb",
    expected: "thumbnail_truncated",
  },
  {
    source: "broken_missing",
    expected: "fixed_missing",
  },
  {
    source: "broken_missingend",
    expected: "fixed_missingend",
  },
  {
    source: "broken_onlythumbnail",
    expected: "thumbnail_truncated",
  },
  {
    source: "broken_start",
    expected: "full_truncated",
  },
  {
    source: "broken_reallybroken",
    expected: "full_truncated",
  },
  {
    source: "broken_onlydqt",
    expected: "full_truncated",
  },
];
