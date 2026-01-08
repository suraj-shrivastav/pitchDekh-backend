import { insertVCData } from "../database/insertFunctions.js";
import supabase from "../database/supabase.js";
import { extractVCProfile } from "../libs/gemini/vcExtract.js"

export const extractVCData = async (req, res) => {
    try {
        const { url } = req.body;
        console.log(url);
        // return res.status(200).json({ message: "Success", data: url });
        const vcData = await extractVCProfile(url)
        await insertVCData(vcData);
        return res.status(200).json({ message: "Success", data: vcData });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getVCs = async (req, res) => {
    // console.log("getVCs Hit")
    try {
        const vcs = await supabase
            .from("vc_profiles")
            .select("id, identity, investment_criteria, contact_and_access")
            .order("id", { ascending: true });
        // console.log(vcs.data)
        return res.status(200).json({ message: "Success", data: vcs });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getVCById = async (req, res) => {
    try {
        const { id } = req.params;
        const vc = await supabase
            .from("vc_profiles")
            .select("*")
            .eq("id", id)
            .single();
        return res.status(200).json({ message: "Success", data: vc });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}