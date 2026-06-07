// *Stage 4: Brevo (The Outreach)
// *Goal: Send the finalized payload to Brevo's v3 Transactional API.
// *Logic: Fire the emails individually or via Brevo's bulk endpoint. For maximum personalization reliability, dispatching them iteratively with a slight delay is the safest approach.

import axios from "axios";
import { delay } from "./utils.js";

export async function sendOutreach(contacts) {
  console.log(`\n[4/4] Dispatching personalized emails via Brevo...`);

  // 🛑 DEFENSIVE CHECK: Ensure the key actually exists before making requests
  if (!process.env.BREVO_API_KEY) {
    console.error("\n❌ FATAL ERROR: BREVO_API_KEY is undefined.");
    console.error(
      "Please ensure your .env file is loaded properly using dotenv.config() in index.js",
    );
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const contact of contacts) {
    try {
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: "Rahul Swain", email: "rahul@rahulswain.me" },
          to: [{ email: contact.email, name: contact.name }],
          subject: `Quick question regarding ${contact.company}`,
          htmlContent: `
          <div style="font-family: sans-serif; font-size: 14px; color: #333;">
            <p>Hi ${contact.name},</p>
            <p>I noticed your work as ${contact.title} at ${contact.company}. I'm building an automated top-of-funnel pipeline and would love your feedback on the architecture.</p>
            <p>Open to a quick chat this week?</p>
            <p>Best,<br>Sameer</p>
          </div>
        `,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
        },
      );

      console.log(`  ✅ Sent: ${contact.email}`);
      successCount++;

      // Delay to respect Brevo's rate limits
      await delay(200);
    } catch (error) {
      // Expose the exact reason Brevo rejected it
      console.error(
        `  ❌ Failed to send to ${contact.email}:`,
        error.response?.data?.message || error.message,
      );
      failCount++;
    }
  }

  console.log(
    `\n🎉 Outreach Complete: ${successCount} sent, ${failCount} failed.`,
  );
}
