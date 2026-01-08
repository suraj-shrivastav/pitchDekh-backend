

const VC_Schema = {
    "identity": {
        "firm_name": "String",
        "slug": "String (unique-id-for-url)",
        "tagline": "String | null",
        "description": "String | null",
        "logo_url": "String | null",
        "website_url": "String | null",
        "founded_year": "Number | null"
    },

    "investment_criteria": {
        // CRITICAL FOR MATCHING
        "sectors": ["String"],          // e.g. ["Fintech", "SaaS"]
        "stages": ["String"],           // e.g. ["Pre-Seed", "Seed"]
        "geographies": ["String"],      // e.g. ["India", "SEA", "US"]
        "check_size": {
            "currency": "String (USD/INR)",
            "min_amount": "Number",
            "max_amount": "Number",
            "display_text": "String | null"
        },
        "lead_investments": "Boolean",
        "thesis_summary": "String | null",
        "anti_portfolio": {
            "explicit_exclusions": ["String"], // e.g. ["Gambling", "Crypto"]
            "implicit_exclusions": ["String"]
        }
    },

    "operational_metrics": {
        // USED FOR 'ACTIVE STATUS' SCORING
        "fund_status": {
            "estimated_fund_size": "String | null",
            "is_active": "Boolean",
            "is_deploying_capital": "Boolean",
            "vintage_year": "String | null"
        },
        "activity": {
            "investment_frequency": "High | Medium | Low | null",
            "last_investment_date": "ISO8601 Date String | null",
            "typical_ownership_target": "String | null", // e.g. "10-15%"
            "follow_on_policy": "String | null"
        }
    },

    "contact_and_access": {
        // USED FOR REACHOUT
        "channels": {
            "submission_url": "String | null",
            "general_email": "String | null",
            "linkedin_url": "String | null",
            "twitter_handle": "String | null"
        },
        "accessibility": {
            "cold_outbound_friendly": "Boolean",
            "warm_intro_required": "Boolean",
            "pitch_barrier_level": "Low | Medium | High",
            "founder_friendliness_score": "Number (1-10)"
        }
    },

    "value_add": {
        // USED FOR 'FIT' SCORING
        "services": {
            "hiring_support": "Boolean",
            "gtm_strategy": "Boolean",
            "fundraising_help": "Boolean",
            "community_access": "Boolean"
        },
        "network": {
            "frequent_coinvestors": ["String"],
            "network_tier": "Top-tier | Mid-tier | Niche"
        }
    },

    "team": [
        {
            "name": "String",
            "role": "String | null",
            "is_key_decision_maker": "Boolean",
            "focus_sectors": ["String"],
            "linkedin_url": "String | null"
        }
    ],

    "portfolio_snapshot": {
        // USED FOR PATTERN MATCHING
        "notable_investments": [
            { "name": "String", "url": "String" }
        ],
        "exits": {
            "count": "Number",
            "types": ["IPO", "M&A", "Secondary Sale", "Buyout", "SPAC", "Write-Off"]
        }
    },

    "metadata": {
        "confidence_scores": {
            "scraped_facts": "High | Medium | Low",
            "ai_insights": "High | Medium | Low"
        },
        "last_updated": "ISO8601 Date String"
    }
}