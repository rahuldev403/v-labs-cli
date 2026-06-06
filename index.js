import "dotenv/config";
import inquirer from "inquirer";
import { getLookalikes } from "./lib/ocean";
import { getDecisionMakers } from "./lib/prospeo";
import { resolveEmails } from "./lib/eazyreach";
import { sendOutreach } from "./lib/brevo";

async function run() {
  try {
    const { seed } = await inquirer.prompt([
      {
        type: "input",
        name: "seed",
        message: "Enter the seed domain (e.g., target.com)",
        validate: (input) => (input ? true : "Domain is required"),
      },
    ]);

    console.log(`\n Firing pipline for: ${seed}\n`);

    // Stage 1 -> Stage 2 -> Stage 3
    const domains = await getLookalikes(seed);
    const executives = await getDecisionMakers(domains);
    const verifiedContacts = await resolveEmails(executives);

    // THE SAFETY CHECKPOINT
    console.log("\n================ PIPELINE SUMMARY ================");
    console.table(verifiedContacts, ["name", "title", "company", "email"]);
    console.log("==================================================\n");

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Fire personailzed emails to these ${verifiedContacts.length} verfied contacts?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("Pipeline halted. No emails sent.");
      process.exit(0);
    }

    // Stage 4
    await sendOutreach(verifiedContacts);
    console.log("\n✅ Pipeline execution complete.");
  } catch (error) {
    console.error("\n❌ Fatal Pipeline Error:", error.message);
  }
}

run();
