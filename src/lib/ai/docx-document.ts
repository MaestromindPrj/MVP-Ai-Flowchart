import mammoth from "mammoth";
import { AIImageInput } from "./types";
import { parseImageInput } from "./image-input";
import { AIServiceError } from "./validation";

export async function readDOCXDocument(buffer: Buffer): Promise<{ text: string; images: AIImageInput[] }> {
  const text = (await mammoth.extractRawText({ buffer })).value.trim();
  if (text.length > 20000) throw new AIServiceError("Document exceeds 20,000 characters. Upload a shorter section.", 413);
  const images: AIImageInput[] = [];
  let imageCount = 0;
  // HTML is used only to visit embedded images. It is never rendered or sent to AI.
  const result = await mammoth.convertToHtml({ buffer }, {
    externalFileAccess: false,
    includeEmbeddedStyleMap: false,
    convertImage: mammoth.images.imgElement(async image => {
      const index = imageCount++;
      if (index >= 2) throw new AIServiceError("This Word document contains more than two images. Split it into sections with at most two images each.", 413);
      if (!["image/png", "image/jpeg", "image/webp"].includes(image.contentType)) {
        throw new AIServiceError("This Word document contains an unsupported image. Convert embedded images to PNG, JPEG, or WebP and try again.", 422);
      }
      // Attach rejection handlers immediately to Mammoth's Bluebird promise.
      const encoded = await new Promise<string>((resolve, reject) => image.readAsBase64String().then(resolve, reject));
      const dataUrl = `data:${image.contentType};base64,${encoded}`;
      images[index] = parseImageInput({ name: `Document image ${index + 1}`, dataUrl })!;
      return { src: `document-image-${index + 1}` };
    }),
  });
  // Mammoth recovers from converter errors; do not silently drop a diagram.
  const failure = result.messages.find(message => message.type === "error");
  if (failure?.type === "error") {
    if (failure.error instanceof AIServiceError) throw failure.error;
    throw new AIServiceError("An embedded Word image could not be read. Re-export the document with embedded PNG or JPEG images.", 422);
  }
  return { text, images };
}
