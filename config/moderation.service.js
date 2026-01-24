import OpenAI from "openai";

/**
 * Initialize OpenAI client using API key from environment
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Moderates input text using OpenAI Moderation API
 * @param {string} input - user generated content
 * @returns {object} moderation result
 */
export async function moderateText(input) {

  console.log("Moderating:'");

  if (!input || typeof input !== "string") {
    throw new Error("Invalid input for moderation");
  }
  
  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: input,
  });

  // Always return the first result
  return response.results[0];
}
