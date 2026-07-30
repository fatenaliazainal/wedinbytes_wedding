export const MAX_IMAGE_DIMENSION = 8_000;
export const MAX_IMAGE_PIXELS = 40_000_000;

export type SupportedImageMime =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

export type ImageDimensions = {
  width: number;
  height: number;
};

function dimensionsAreSafe(dimensions: ImageDimensions): ImageDimensions {
  if (
    !Number.isInteger(dimensions.width)
    || !Number.isInteger(dimensions.height)
    || dimensions.width <= 0
    || dimensions.height <= 0
    || dimensions.width > MAX_IMAGE_DIMENSION
    || dimensions.height > MAX_IMAGE_DIMENSION
    || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(
      `Image dimensions exceed the safe limit of ${MAX_IMAGE_DIMENSION}px per side and ${MAX_IMAGE_PIXELS} pixels.`,
    );
  }
  return dimensions;
}

function parsePng(buffer: Buffer): ImageDimensions {
  if (
    buffer.length < 24
    || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error("Invalid PNG image.");
  }
  return dimensionsAreSafe({
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  });
}

function parseGif(buffer: Buffer): ImageDimensions {
  if (
    buffer.length < 10
    || (buffer.toString("ascii", 0, 6) !== "GIF87a"
      && buffer.toString("ascii", 0, 6) !== "GIF89a")
  ) {
    throw new Error("Invalid GIF image.");
  }
  return dimensionsAreSafe({
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  });
}

function parseJpeg(buffer: Buffer): ImageDimensions {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Invalid JPEG image.");
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) break;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break;

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3)
      || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb)
      || (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame && offset + 7 < buffer.length) {
      return dimensionsAreSafe({
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      });
    }
    offset += segmentLength;
  }

  throw new Error("JPEG dimensions could not be verified.");
}

function parseWebp(buffer: Buffer): ImageDimensions {
  if (
    buffer.length < 30
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error("Invalid WebP image.");
  }

  const chunkType = buffer.toString("ascii", 12, 16);
  const chunkDataOffset = 20;
  if (chunkType === "VP8X" && buffer.length >= 30) {
    return dimensionsAreSafe({
      width: 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16),
      height: 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16),
    });
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    const frameStart = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), chunkDataOffset);
    if (frameStart >= 0 && frameStart + 7 < buffer.length) {
      return dimensionsAreSafe({
        width: buffer.readUInt16LE(frameStart + 3) & 0x3fff,
        height: buffer.readUInt16LE(frameStart + 5) & 0x3fff,
      });
    }
  }

  throw new Error("WebP dimensions could not be verified.");
}

export function inspectImage(
  buffer: Buffer,
  contentType: SupportedImageMime,
): ImageDimensions {
  if (!buffer.length) throw new Error("Image file is empty.");
  switch (contentType) {
    case "image/png": return parsePng(buffer);
    case "image/jpeg": return parseJpeg(buffer);
    case "image/gif": return parseGif(buffer);
    case "image/webp": return parseWebp(buffer);
    default: throw new Error("Unsupported image type.");
  }
}

export function hasPngAlphaChannel(buffer: Buffer): boolean {
  return buffer.length >= 26
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && buffer.toString("ascii", 12, 16) === "IHDR"
    && (buffer[25] === 4 || buffer[25] === 6);
}

export function isOwnedStorageKey(key: string | null | undefined, prefix: string): key is string {
  return Boolean(key && key.startsWith(`${prefix}/`) && !key.includes(".."));
}