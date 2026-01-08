import { pitchDeckResearch } from "../libs/gemini/pitchDeckResearch.js";
import { parsePitchDeck } from "../libs/gemini/pitchDeckParser.js";
import supabase from "../database/supabase.js";

export const analyzePitch = async (req, res) => {
    let start;
    try {
        console.log(req.body);
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: "Please provide a fileUrl." });
        }
        console.log("File URL received:", fileUrl);
        start = Date.now();

        const mimeType = "application/pdf";

        const analysis = await parsePitchDeck(fileUrl, mimeType, req.user.id);
        console.log("Analysis completed for user:", req.user.id);
        console.log("Time taken:", (Date.now() - start) / 1000, "seconds");

        res.json({
            success: true,
            message: "Success",
            data: analysis
        });

    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: error.message });
    }
}

// export const getUserPitches = async (req, res) => {
//     try {
//         const { data, error } = await supabase
//             .from("startup_profiles")
//             .select("*")
//             .eq("user_id", req.user.id)
//             .order("created_at", { ascending: false });

//         if (error) throw error;

//         res.json({
//             success: true,
//             data
//         });
//     } catch (error) {
//         console.error("Fetch Pitches Error:", error);
//         res.status(500).json({ error: error.message });
//     }
// }

export const deepResearch = async (req, res) => {
    try {
        if (!req.body.pitchId) {
            return res.status(400).json({ error: "Please provide a pitchId." });
        }
        const result = await pitchDeckResearch(req.body.pitchId);

        if (result.error) {
            throw result.error;
        }

        res.json({
            success: true,
            message: "Success",
            data: result.data,
            time: result.time
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: error.message });
    }
}

export const getUserPitches = async (req, res) => {
    try {
        // console.log("getUserPitches hit", req.user.id)
        const { data, error } = await supabase
            .from("startup_profiles")
            .select(`
                id,
                created_at,
                pitch_url,
                pitch_normalized->company
            `)
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });
        if (error) throw error;
        // console.log(data);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Fetch Pitches Error:", error);
        res.status(500).json({ error: error.message });
    }
}

export const getPitch = async (req, res) => {
    // console.log("getPitch hit", req.user.id)
    try {
        const pitchId = req.params.id;
        // console.log("pitchId ", pitchId);
        const { data, error } = await supabase
            .from("startup_profiles")
            .select(`
                id,
                created_at,
                pitch_url,
                pitch_normalized,
                pitch_research
            `)
            .eq("id", pitchId)
            .single();
        if (error) throw error;
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Fetch Pitch Error:", error);
        res.status(500).json({ error: error.message });
    }
}