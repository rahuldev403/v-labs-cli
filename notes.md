1. "If Prospeo or Ocean.io returns duplicate domains or executives, how do you handle deduplication?"

The Trap: Saying "I just loop through and check." (O(n^2) time complexity is bad).

The Answer: "To ensure we don't spam the same executive or waste API credits, I would use a Set or a Map based on a unique identifier—like the linkedinUrl or the email. Before pushing a new contact into the verifiedContacts array, I’d check if that key already exists in the Set. It’s an O(1) lookup, making it highly efficient even if the pipeline processes thousands of leads."

2. "How did you handle API Rate Limits? What if Brevo blocks you for sending too fast?"

The Answer: "I specifically designed the pipeline to respect API limits using two strategies. For extraction (Prospeo), I built a processInBatches utility that fires requests in small chunks, with a hardcoded await delay(2500) cooldown between batches. For the Brevo outreach, I avoided Promise.all—which would fire all 30 emails in one millisecond and trigger a spam block. Instead, I used a sequential for...of loop with a 200ms delay between each dispatch to ensure a smooth, human-like sending cadence."

3. "What happens if an email hard-bounces or Brevo throws an error for a specific contact?"

The Answer: "The system is fault-tolerant. Inside the Brevo dispatch loop, the Axios POST request is wrapped in a try...catch block. If Brevo rejects an email (e.g., 'invalid sender'), the catch block logs the specific error and increments a failCount, but the loop continues to the next contact. It isolates the failure so one bad email doesn't crash the entire Node process."

4. "Why did you use Promise.allSettled instead of Promise.all in your batch processor?"

The Answer: "In a data pipeline, partial success is better than total failure. If I process 5 domains with Promise.all, and one domain throws a 404 error, the entire batch rejects and crashes. By using Promise.allSettled, the batch finishes and returns an array of objects with {status, value} or {status, reason}. I can then safely filter for status === 'fulfilled' and extract the valid data, completely ignoring the ones that failed."

5. "Let's say Prospeo changes their API response tomorrow. full_name becomes name. How did you write your code to survive that?"

The Answer: "I used defensive mapping with logical OR operators. When extracting the data, my code does: name: person.full_name || person.name || 'Unknown'. This ensures that if the API subtly changes its JSON keys, my pipeline gracefully falls back to the new key or a default string, rather than throwing a TypeError: Cannot read properties of undefined."

6. "Talk to me about the Authentication differences across the APIs you integrated."

(This proves you actually read the docs and didn't just copy-paste)

The Answer: "Every API had a unique security implementation, which was a great learning experience.

Prospeo used a custom header: X-KEY.

Ocean.io used a custom header: X-Api-Token.

Brevo was notoriously strict. It rejected standard Bearer tokens and strictly required an api-key header.

Eazyreach (Superflow) was the most complex. It required a two-step OAuth-style flow where I first had to POST my Client ID and Secret to a /createAuthToken endpoint, parse the authToken from the response, and dynamically inject it as a Bearer token into subsequent requests."

7. "What HTTP Status codes were you actively watching for?"

The Answer: "Outside of the standard 200 OK, I had to manage 429 Too Many Requests (which triggered my cooldown logic), 401 Unauthorized (which caught token expiration), and 500 Internal Server Error. For example, in the Ocean.io integration, I built a recursive retry function specifically to catch 500 level errors, wait 5 seconds, and retry the request up to 3 times before finally throwing an error."

1. "Tell us about yourself and why you want this internship."

Your Pitch: "I’m Rahul, currently pursuing my BS in Data Science at IIT Madras alongside my offline studies at PW IOI. I love building autonomous systems. This pipeline project was incredibly fun because it mirrors exactly what SubSpace does: taking messy data, integrating with external APIs, and automating a process to save users time. My dual background means I’m rigorous with data structures (from IITM) and hands-on with real-world application building. I saw that SubSpace encourages using AI tools to accelerate development, which is exactly how I built out the fault-tolerance in this pipeline. I want to bring that speed and resilience to your backend team."

<br/>

## 🎯 INTERVIEW SIMULATION & PREP GUIDE

### 1. Run it live (End-to-End Execution)

**Preparation:**

- Before screen-sharing, ensure your `.env` is loaded and API keys are funded/valid.
- **Safe seeds to use:** Pick an established mid-sized B2B tech company. E.g., `stripe.com`, `vercel.com`, or `linear.app`. Avoid massive consumer domains like `google.com` (yields garbage lookalikes) or tiny unknown sites (zero data).
- **Execution:** Run `node index.js`.
- **Talking Track live:** "As the pipeline starts, you'll notice I'm using libraries like `ora` (for the spinner) and `chalk` (for styling) to give the user immediate feedback. Right now, the Ocean.io API is resolving lookalikes, abstracting away the need for us to train our own NLP model..."

### 2. Walk the code (Architecture & API Decisions)

**Preparation:**

- **Structure (Separation of Concerns):** "I kept `index.js` strictly as the orchestrator and UI layer. All the heavy remote lifting is isolated in the `lib/` directory. If a provider like Prospeo sunsets their API tomorrow, I only have to rewrite `lib/prospeo.js`. The main timeline is untouched."
- **Auth Decisions:** Mention how every API required a radically different strategy.
  - "Ocean used standard custom headers (`X-Api-Token`)."
  - "Brevo rejected Bearer tokens entirely and strictly mandated an `api-key` header."
  - "Eazyreach required a multi-step flow where I first POSTed credentials to get an authToken to then inject dynamically as a Bearer."
- **Data Flow:** "The architecture flows sequentially: Seed String ➡️ Array of Domains ➡️ Array of Raw Contacts ➡️ Array of Verified Emails ➡️ Dispatcher loop."

### 3. Edge Cases (Reiteration for the deep dive phase)

_If they push you on scale, refer to the answers generated previously in the doc:_

- **Rate Limits:** "I enforce cooldowns. Between external extraction batches, I use manual `sleep()` functions. I intentionally avoid `Promise.all` during the email blast because firing 30 emails in one millisecond triggers spam filters; instead, a throttled `for...of` loop creates a human-like sending cadence."
- **De-duplication:** "O(1) lookups using a Map or Set mapped to the email address or LinkedIn URL before appending data."
- **Bounces/Fault Tolerance:** "Crucially, a single dead email shouldn't derail the batch. My dispatch module uses localized `try...catch` blocks. If an Axios POST throws a 400 Bad Request, I log the error for that single user and the loop cleanly moves to the next prospect."

### 4. LIVE TWEAK (Expect them to ask you to modify code on the spot)

Here are the most common tweaks interviewers ask for, and how to execute them live:

**Scenario A: "Can you filter the list to ONLY email people with 'Founder' or 'CEO' in their title?"**

- **How to execute:** Open `index.js`. Right before the table is rendered, add standard array filtering:
  ```javascript
  const targets = ["ceo", "founder", "co-founder"];
  verifiedContacts = verifiedContacts.filter((c) => {
    if (!c.title) return false;
    return targets.some((job) => c.title.toLowerCase().includes(job));
  });
  ```
- **Talking Track:** "Sure, I'll filter the `verifiedContacts` array using a case-insensitive check. I'll do this right before the safety checkpoint table, so we can visually confirm the filter worked before actually blasting the emails."

**Scenario B: "Can you add a hardcoded CC to every email we send?"**

- **How to execute:** Open `lib/brevo.js`. Locate the Axios payload object. Add a `cc` property as required by Brevo's REST spec:
  ```javascript
  const payload = {
    sender: { name: "Your Name", email: "your.email@domain.com" },
    to: [{ email: contact.email, name: contact.name }],
    cc: [{ email: "team@mycompany.com", name: "Internal" }], // <- ADD THIS
    subject: `...`,
  };
  ```

**Scenario C: "Can we dry-run this without actually burning Brevo credits?"**

- **How to execute:** In `lib/brevo.js`, comment out the actual `axios.post` block and immediately return a mock success, or add a quick `if (process.env.DRY_RUN)` check:
  ```javascript
  console.log(chalk.gray(`DRY RUN: Would send to ${contact.email}`));
  continue; // Skip the rest of the loop
  ```

### 5. Be honest (The Confidence Check)

If they expose a flaw or ask a systems design question beyond the script (e.g., "How would you deploy this script on AWS to run asynchronously for 100,000 domains?"):

- **Do not guess or pretend.**
- **The Answer:** "Right now, this codebase is strictly designed as a synchronous CLI utility. I haven't deployed a pipeline this complex to AWS Lambda yet. However, logically, I know we'd have to break this out of a while-loop and transition to an event-driven architecture—maybe using SQS to queue domains, and workers to process them. A working slice I can fully explain beats a broken architecture I can't. That’s actually why I want to join this team—to get reps converting scripts like this into robust backend microservices."
