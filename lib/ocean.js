//* Stage 1: Ocean.io (The Expansion)
//* Goal: Take one domain and return a clean array of strings (lookalike domains).
//* Logic: Extract only the domain strings. If Ocean.io fails or returns zero results, the pipeline must throw a hard error, because the rest of the chain cannot run without this data.

import axios from "axios";

export async function getLookalikes(seedDomain) {
  console.log(`\n[1/4] Fetching lookalikes for ${seedDomain} from Ocean.io...`);

  let allDomains = [];
  let nextCursor = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const payload = {
        size: 100,
        companiesFilters: { domain: seedDomain },
      };

      if (nextCursor) payload.searchAfter = nextCursor;

      const response = await axios.post(
        "https://api.ocean.io/v3/search/companies",
        payload,
        { headers: { "X-Api-Token": process.env.OCEAN_IO_API_KEY } },
      );

      const batch = response.data.companies.map((c) => c.domain);
      allDomains.push(...batch);

      if (response.data.searchAfter) {
        nextCursor = response.data.searchAfter;
        console.log(
          `  Fetched ${allDomains.length} domains so far, grabbing next page...`,
        );
      } else {
        hasMore = false;
      }
    }

    console.log(
      `✅ Finished: Found ${allDomains.length} total lookalike companies.`,
    );
    return allDomains;
  } catch (error) {
    throw new Error(`Ocean.io Pagination Failed: ${error.message}`);
  }
}
