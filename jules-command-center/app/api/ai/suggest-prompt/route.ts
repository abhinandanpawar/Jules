import { NextResponse } from 'next/server';

// This is the main handler for the /api/ai/suggest-prompt endpoint
export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Validate that the prompt exists
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  // Retrieve AI service configuration from environment variables
  const AI_API_URL = process.env.AI_API_URL;
  const AI_API_KEY = process.env.AI_API_KEY;

  if (!AI_API_URL) {
    return NextResponse.json({ error: 'AI API URL is not configured.' }, { status: 500 });
  }

  // Define the payload for the external AI API, following the OpenAI-compatible format
  const payload = {
    model: "TinyLlama-1.1B-Chat-v1.0", // This can be adjusted based on the provider
    messages: [
      {
        role: "system",
        content: "You are an expert software engineering manager. Rewrite the user's task description to be clear, structured, and actionable for an AI software engineer. Use markdown formatting. Ensure the output is only the rewritten description."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  };

  try {
    // Make the authenticated call to the external AI inference API
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("AI API Error:", errorDetails);
      throw new Error(`The AI service returned an error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract the suggested prompt from the AI's response
    // The exact path might vary slightly based on the provider, but this is standard for OpenAI-compatible APIs.
    const suggested_prompt = data.choices[0]?.message?.content || "Sorry, I couldn't generate a suggestion.";

    return NextResponse.json({ suggested_prompt });

  } catch (error: any) {
    console.error("Internal API Error:", error.message);
    return NextResponse.json({ error: 'Failed to get a suggestion from the AI service.' }, { status: 500 });
  }
}