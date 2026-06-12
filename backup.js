import axios from "axios";
import { processInBatches } from "./utils.js";

// STEP 1: Get the token
async function getAuthToken() {
  try {
    const res = await axios.post(
      "https://api.superflow.run/b2b/createAuthToken/",
      {
        clientId: process.env.EAZYREACH_CLIENT_ID,
        clientSecret: process.env.EAZYREACH_CLIENT_SECRET,
      },
    );
    return res.data.authToken;
  } catch (error) {
    console.error("Error generating auth token:", error.message);
    return null;
  }
}

// STEP 2: The Main Function
export async function resolveEmails(executives) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      console.warn("Skipping email resolution due to missing auth token.");
      return [];
    }

    const verifiedContacts = [];

    const results = await processInBatches(executives, 5, async (exec) => {
      try {
        const res = await axios.post(
          "https://api.superflow.run/b2b/linkedin-emails",
          { linkedinUrl: exec.linkedinUrl },
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        return { ...exec, emailData: res.data };
      } catch (error) {
        console.error(
          `Error resolving email for ${exec.linkedinUrl}:`,
          error.message,
        );
        return { ...exec, emailData: { emails: [] }, error: error.message };
      }
    });

    // STEP 3: Map the data
    results.forEach((res) => {
      if (
        res.status === "fulfilled" &&
        res.value &&
        res.value.emailData &&
        res.value.emailData.emails
      ) {
        const validEmail = res.value.emailData.emails.find(
          (e) => e.verification === "verified",
        );
        if (validEmail) {
          verifiedContacts.push({ ...res.value, email: validEmail.email });
        }
      }
    });

    return verifiedContacts;
  } catch (error) {
    console.error("Critical error in resolveEmails:", error.message);
    return [];
  }
}
