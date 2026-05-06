const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const bucket = "avatars";
  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
  });

  if (error && error.message && !error.message.includes("already exists")) {
    console.error("Failed to create bucket:", error.message);
    process.exit(1);
  }

  console.log(`Bucket '${bucket}' is ready.`);
}

main();
