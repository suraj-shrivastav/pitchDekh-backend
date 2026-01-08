import { tavily } from "@tavily/core";
import dotenv from "dotenv";
import { queryGenerator } from "../gemini/pitchQueryGenerator.js";

dotenv.config({ quiet: true });

if (!process.env.TAVILY_API_KEY) {
    throw new Error("Missing TAVILY_API_KEY");
}

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export const getMarketData = async (pitchData) => {
    try {
        const tavilyContext = [];

        const queries = await queryGenerator(pitchData);

        if (!Array.isArray(queries)) {
            throw new Error("queryGenerator must return an array");
        }

        for (const query of queries) {
            console.log("Query:", query);
            const result = await tvly.search(query, { country: "India", maxResults: 2 });

            let searchResult = "";
            result.results.forEach((item) => {
                searchResult += `Title: ${item.title}\nContent: ${item.content}\n\n`;
            });
            tavilyContext.push({
                query,
                result: searchResult
            });
        }

        console.log("Tavily Research Done");
        let TAVILY_CONTEXT_PROMPT = "";
        tavilyContext.forEach(element => {
            TAVILY_CONTEXT_PROMPT += `\n\n Query: ${element.query}, SearchResult: ${element.result}`;
        });

        return TAVILY_CONTEXT_PROMPT;

    } catch (error) {
        console.error("Tavily error:", error);
        throw error;
    }
};
