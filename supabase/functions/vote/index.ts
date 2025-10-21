import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VoteRequestPayload {
  companyA?: string;
  companyB?: string;
  result?: "a" | "b" | "draw";
  submittedBy?: string | null;
  hcaptchaToken?: string;
}

const resolveEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const SUPABASE_URL = resolveEnv("EDGE_SUPABASE_URL", "SUPABASE_URL");
const SERVICE_ROLE_KEY = resolveEnv("EDGE_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY");
const HCAPTCHA_SECRET = resolveEnv("HCAPTCHA_SECRET_KEY");
const ALLOWED_ORIGINS = (resolveEnv("ALLOWED_VOTE_ORIGINS") ?? "")
  .split(",")
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

if (!SUPABASE_URL) {
  console.warn("Missing SUPABASE_URL environment variable");
}

if (!SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

if (!HCAPTCHA_SECRET) {
  console.warn("Missing HCAPTCHA_SECRET_KEY environment variable");
}

const buildCorsHeaders = (origin: string | null) => {
  const allowedOrigin =
    (origin && ALLOWED_ORIGINS.includes(origin) && origin) ||
    ALLOWED_ORIGINS[0] ||
    "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
};

const jsonResponse = (
  status: number,
  body: Record<string, unknown>,
  origin: string | null
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...buildCorsHeaders(origin),
    },
  });

const validatePayload = (payload: VoteRequestPayload) => {
  if (!payload) {
    return "Missing request body.";
  }

  if (!payload.hcaptchaToken) {
    return "Missing hCaptcha token.";
  }

  if (!payload.companyA || !payload.companyB) {
    return "Missing company identifiers.";
  }

  if (payload.companyA === payload.companyB) {
    return "companyA and companyB must be different.";
  }

  if (payload.result !== "a" && payload.result !== "b" && payload.result !== "draw") {
    return "Result must be one of: a, b, draw.";
  }

  return null;
};

const verifyHCaptcha = async (token: string, remoteIp: string | null) => {
  if (!HCAPTCHA_SECRET) {
    return {
      ok: false,
      error: "Server misconfiguration: missing hCaptcha secret.",
    };
  }

  const body = new URLSearchParams({
    secret: HCAPTCHA_SECRET,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return {
      ok: false,
      error: "Failed to reach hCaptcha verification service.",
    };
  }

  const result = await response.json();

  if (result.success !== true) {
    const codes = Array.isArray(result["error-codes"]) ? result["error-codes"] : [];
    return {
      ok: false,
      error: `hCaptcha verification failed: ${codes.join(", ") || "unknown error"}.`,
    };
  }

  return { ok: true as const };
};

const supabaseAdminClient =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

serve(async req => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...buildCorsHeaders(origin),
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." }, origin);
  }

  if (!supabaseAdminClient) {
    return jsonResponse(
      500,
      { error: "Server misconfiguration: missing Supabase credentials." },
      origin
    );
  }

  let payload: VoteRequestPayload;

  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse(400, { error: "Invalid JSON body." }, origin);
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return jsonResponse(400, { error: validationError }, origin);
  }

  const remoteIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    null;

  const captchaResult = await verifyHCaptcha(payload.hcaptchaToken!, remoteIp);
  if (!captchaResult.ok) {
    return jsonResponse(403, { error: captchaResult.error }, origin);
  }

  const { companyA, companyB, result, submittedBy = null } = payload;

  const { data, error } = await supabaseAdminClient.rpc("record_matchup", {
    company_a: companyA,
    company_b: companyB,
    result,
    submitted_by: submittedBy,
  });

  if (error) {
    console.error("record_matchup error:", error);
    return jsonResponse(500, { error: "Failed to record vote." }, origin);
  }

  return jsonResponse(200, { data: data ?? [] }, origin);
});
