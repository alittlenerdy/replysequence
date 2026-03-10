import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const IMAGE_DIR = 'public/blog/images';

export async function generateHeroImage(params: {
  title: string;
  tags: string[];
  slug: string;
  date: string;
}): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.log(JSON.stringify({ level: 'warn', message: 'GOOGLE_GENAI_API_KEY not set, skipping hero image' }));
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildImagePrompt(params.title, params.tags);
  const datePrefix = params.date.substring(0, 7); // YYYY-MM
  const relativePath = `${IMAGE_DIR}/${datePrefix}/${params.slug}.png`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: prompt,
      config: {
        responseModalities: ['image'],
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.log(JSON.stringify({ level: 'warn', message: 'No image parts in Gemini response' }));
      return null;
    }

    for (const part of parts) {
      if (part.inlineData?.data) {
        const absolutePath = join(process.cwd(), relativePath);
        mkdirSync(dirname(absolutePath), { recursive: true });
        writeFileSync(absolutePath, Buffer.from(part.inlineData.data, 'base64'));

        console.log(JSON.stringify({
          level: 'info',
          message: 'Hero image generated',
          path: relativePath,
        }));

        // Return the web-accessible path (strip "public" prefix)
        return `/blog/images/${datePrefix}/${params.slug}.png`;
      }
    }

    console.log(JSON.stringify({ level: 'warn', message: 'Gemini response contained no image data' }));
    return null;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Hero image generation failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}

function buildImagePrompt(title: string, tags: string[]): string {
  return `Create an abstract, minimalist hero image for a SaaS blog post.

Title: "${title}"
Topics: ${tags.join(', ')}

Style requirements:
- Abstract and geometric, NO text or words in the image
- Deep indigo and electric blue gradient background
- Flowing geometric lines, subtle glowing nodes, and light particles
- Suggest themes of AI, automation, and digital communication
- Clean, modern, editorial aesthetic suitable for a tech blog header
- 16:9 aspect ratio, high contrast, visually striking
- Minimal and elegant, not cluttered`;
}
