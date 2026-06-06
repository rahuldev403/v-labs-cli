// *Stage 3: Eazyreach (The Verification)
// *Goal: Take the LinkedIn URLs and resolve them into verified work emails.
// *Logic: Email resolution tools frequently return generic catch-all emails (e.g., info@company.com) or flag emails as "risky." To protect your domain reputation, strictly drop anything that is not definitively verified.

import axios from "axios";
import { processInBatches } from "./utils.js";

export async function resolveEmails(executives) {
  console.log(
    `\n[3/4] Resolving LinkedIn profiles to work emails via Eazyreach...`,
  );
  const verifiedContacts = [];

  const results = await processInBatches(executives, 10, async (executive) => {
    const response = await axios.post(
      "https://api.eazyreach.com/v1/enrich",
      { linkedin_url: executive.linkedinUrl },
      { headers: { Authorization: `Bearer ${process.env.EAZYREACH_API_KEY}` } },
    );
    return { ...executive, emailData: response.data };
  });

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const { emailData, ...executive } = result.value;
      if (emailData.email && emailData.verification_status === "verified") {
        verifiedContacts.push({
          ...executive,
          email: emailData.email,
        });
      }
    }
  });

  console.log(
    `✅ Successfully verified ${verifiedContacts.length} deliverable emails.`,
  );
  return verifiedContacts;
}
