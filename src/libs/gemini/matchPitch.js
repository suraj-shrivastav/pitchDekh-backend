import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


const MATCH_ANALYSIS_SYSTEM_PROMPT = `
    You are an Expert Pitch-VC Match Analyst.
    Your task is to analyze the provided Pitch Profile and VC Profile to determine WHY they are a good match.
    
    You have already been provided a pre-calculated "Match Score". 
    Your job is NOT to re-calculate the score, but to explain the *qualitative* reasons behind the fit.

    ### INPUT DATA:
    - Match Score: (0-100)
    - VC Profile: (JSON)
    - Pitch Profile: (JSON)

    ### OUTPUT FORMAT (JSON ONLY):
    {
        "summary": {
            "match_tier": "Perfect Fit | Strong Contender | Marginal | Wildcard",
            "one_line_verdict": "String (e.g., 'Strong SaaS focus with matching check size.')",
            "recommended_action": "Priority Reachout | Keep Warm | Do Not Contact"
        },
        "analysis": {
            "thesis_alignment": "String (Explain how the pitch fits the VC's thesis)",
            "sector_fit": "String (Specific details on sector overlap)",
            "concerns": ["String (Potential red flags or mismatches)"]
        },
        "email_draft": {
            "subject": "String (Compelling subject line for cold email)",
            "body": "String (Short, personalized cold email body referencing the fit)"
        }
    }

    ### RULES:
    1. Output ONLY valid JSON.
    2. Be concise and professional.
    3. If the Match Score is low (<50), explain why it's a mismatch in "concerns".
`;

export const analyzeMatch = async (pitch, matchItem) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            systemInstruction: MATCH_ANALYSIS_SYSTEM_PROMPT,
            generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `
                    MATCH SCORE: ${matchItem.score}
                    
                    VC PROFILE: 
                    ${JSON.stringify(matchItem.vc.investment_criteria)}
                    ${JSON.stringify(matchItem.vc.identity)}

                    PITCH PROFILE:
                    ${JSON.stringify(pitch.company)}
                    ${JSON.stringify(pitch.funding)}
                    ${JSON.stringify(pitch.marketClaimedByFounder)}
                `;

        const result = await model.generateContent(prompt);
        const analysis = JSON.parse(result.response.text());
        return { ...matchItem, ai_analysis: analysis };
    } catch (err) {
        console.error(`AI Analysis Failed for ${matchItem.vc.firm_name}:`, err.message);
        return { ...matchItem, ai_analysis: { error: "Analysis Failed", summary: { match_tier: "Analysis Unavailable" } } };
    }
};