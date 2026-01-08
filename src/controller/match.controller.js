import supabase from "../database/supabase.js";
import { analyzeMatch } from "../libs/gemini/matchPitch.js";

// --- SCORING WEIGHTS ---
const WEIGHTS = {
    SECTOR_MATCH: 35,
    STAGE_MATCH: 30, // Higher weight as it's a hard gate usually
    CHECK_SIZE_FIT: 20,
    GEO_FIT: 15
};


const parseCurrency = (amount) => {
    if (!amount) return 0;
    if (typeof amount === 'number') return amount;

    // Remove symbols
    let clean = amount.toString().replace(/[^0-9.]/g, '');
    let val = parseFloat(clean);
    return val;
};


export const getEfficientMatches = async (req, res) => {
    try {
        const { pitchId } = req.body;
        if (!pitchId) return res.status(400).json({ error: "Missing pitchId" });

        console.time("Total Match Time");

        // 1. FETCH PITCH DATA
        const { data: pitchProfile, error: pitchError } = await supabase
            .from("startup_profiles")
            .select("pitch_normalized")
            .eq("id", pitchId)
            .single();

        if (pitchError || !pitchProfile) {
            return res.status(404).json({ error: "Pitch not found" });
        }

        const pitch = pitchProfile.pitch_normalized;
        console.log(`[MatchEngine] Processing pitch for: ${pitch.company?.name || "Unknown Company"}`);

        // Extract Pitch Criteria
        const pitchStage = pitch.company?.stage || "Unknown";
        const pitchSectors = pitch.marketClaimedByFounder?.industries || [];
        const pitchGlobe = [
            ...(pitch.company?.operationLocation?.city || []),
            ...(pitch.company?.operationLocation?.country || []),
            ...(pitch.company?.operationLocation?.region || []),
            "Global"
        ].map(s => s.toLowerCase());

        let pitchAsk = 0;
        if (pitch.funding?.currentRaise?.targetAmount) {
            const raw = parseFloat(String(pitch.funding.currentRaise.targetAmount).replace(/[^0-9.]/g, ''));
            pitchAsk = raw < 1000 ? raw * 1000000 : raw;
        }

        // 2. FETCH VCs (Broad Select)

        const { data: vcs, error: vcError } = await supabase
            .from("vc_profiles")
            .select("*")
            .limit(100); // Safety limit for now

        if (vcError) throw new Error(vcError.message);
        console.log(`[MatchEngine] Initial Candidate Pool: ${vcs.length} VCs`);

        // 3. IN-MEMORY SCORING & FILTERING
        const scoredMatches = vcs.map(vc => {
            const criteria = typeof vc.investment_criteria === 'string'
                ? JSON.parse(vc.investment_criteria)
                : vc.investment_criteria;

            if (!criteria) return { vc, score: 0, reason: "No Criteria" };

            // --- A. HARD GATES (The Kill Switch) ---

            // 1. STAGE CHECK
            const vcStages = (criteria.stages || []).map(s => s.toLowerCase());

            const isStageMatch = vcStages.some(s => s.includes(pitchStage.toLowerCase())) || vcStages.includes("agnostic") || vcStages.includes("unknown");

            // 2. CHECK SIZE CHECK
            let vcMin = criteria.check_size?.min_amount || 0;
            let vcMax = criteria.check_size?.max_amount || Number.MAX_SAFE_INTEGER;

            if (vcMin < 1000 && vcMin > 0) vcMin = vcMin * 1000000;
            if (vcMax < 1000 && vcMax > 0) vcMax = vcMax * 1000000;

            const isCheckMatch = pitchAsk >= (vcMin * 0.8) && pitchAsk <= (vcMax * 1.5); // 20% flex downwards, 50% flex upwards

            // 3. GEO CHECK
            const vcGeos = (criteria.geographies || []).map(g => g.toLowerCase());
            const isGeoMatch = vcGeos.includes("global") || vcGeos.some(g => pitchGlobe.includes(g));

            // --- B. SCORING ---
            let score = 0;
            const reasons = [];

            if (isStageMatch) {
                score += WEIGHTS.STAGE_MATCH;
                reasons.push("Stage Fit");
            } else {
                // If strictly enforcing hard gates, we could set score = 0 here.
                // Soft gate: penalty
                score -= 50;
                reasons.push("Stage Mismatch");
            }

            if (isCheckMatch) {
                score += WEIGHTS.CHECK_SIZE_FIT;
                reasons.push("Check Size Fit");
            } else {
                if (pitchAsk < vcMin) reasons.push("Ask too small");
                if (pitchAsk > vcMax) reasons.push("Ask too high");
            }

            if (isGeoMatch) {
                score += WEIGHTS.GEO_FIT;
                reasons.push("Geo Match");
            }

            // SECTOR OVERLAP (The most important soft signal)
            const vcSectors = (criteria.sectors || []).map(s => s.toLowerCase());
            const matchingSectors = pitchSectors.filter(ps =>
                vcSectors.some(vs => vs.includes(ps.toLowerCase()) || ps.toLowerCase().includes(vs))
            );

            if (vcSectors.includes("generalist")) {
                score += 15;
                reasons.push("Generalist VC");
            } else if (matchingSectors.length > 0) {
                score += WEIGHTS.SECTOR_MATCH;
                reasons.push(`Sectors: ${matchingSectors.join(", ")}`);
            } else {
                reasons.push("No Sector Overlap");
            }

            return {
                vc,
                score: Math.max(0, Math.min(score, 100)),
                reasons
            };
        });

        // 4. SORT & RANK
        // Filter out absolute zeroes or dealbreakers if desired
        const ranked = scoredMatches
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score);

        console.log(`[MatchEngine] Ranked ${ranked.length} potential matches.`);

        console.log(ranked);

        if (ranked.length === 0) {
            return res.status(200).json({ matches: [], feedback: "No VCs found matching criteria." });
        }

        // 5. DEEP ANALYSIS (Top 5 Matches)
        const TOP_K = 5;
        const topMatches = ranked.slice(0, TOP_K);

        console.log(`[MatchEngine] Running AI Analysis on Top ${topMatches.length} Matches...`);

        console.log(topMatches);
        // return;
        const enrichedTopMatches = await Promise.all(topMatches.map((item) => {
            return analyzeMatch(pitch, item);
        }));

        console.timeEnd("Total Match Time");

        const { data, error } = await supabase
            .from("pitch_matches")
            .upsert(
                {
                    pitchId,
                    meta: {
                        total_scanned: vcs.length,
                        matches_found: ranked.length,
                        top_k_analyzed: enrichedTopMatches.length,
                    },
                    top_matches: enrichedTopMatches,
                    other_matches: ranked.slice(TOP_K, 20),
                },
                {
                    onConflict: "pitchId",
                }
            )
            .select("id")
            .single();

        if (error) throw error;

        console.log(data);

        return res.status(200).json({
            meta: {
                total_scanned: vcs.length,
                matches_found: ranked.length,
                top_k_analyzed: enrichedTopMatches.length
            },
            top_matches: enrichedTopMatches,
            other_matches: ranked.slice(TOP_K, 20),
            pitchId: pitchId,
            matchId: data.id
        });

    } catch (error) {
        console.error("Match Controller Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
