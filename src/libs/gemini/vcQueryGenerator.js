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
export const vcQueryGenerator = async (vcProfile) => {
    const prompt = `Generate 5-7 distinct, high-value market research queries. Basically you will generate queries for the data that is missing or not available in the vcProfile Data passed to you, eg, if the portfolio companies have mmissing url, find them, if the portfolio companies have missing names, Find the VC portfolio additional companies, teams socials, investoed in, focused in, vision find them.
Return JSON only.`;

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

    return parsed;
}