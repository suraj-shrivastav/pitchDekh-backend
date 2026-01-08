import supabase from "./supabase.js"

export const insertPitch = async (pitch, user_id, fileUrl) => {
    try {
        const { data, error } = await supabase
            .from("startup_profiles")
            .insert([
                {
                    company_name: pitch.company.name,
                    founded_year: pitch.company.foundedYear,
                    hq_location: pitch.company.hqLocation,

                    stage: pitch.company.stage,
                    funding_stage: pitch.funding.fundingStage,
                    customer_type: pitch.marketClaimedByFounder.customerType,

                    industries: pitch.marketClaimedByFounder.industries,
                    geography: pitch.marketClaimedByFounder.geography,

                    revenue_streams: pitch.businessModel.revenueStreams,
                    pricing_model: pitch.businessModel.pricingModel,
                    sales_motion: pitch.businessModel.salesMotion,

                    fundings: pitch.funding,
                    financials: pitch.financials,

                    pitch_normalized: pitch,
                    user_id: user_id,
                    pitch_url: fileUrl,
                    summary: pitch.summary,

                }
            ])
            .select("id")
            .single();

        if (error) { console.log(error); throw error };

        const startupId = data.id;

        return startupId;
    } catch (error) {
        console.error("Error inserting Pitch data:", error);
        throw error;
    }
}

export const insertVCData = async (vcData) => {
    try {
        const { data, error } = await supabase
            .from("vc_profiles")
            .insert([{
                firm_name: vcData.identity?.firm_name || vcData.identity?.website_url,
                identity: vcData.identity,
                investment_criteria: vcData.investment_criteria,
                operational_metrics: vcData.operational_metrics,
                contact_and_access: vcData.contact_and_access,
                value_add: vcData.value_add,
                team: vcData.team,
                portfolio_snapshot: vcData.portfolio_snapshot,
                metadata: vcData.metadata
            }])
            .select("id")
            .single();

        if (error) throw error;

        const vcId = data.id;
        console.log("VC data inserted successfully.");

        return vcId;
    } catch (error) {
        console.error("Error inserting VC data:", error);
        throw error;
    }
}

