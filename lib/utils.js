export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processInBatches(items, batchSize, asyncCallback) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(asyncCallback));
    results.push(...batchResults);

    if (i + batchSize < items.length) {
      console.log(`  Cooling down to respect rate limits...`);
      await delay(1500);
    }
  }
  return results;
}

// What it does: Holds your helper functions so your main files stay clean.

// The Logic: processInBatches takes a massive array of items, slices them into smaller chunks (e.g., 1 domain at a time), and uses Promise.allSettled.

// Why it's impressive: Promise.allSettled is an advanced Node.js concept. Unlike Promise.all (which crashes the entire app if one request fails), allSettled finishes the batch even if one domain returns a 404. The delay function perfectly handles the rate limits SubSpace warned you about.
