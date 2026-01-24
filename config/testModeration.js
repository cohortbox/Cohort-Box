import OpenAI from "openai";
import dotenv from "dotenv";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testModeration() {
  try {
    const res = await client.moderations.create({
      model: "omni-moderation-latest",
      input: "Hello world",
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}

export {testModeration};