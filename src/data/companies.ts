import { supabase } from "@/lib/supabaseClient";

export interface LatestReviewSummary {
  body: string;
  rating: number | null;
  author: string | null;
  createdAt: string | null;
  title: string | null;
}

export interface LeaderboardCompany {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  tags: string[];
  logoUrl: string | null;
  elo: number;
  rank: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  reviewCount: number;
  averageReviewScore: number | null;
  averagePay: number | null;
  averageCulture: number | null;
  averagePrestige: number | null;
  payDisplay: string;
  latestReview: LatestReviewSummary | null;
}

export interface EloHistoryEntry {
  createdAt: string;
  rating: number;
  rank: number | null;
}

export interface CompanyReview {
  id: number;
  companyId: string;
  rating: number;
  title: string | null;
  body: string;
  program: string | null;
  cohort: string | null;
  pay: number | null;
  culture: number | null;
  prestige: number | null;
  createdAt: string;
  authorId: string | null;
  authorName: string | null;
  likes: number;
  likedBy: string[];
}

export interface RecordMatchupResponseRow {
  company_id: string;
  rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  rank: number | null;
}

export interface VoteMatchupCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  tags: string[];
  elo: number;
  rank: number;
}

export interface VoteMatchupPayload {
  companies: [VoteMatchupCompany, VoteMatchupCompany];
  totalVotes: number;
}

const formatPay = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  const rounded = Math.round(value);
  if (!Number.isFinite(rounded) || rounded <= 0) {
    return "N/A";
  }

  return `$${rounded}/hr`;
};

const mapLeaderboardRow = (row: any): LeaderboardCompany => {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? null,
    description: row.description ?? null,
    tags: row.tags ?? [],
    logoUrl: row.logo_url ?? null,
    elo: Math.round(Number(row.rating ?? 0)),
    rank: row.rank ?? 0,
    matchesPlayed: row.matches_played ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    draws: row.draws ?? 0,
    reviewCount: row.review_count ?? 0,
    averageReviewScore: row.average_rating !== null ? Number(row.average_rating) : null,
    averagePay: row.average_pay !== null ? Number(row.average_pay) : null,
    averageCulture: row.average_culture !== null ? Number(row.average_culture) : null,
    averagePrestige: row.average_prestige !== null ? Number(row.average_prestige) : null,
    payDisplay: formatPay(row.average_pay !== null ? Number(row.average_pay) : null),
    latestReview:
      row.latest_review_body || row.latest_review_title
        ? {
            body: row.latest_review_body ?? "",
            title: row.latest_review_title ?? null,
            rating: row.latest_review_rating !== null ? Number(row.latest_review_rating) : null,
            author: row.latest_review_author ?? null,
            createdAt: row.latest_review_created_at ?? null,
          }
        : null,
  };
};

export const fetchLeaderboardCompanies = async (): Promise<LeaderboardCompany[]> => {
  const { data, error } = await supabase
    .from("company_leaderboard")
    .select("*")
    .order("rank", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapLeaderboardRow);
};

export const fetchCompanyLeaderboardEntry = async (
  companyId: string
): Promise<LeaderboardCompany | null> => {
  const { data, error } = await supabase
    .from("company_leaderboard")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapLeaderboardRow(data);
};

export const fetchCompanyEloHistory = async (companyId: string): Promise<EloHistoryEntry[]> => {
  const { data, error } = await supabase
    .from("elo_history")
    .select("rating, rank, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ? [...data].reverse() : [];

  return rows.map((row) => ({
    createdAt: row.created_at,
    rating: Math.round(Number(row.rating ?? 0)),
    rank: row.rank ?? null,
  }));
};

export const fetchCompanyReviews = async (companyId: string): Promise<CompanyReview[]> => {
  const { data, error } = await supabase
    .from("company_reviews_with_meta")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    companyId: row.company_id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    program: row.program,
    cohort: row.cohort,
    pay: row.pay !== null ? Number(row.pay) : null,
    culture: row.culture !== null ? Number(row.culture) : null,
    prestige: row.prestige !== null ? Number(row.prestige) : null,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName: row.author_name,
    likes: row.likes ?? 0,
    likedBy: row.liked_by ?? [],
  }));
};

export const submitReview = async (
  companyId: string,
  payload: {
    rating: number;
    body: string;
    title?: string | null;
    program?: string | null;
    cohort?: string | null;
    pay?: number | null;
    culture?: number | null;
    prestige?: number | null;
  },
  authorId?: string | null
) => {
  const insertPayload = {
    company_id: companyId,
    rating: payload.rating,
    body: payload.body,
    title: payload.title ?? null,
    program: payload.program ?? null,
    cohort: payload.cohort ?? null,
    pay: payload.pay ?? null,
    culture: payload.culture ?? null,
    prestige: payload.prestige ?? null,
    author_id: authorId ?? null,
  };

  const { error } = await supabase.from("reviews").insert(insertPayload);

  if (error) {
    throw new Error(error.message);
  }
};

export const toggleReviewReaction = async (reviewId: number, userId: string) => {
  const { data, error } = await supabase
    .from("review_reactions")
    .select("review_id")
    .eq("review_id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    const { error: deleteError } = await supabase
      .from("review_reactions")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return { liked: false };
  }

  const { error: insertError } = await supabase
    .from("review_reactions")
    .insert({ review_id: reviewId, user_id: userId });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { liked: true };
};

export const recordMatchup = async (params: {
  companyA: string;
  companyB: string;
  result: "a" | "b" | "draw";
  submittedBy?: string | null;
}): Promise<RecordMatchupResponseRow[]> => {
  const { data, error } = await supabase.rpc("record_matchup", {
    company_a: params.companyA,
    company_b: params.companyB,
    result: params.result,
    submitted_by: params.submittedBy ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const fetchVoteMatchup = async (): Promise<VoteMatchupPayload> => {
  const { data, error } = await supabase
    .from("company_leaderboard")
    .select("id, name, logo_url, tags, rating, rank");

  if (error) {
    throw new Error(error.message);
  }

  const companies = (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url ?? null,
    tags: Array.isArray(row.tags)
      ? row.tags.map((tag: string) => tag.toUpperCase())
      : [],
    elo: Math.round(Number(row.rating ?? 0)),
    rank: row.rank ?? 0,
  }));

  if (companies.length < 2) {
    throw new Error("Need at least two companies for head-to-head voting.");
  }

  const pool = [...companies];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let matchup: [VoteMatchupCompany, VoteMatchupCompany] | null = null;
  const eloWindow = 300;

  for (let i = 0; i < pool.length; i += 1) {
    const base = pool[i];
    const opponents = pool.filter(
      candidate => candidate.id !== base.id && Math.abs(candidate.elo - base.elo) <= eloWindow
    );

    if (opponents.length === 0) {
      continue;
    }

    const opponent = opponents[Math.floor(Math.random() * opponents.length)];
    matchup = [base, opponent];
    break;
  }

  if (!matchup) {
    matchup = [pool[0], pool[1]];
  }

  const { count, error: countError } = await supabase
    .from("matchups")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    companies: matchup,
    totalVotes: count ?? 0,
  };
};
