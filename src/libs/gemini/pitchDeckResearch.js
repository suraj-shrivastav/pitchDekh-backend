import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from "../../database/supabase.js";
import { RESEARCH_SYSTEM_PROMPT, RESEARCH_USER_PROMPT } from "../system_prompts/pitch_research_prompt.js";
import { getMarketData } from "../tavily/tavily.js";


const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("GOOGLE_API_KEY not found");

const genAI = new GoogleGenerativeAI(apiKey);

const cleanAndParseJSON = (text) => {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
};


export const pitchDeckResearch = async (pitchId) => {
    try {

        const start = Date.now();
        const { data: pitchData } = await supabase
            .from("startup_profiles")
            .select("*")
            .eq("id", pitchId)
            .single();

        const SYSTEM_PROMPT = RESEARCH_SYSTEM_PROMPT;
        const USER_PROMPT = RESEARCH_USER_PROMPT(pitchData.pitch_normalized);

        if (!SYSTEM_PROMPT || !USER_PROMPT) throw new Error("Missing prompts");

        console.log("[Gemini] Generating research...");
        const TAVILY_CONTEXT = await getMarketData(pitchData);



        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                maxOutputTokens: 30000,
                responseMimeType: "application/json",
            },
        });

        const result = await model.generateContent([
            { text: USER_PROMPT },
            { text: TAVILY_CONTEXT },
        ]);
        const parsed = cleanAndParseJSON(result.response.text());
        console.log("Researched Data is: ", parsed);
        // return parsed;

        const { data, error } = await supabase
            .from("startup_profiles")
            .update({ pitch_research: parsed }).eq("id", pitchId);
        if (error) throw error;

        console.log("[Gemini] Research completed in", (Date.now() - start) / 1000, "seconds");
        return { data: parsed, time: (Date.now() - start) / 1000 };

    } catch (error) {
        console.error("Research Failed:", error);
        return { error };
    }
};
