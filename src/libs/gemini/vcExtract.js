import firecrawlApp from "../firecrawl/firecrawl.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tavily } from "@tavily/core";
import axios from "axios";

import {
    VC_NORMALIZE_SYSTEM_PROMPT,
    VC_QUERY_GENERATOR_SYSTEM_PROMPT,
    VC_MERGE_SYSTEM_PROMPT
} from "../system_prompts/vc_system_prompts.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const tvly = new tavily(process.env.TAVILY_API_KEY);

const retrieveBrandByDomain = async (domain) => {
    const url = 'https://api.brand.dev/v1/brand/retrieve';
    const API_KEY = process.env.BRAND_DEV_API_KEY;

    try {
        const response = await axios.get(url, {
            params: {
                domain: domain
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error retrieving brand data:', error);
    }
}

const cleanAndParseJSON = (text) => {
    if (!text) throw new Error("Empty JSON response from Gemini.");
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("JSON Parse Error:", cleaned.substring(0, 500));
        throw new Error("Gemini returned invalid JSON.");
    }
};

const deepCrawl = async (url) => {
    const response = await firecrawlApp.crawlUrl(url, {
        limit: 0,
        maxDepth: 8,
        maxDiscoveryDepth: 8,
        ignoreSitemap: false,
        // includePaths: ["*"],
        scrapeOptions: {
            formats: ["markdown"],
            onlyMainContent: false,
        }
    });

    if (!response.success) throw new Error(`Crawl Error: ${response.error}`);

    return response.data
        .map(page => `--- PAGE: ${page.metadata?.title || "Unknown"} ---\n${page.markdown}`)
        .join("\n\n")
        .slice(0, 180000); // keep safety limit
};

const geminiExtract = async (crawledText, brandData) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        systemInstruction: VC_NORMALIZE_SYSTEM_PROMPT,
        generationConfig: {
            maxOutputTokens: 45000,
            responseMimeType: "application/json",
            temperature: 0.1,
        }
    });


    const res = await model.generateContent([{ text: crawledText }, { text: JSON.stringify(brandData) }]);
    return cleanAndParseJSON(res.response.text());
};
const generateQueries = async (vcProfile) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        systemInstruction: VC_QUERY_GENERATOR_SYSTEM_PROMPT,
        generationConfig: {
            maxOutputTokens: 5000,
            responseMimeType: "application/json",
            temperature: 0.1,
        }
    });

    const res = await model.generateContent([{ text: JSON.stringify(vcProfile) }]);
    const result = cleanAndParseJSON(res.response.text());
    return result.queries || [];
};

const runResearchQueries = async (queries) => {
    const results = {};

    for (const q of queries) {
        try {
            const response = await tvly.search(q.query, {
                search_depth: "advanced",
                max_results: 5,
                include_answer: true,
            });

            results[q.category] = results[q.category] || [];
            results[q.category].push({
                query: q.query,
                answer: response.answer,
                results: response.results,
            });

        } catch (err) {
            console.warn("Tavily query failed:", q.query, err.message);
        }
    }

    return results;
};

const geminiMergeProfiles = async (baseProfile, enrichment) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        systemInstruction: VC_MERGE_SYSTEM_PROMPT,
        generationConfig: {
            maxOutputTokens: 45000,
            responseMimeType: "application/json",
            temperature: 0.1,
        }
    });

    const res = await model.generateContent([
        {
            text: `
            BASE PROFILE:
            ${JSON.stringify(baseProfile)}

            ENRICHMENT DATA:
            ${JSON.stringify(enrichment)}
            `
        }
    ]);

    return cleanAndParseJSON(res.response.text());
};

export const extractVCProfile = async (url) => {
    const start = Date.now();

    try {
        console.log(`Starting VC extraction: ${url}`);

        // Stage 1: Crawl and Retrieve Brand Data
        console.log("Deep crawling website...");
        const crawledText = await deepCrawl(url);

        console.log("Retrieving brand data...");
        const retrievedBrandData = await retrieveBrandByDomain(url);

        const brandData = {
            name: retrievedBrandData.brand.name,
            description: retrievedBrandData.brand.description,
            tagline: retrievedBrandData.brand.slogan,
            logo: retrievedBrandData.brand.logos,
            socials: retrievedBrandData.brand.socials,
            website: retrievedBrandData.brand.website,
            industry: retrievedBrandData.brand.industries,
            links: retrievedBrandData.brand.links,
            backdrops: retrievedBrandData.brand.backdrops,
            colors: retrievedBrandData.brand.colors
        }
        console.log("Brand Data Retrieved");

        // Stage 2: Extract from crawl
        console.log("Extracting base VC profile...");
        const baseProfile = await geminiExtract(crawledText, brandData);

        // Stage 3: Generate missing-field queries
        console.log("Generating research queries...");
        const queries = await generateQueries(baseProfile);

        // Stage 4: External search
        console.log("Running targeted Tavily enrichment...");
        const enrichment = await runResearchQueries(queries);

        // Stage 5: Merge
        console.log("Merging base + enrichment...");
        const finalProfile = await geminiMergeProfiles(baseProfile, enrichment);

        console.log(`DONE in ${(Date.now() - start) / 1000}s`);
        return finalProfile;

    } catch (err) {
        console.error("Fatal Extraction Error:", err);
        throw err;
    }
};
