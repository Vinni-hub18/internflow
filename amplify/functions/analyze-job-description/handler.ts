import { env } from "$amplify/env/analyze-job-description";
const MANTLE_BASE_URL =
  "https://bedrock-mantle.ap-south-1.api.aws/v1";

const MODEL_ID = "zai.glm-4.7-flash";


type Event = {
  arguments?: {
    jobDescription?: string;
  };
  jobDescription?: string;
};


type AIResult = {
  company: string;
  role: string;
  location: string;
  deadline: string;
  skills: string[];
  documents: string[];
};

function extractJson(text: string): AIResult {
  let cleaned = text.trim();

  // Remove markdown code fences if the model adds them.
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  return {
    company: typeof parsed.company === "string" ? parsed.company : "",
    role: typeof parsed.role === "string" ? parsed.role : "",
    location:
      typeof parsed.location === "string" ? parsed.location : "",
    deadline:
      typeof parsed.deadline === "string" ? parsed.deadline : "",
    skills: Array.isArray(parsed.skills)
      ? parsed.skills.filter((item: unknown) => typeof item === "string")
      : [],
    documents: Array.isArray(parsed.documents)
      ? parsed.documents.filter(
          (item: unknown) => typeof item === "string"
        )
      : [],
  };
}

export const handler = async (event: Event) => {
  console.log("Analyze JD Lambda started");

const jobDescription =
  event?.arguments?.jobDescription?.trim() ??
  event?.jobDescription?.trim();
  
  if (!jobDescription) {
    throw new Error("Job description is required.");
  }

  const apiKey = env.BEDROCK_MANTLE_API_KEY;

  if (!apiKey) {
    throw new Error("BEDROCK_MANTLE_API_KEY is not configured.");
  }

  const prompt = `
You are an AI internship and job description analyzer.

Analyze the following job description.

Return ONLY valid JSON.

The JSON must contain exactly these fields:

{
  "company": "",
  "role": "",
  "location": "",
  "deadline": "",
  "skills": [],
  "documents": []
}

Rules:
- Extract only information explicitly present in the job description.
- Do not invent information.
- If company is unavailable, return an empty string.
- If role is unavailable, return an empty string.
- If location is unavailable, return an empty string.
- If deadline is unavailable, return an empty string.
- If no skills are found, return an empty array.
- If no documents are found, return an empty array.
- Do not include explanations.
- Do not use markdown.
- Do not use code fences.
- Return valid JSON only.

JOB DESCRIPTION:

${jobDescription}
`;

  const response = await fetch(
    `${MANTLE_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: "system",
            content:
              "You are an AI internship and job description analyzer.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Mantle API error:", errorText);

    throw new Error(
      `Bedrock Mantle request failed: ${response.status}`
    );
  }

  const result = await response.json();

  const content =
    result?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty response.");
  }

  console.log("AI raw response:", content);

  try {
    return extractJson(content);
  } catch (error) {
    console.error("Failed to parse AI JSON:", content);

    throw new Error(
      "AI returned an invalid JSON response."
    );
  }
};