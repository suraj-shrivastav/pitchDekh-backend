import Firecrawl from '@mendable/firecrawl-js';
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY

const firecrawl = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });

// console.log(firecrawl);

export default firecrawl;