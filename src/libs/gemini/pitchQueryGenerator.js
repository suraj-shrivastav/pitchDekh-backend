import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// temp 2 Queries... normal 5-7
const TAVILY_SEARCH_SYSTEM_PROMPT = `
### ROLE
You are a Senior Market Research Analyst and Search Engineer.
Your goal is to formulate highly specific search queries to gather deep market intelligence for a startup.

### INPUT
Startup details (Product, Industry, Location, Target Audience)

### OBJECTIVE
Generate 5-7 optimized search queries covering:
1. Financial benchmarks
2. Competitor intelligence
3. Market trends
4. Location-specific strategy

### RULES
- Be specific
- Include hard numbers (revenue, CAGR, profit margin, market share)
- Apply location context when provided
- Output strict JSON only

### OUTPUT FORMAT
{
  "queries": ["string"] Array of strings
}
`;

const generateSearchQueriesPrompt = (pitchData, location = "Global") => `
GENERATE MARKET RESEARCH QUERIES

STARTUP CONTEXT:
Product: ${pitchData?.product?.productName || "Unknown"} - ${pitchData?.product?.whatItDoes || ""}
Industry: ${pitchData?.marketClaimedByFounder?.industries?.join(", ") || "General Business"}
Target Location: ${location}
Target Audience: ${pitchData?.marketClaimedByFounder?.targetUsers?.join(", ") || "General"}
Startup Summary: ${pitchData?.summary}

INSTRUCTION:
Create 5-7 distinct, high-value market research queries.
Return JSON only.
`;

const safeParseJSON = (text) => {
    try {
        const cleaned = text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleaned);
    } catch {
        return null;
    }
};

export const queryGenerator = async (pitchData, location = "India") => {
    try {
        const prompt = generateSearchQueriesPrompt(pitchData, location);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            systemInstruction: TAVILY_SEARCH_SYSTEM_PROMPT,
            generationConfig: {
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
            },
        });

        const result = await model.generateContent([{ text: prompt }]);

        const parsed = safeParseJSON(result.response.text());

        if (!parsed || !Array.isArray(parsed.queries)) {
            console.warn("Invalid LLM response, returning empty array");
            return [];
        }
        console.log("Queries Generated for tavily deep research");

        return parsed.queries;

    } catch (error) {
        console.error("Query generation failed:", error);
        return [];
    }
};
