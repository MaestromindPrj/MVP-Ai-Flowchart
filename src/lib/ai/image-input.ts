import { AIImageInput } from "./types";
import { AIServiceError } from "./validation";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function parseImageInput(value: unknown): AIImageInput | undefined {
  if (value === undefined) return undefined;
  const image = value as AIImageInput | null;
  if (!image || typeof image.name !== "string" || !image.name.trim() || image.name.length > 255 || typeof image.dataUrl !== "string") {
    throw new AIServiceError("Invalid image attachment.", 400);
  }
  if (image.dataUrl.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 32) throw new AIServiceError("Maximum image size is 3 MB.", 413);
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.dataUrl);
  if (!match) throw new AIServiceError("Attach a PNG, JPEG, or WebP image.", 400);
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.toString("base64") !== match[2]) throw new AIServiceError("Invalid image encoding.", 400);
  if (bytes.length > MAX_IMAGE_BYTES) throw new AIServiceError("Maximum image size is 3 MB.", 413);
  const valid = match[1] === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : match[1] === "jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new AIServiceError("The file does not match its image format.", 400);
  return { name: image.name.trim(), dataUrl: image.dataUrl };
}

export function parseImageInputs(value: unknown, legacyImage?: unknown): AIImageInput[] {
  if (value !== undefined && legacyImage !== undefined) throw new AIServiceError("Use images or image, not both.", 400);
  if (value === undefined) return legacyImage === undefined ? [] : [parseImageInput(legacyImage)!];
  if (!Array.isArray(value) || value.length > 2) throw new AIServiceError("Attach at most two images.", 400);
  return value.map(item => {
    const image = parseImageInput(item);
    if (!image) throw new AIServiceError("Invalid image attachment.", 400);
    return image;
  });
}
