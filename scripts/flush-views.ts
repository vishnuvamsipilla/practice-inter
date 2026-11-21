// Task 3: move view counts from Redis to MySQL in one batch.
import "dotenv/config";

async function flushViews() {
  throw new Error("Not implemented");
}

flushViews()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
