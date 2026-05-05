const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function parseDotEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return acc;
    const [key, ...rest] = trimmed.split("=");
    acc[key] = rest.join("=").trim();
    return acc;
  }, {});
}

const envPath = path.resolve(__dirname, "..", ".env.local");
const env = parseDotEnv(envPath);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Unable to read Supabase URL or SERVICE_ROLE_KEY from .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = "akhaan686@gmail.com";
  const password = "Admin@1234";

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Supabase error:", error.message || error);
      process.exit(1);
    }

    console.log("User seeded successfully:", data?.user?.email);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

main();
