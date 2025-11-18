import { supabase } from "@/lib/supabaseClient";

/**
 * Fetches the total number of votes across both big tech companies and startups.
 * This provides a combined vote count for display on the voting pages.
 */
export const fetchTotalVotes = async (): Promise<number> => {
  // Fetch count from big tech matchups
  const { count: bigTechCount, error: bigTechError } = await supabase
    .from("matchups")
    .select("*", { count: "exact", head: true });

  if (bigTechError) {
    console.error("Error fetching big tech vote count:", bigTechError);
  }

  // Fetch count from startup matchups
  const { count: startupCount, error: startupError } = await supabase
    .from("startup_matchups")
    .select("*", { count: "exact", head: true });

  if (startupError) {
    console.error("Error fetching startup vote count:", startupError);
  }

  // Combine the counts
  const total = (bigTechCount ?? 0) + (startupCount ?? 0);

  return total;
};
