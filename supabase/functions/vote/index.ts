import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VoteRequestPayload {
  companyA?: string;
  companyB?: string;
  result?: "a" | "b" | "draw";
  submittedBy?: string | null;
  hcaptchaToken?: string | null;
  sessionToken?: string | null;
}

type SessionContext = {
  ip: string | null;
  submitter: string | null;
};

type SessionPayload = {
  exp: number;
  ip: string | null;
  sub: string | null;
};

const resolveEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
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
const SESSION_SECRET = resolveEnv("VOTE_SESSION_SECRET");
const SESSION_TTL_SECONDS =
  Number.parseInt(resolveEnv("VOTE_SESSION_TTL") ?? "", 10) > 0
    ? Number.parseInt(resolveEnv("VOTE_SESSION_TTL") ?? "", 10)
    : 3600;

if (!SUPABASE_URL) {
  console.warn("Missing SUPABASE_URL environment variable");
}

if (!SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

if (!HCAPTCHA_SECRET) {
  console.warn("Missing HCAPTCHA_SECRET_KEY environment variable");
}

if (!SESSION_SECRET) {
  console.warn(
    "Missing VOTE_SESSION_SECRET environment variable. Captcha will be required for every vote."
  );
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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
  body: Record<string, unknown> | null,
  origin: string | null
) =>
  new Response(JSON.stringify(body ?? {}), {
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

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

let sessionKeyPromise: Promise<CryptoKey | null> | null = null;

const getSessionKey = (): Promise<CryptoKey | null> => {
  if (!SESSION_SECRET) {
    return Promise.resolve(null);
  }

  if (!sessionKeyPromise) {
    sessionKeyPromise = crypto.subtle
      .importKey(
        "raw",
        encoder.encode(SESSION_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      )
      .catch(() => null);
  }

  return sessionKeyPromise;
};

const createSessionToken = async (context: SessionContext): Promise<string | null> => {
  const key = await getSessionKey();
  if (!key) {
    return null;
  }

  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    ip: context.ip ?? null,
    sub: context.submitter ?? null,
  };

  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadPart = base64UrlEncode(payloadBytes);

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadPart));
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadPart}.${signature}`;
};

const verifySessionToken = async (
  token: string,
  context: SessionContext
): Promise<boolean> => {
  if (!token) {
    return false;
  }

  const key = await getSessionKey();
  if (!key) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadPart, signaturePart] = parts;
  const signatureBytes = base64UrlDecode(signaturePart);

  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payloadPart)
  );

  if (!isValidSignature) {
    return false;
  }

  let payload: SessionPayload | null = null;
  try {
    payload = JSON.parse(decoder.decode(base64UrlDecode(payloadPart))) as SessionPayload;
  } catch (_error) {
    return false;
  }

  if (
    !payload ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  if (payload.ip && context.ip && payload.ip !== context.ip) {
    return false;
  }

  if (payload.sub && context.submitter && payload.sub !== context.submitter) {
    return false;
  }

  return true;
};

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

  const sessionContext: SessionContext = {
    ip: remoteIp,
    submitter: payload.submittedBy ?? null,
  };

  let sessionValidated = false;

  const incomingSessionToken = (payload.sessionToken ?? "").trim();
  if (incomingSessionToken) {
    try {
      sessionValidated = await verifySessionToken(incomingSessionToken, sessionContext);
    } catch (_error) {
      sessionValidated = false;
    }
  }

  if (!sessionValidated) {
    const captchaToken = (payload.hcaptchaToken ?? "").trim();
    if (!captchaToken) {
      return jsonResponse(
        403,
        {
          error: "Captcha verification required.",
          errorCode: "captcha_required",
        },
        origin
      );
    }

    const captchaResult = await verifyHCaptcha(captchaToken, remoteIp);
    if (!captchaResult.ok) {
      return jsonResponse(
        403,
        {
          error: captchaResult.error,
          errorCode: "captcha_failed",
        },
        origin
      );
    }

    sessionValidated = true;
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

  let nextSessionToken: string | null = null;
  if (sessionValidated) {
    try {
      nextSessionToken = await createSessionToken(sessionContext);
    } catch (_error) {
      nextSessionToken = null;
    }
  }

  return jsonResponse(
    200,
    {
      data: data ?? [],
      sessionToken: nextSessionToken,
    },
    origin
  );
});
