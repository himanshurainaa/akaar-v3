import { GoogleGenAI, Type } from "@google/genai";
import type { UploadedImage } from '../types';

interface ClothingItems {
    top?: UploadedImage; // Represents the main outfit reference image
    bottom?: UploadedImage;
    shoes?: UploadedImage;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateVirtualTryOnImage = async (
    apiKey: string,
    personImage: UploadedImage,
    clothingItems: ClothingItems,
    poseOption: 'original' | 'replicate',
    fitOption: string,
    customPrompt: string,
    backgroundPrompt: string,
    onProgress: (message: string) => void
): Promise<string> => {
    
    // Strategy: Try High-Quality Pro model first.
    // Fallback to Flash if Pro is rate-limited.
    const strategies = [
        { 
            id: 'gemini-3-pro-image-preview', 
            label: 'Pro',
            config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } } 
        },
        { 
            id: 'gemini-2.5-flash-image', 
            label: 'Flash',
            config: { imageConfig: { aspectRatio: "3:4" } }
        }
    ];

    const hasClothing = !!(clothingItems.top || clothingItems.bottom || clothingItems.shoes);
    const hasCustomPrompt = customPrompt.trim() !== '';
    const hasBackgroundPrompt = backgroundPrompt.trim() !== '';

    // --- SHARED SECTIONS ---
    const faceLockSection = `
// --- FACE STRUCTURE LOCK (CRITICAL) ---
// You MUST preserve the subject's face from IMAGE_0 with absolute fidelity.
// - PRESERVE: face shape, jawline, nose, eyes, lips, cheekbones, ears, eyebrows, skin texture, and expression.
// - DO NOT CHANGE: ethnicity, facial symmetry, or personal identity.
// - The only acceptable changes are to match the lighting of the new scene.
`;

    const backgroundSection = backgroundPrompt.trim() !== '' ? `
// --- BACKGROUND MODIFICATION ---
// The user has provided a new background instruction: "${backgroundPrompt}".
// 1. You MUST REPLACE the entire original background of IMAGE_0 with a new one that matches this description.
// 2. CRITICAL: The person and their clothing are the FOREGROUND subject. DO NOT alter the person or their clothing when changing the background.
// 3. Ensure realistic lighting integration between the new background and the person.
` : '';

    const outputSection = `
// --- OUTPUT REQUIREMENTS ---
// - The output must be a clean, hyper-realistic, raw image. Do NOT add any logos, watermarks, text, or artifacts.
`;

    let finalPrompt = '';

    if (hasClothing) {
        // ---------------------------------------------------------
        // MODE A: VIRTUAL TRY-ON (Clothing Images Provided)
        // ---------------------------------------------------------
        finalPrompt = `
// --- TASK: HYPER-REALISTIC VIRTUAL TRY-ON ---
// Your goal is to generate a photorealistic image where the subject from IMAGE_0 is wearing the provided clothing items.

${faceLockSection}

// --- INPUT IMAGES & HIERARCHY ---
// - IMAGE_0: The base image of the person.
// - The remaining images contain clothing. IGNORE THE MODELS in these images; extract ONLY the garments.
// - HIERARCHY:
//   1. OUTFIT_REFERENCE (if provided): The base outfit.
//   2. BOTTOMS/SHOES (if provided): These override the base outfit's corresponding parts.

// --- POSE SYSTEM ---
// User Selection: "${poseOption === 'replicate' ? "Replicate the outfit model's pose" : "Keep the original pose"}".
// - If "Keep Original": Maintain the person's exact pose from IMAGE_0.
// - If "Replicate Pose": Analyze the pose from the primary outfit reference image and have the person in IMAGE_0 adopt it. Retain the person's physical proportions.

// --- FIT & STYLE ---
// - Fit Preference: "${fitOption}" (Adjust the drape/tightness of the clothing on the body).
// - Custom Instructions: "${customPrompt || 'None'}"

// --- EXECUTION ---
// 1. Detect clothing from reference images.
// 2. Composite them onto the person in IMAGE_0.
// 3. Adjust lighting and shadows for realism.

${backgroundSection}
${outputSection}
`;
    } else {
        // ---------------------------------------------------------
        // MODE B: REFINEMENT / EDITING (No Clothing Images)
        // ---------------------------------------------------------
        // We assume the person is already dressed (from previous step), and we are just editing details.
        
        finalPrompt = `
// --- TASK: IMAGE EDITING & REFINEMENT ---
// Your goal is to modify the subject in IMAGE_0 based on specific user instructions (Fit, Background, or Custom Details).
// DO NOT attempt to "try on" new clothes, as no reference clothing images are provided. Work with the clothing currently visible in IMAGE_0.

${faceLockSection}

// --- INPUT IMAGE ---
// - IMAGE_0: The base image to be modified.

// --- REQUESTED MODIFICATIONS ---
// 1. FIT ADJUSTMENT: The user wants the current clothing to fit "${fitOption}". 
//    - If the current fit doesn't match, subtley reshape the clothing (drape/tightness) to match this style, while keeping the same fabric/design.
//
// 2. CUSTOM INSTRUCTION: "${customPrompt || 'None'}"
//    - Apply this change faithfully. (e.g. "roll up sleeves", "add sunglasses", "change hair color").

${backgroundSection}

// --- POSE ---
// Maintain the current pose of the person in IMAGE_0 completely, unless the Custom Instruction explicitly implies a pose change.

${outputSection}
`;
    }

    const personImagePart = { inlineData: { mimeType: personImage.mimeType, data: personImage.base64 } };
    
    const clothingImageParts = [];
    if(clothingItems.top) clothingImageParts.push({ inlineData: { mimeType: clothingItems.top.mimeType, data: clothingItems.top.base64 } });
    if(clothingItems.bottom) clothingImageParts.push({ inlineData: { mimeType: clothingItems.bottom.mimeType, data: clothingItems.bottom.base64 } });
    if(clothingItems.shoes) clothingImageParts.push({ inlineData: { mimeType: clothingItems.shoes.mimeType, data: clothingItems.shoes.base64 } });

    const promptPart = { text: finalPrompt };
    
    // Order matters: Person First, then Clothes (if any), then Prompt
    const allParts = [personImagePart, ...clothingImageParts, promptPart];

    let lastError: any = null;

    for (const strategy of strategies) {
        let attempt = 0;
        const MAX_RETRIES_PER_MODEL = 2;

        while (attempt < MAX_RETRIES_PER_MODEL) {
            try {
                // Prepare UI message
                let progressMessage = "";
                if (strategy.label === 'Flash') {
                    progressMessage = "High traffic on Pro model. Switching to Flash model...";
                } else if (hasClothing) {
                    progressMessage = "Fitting your new outfit...";
                } else if (hasBackgroundPrompt && !hasCustomPrompt) {
                    progressMessage = "Updating background...";
                } else if (hasCustomPrompt) {
                    progressMessage = "Applying your custom changes...";
                } else {
                    progressMessage = "Refining your look...";
                }

                if (attempt > 0) {
                    progressMessage += ` (Retry ${attempt}/${MAX_RETRIES_PER_MODEL})`;
                }
                onProgress(progressMessage);

                if (!apiKey) {
                    throw new Error("API Key is missing.");
                }
                const ai = new GoogleGenAI({ apiKey });

                const response = await ai.models.generateContent({
                    model: strategy.id, 
                    contents: { parts: allParts },
                    config: strategy.config
                });

                const candidate = response.candidates?.[0];

                if (!candidate) {
                    throw new Error(`The ${strategy.label} model did not return a response.`);
                }

                if (candidate.finishReason === 'SAFETY') {
                    throw new Error(`The generated image was blocked by safety filters (${strategy.label}). Please try a different photo.`);
                }
                
                const imagePart = candidate.content.parts.find(part => part.inlineData);
                
                if (imagePart?.inlineData) {
                    const base64ImageBytes = imagePart.inlineData.data;
                    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
                    return imageUrl;
                }
                
                const textPart = candidate.content.parts.find(part => part.text);
                if (textPart?.text) {
                     throw new Error(`Model (${strategy.label}) response: ${textPart.text}`);
                }

                throw new Error("API returned no image data.");

            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || '';
                
                console.warn(`Attempt failed on ${strategy.id}:`, error);

                // Detect Rate Limit / Quota Errors
                const isRateLimit = errorMessage.includes('429') || 
                                    errorMessage.includes('RESOURCE_EXHAUSTED') || 
                                    errorMessage.includes('Quota') ||
                                    error.status === 429;

                if (isRateLimit) {
                    if (strategy.label === 'Pro') {
                        console.log("Pro model rate limited, switching to Flash fallback.");
                        break; // Move to next strategy
                    }
                }
                
                attempt++;
                if (attempt < MAX_RETRIES_PER_MODEL) {
                    await delay(1500 * (attempt + 1));
                }
            }
        }
    }

    let finalErrorMessage = "An unknown error occurred.";
    if (lastError) {
        if (lastError instanceof Error) finalErrorMessage = lastError.message;
        else finalErrorMessage = String(lastError);
    }
    throw new Error(finalErrorMessage);
};

export const getStyleSuggestions = async (
    apiKey: string,
    personImage: UploadedImage,
    clothingItems: ClothingItems
): Promise<string[]> => {
    try {
        if (!apiKey) {
             return [];
        }
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are an expert fashion stylist AI. The first image is the person. The subsequent images contain an outfit reference and/or optional specific items. Analyze the person and the complete outfit. Suggest 3-5 simple accessories or additions that would complement the look. Return a JSON object with a single key "suggestions" (array of strings). Example: {"suggestions": ["add a silver watch", "wear a black beanie"]}. No other text.`;
        
        const personImagePart = { inlineData: { mimeType: personImage.mimeType, data: personImage.base64 } };
        
        const clothingImageParts = [];
        if(clothingItems.top) clothingImageParts.push({ inlineData: { mimeType: clothingItems.top.mimeType, data: clothingItems.top.base64 } });
        if(clothingItems.bottom) clothingImageParts.push({ inlineData: { mimeType: clothingItems.bottom.mimeType, data: clothingItems.bottom.base64 } });
        if(clothingItems.shoes) clothingImageParts.push({ inlineData: { mimeType: clothingItems.shoes.mimeType, data: clothingItems.shoes.base64 } });

        const textPart = { text: prompt };

        const allParts = [personImagePart, ...clothingImageParts, textPart];

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: allParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.suggestions)) {
            return result.suggestions;
        }

        return [];

    } catch (error) {
        console.error("Error generating style suggestions:", error);
        return [];
    }
};