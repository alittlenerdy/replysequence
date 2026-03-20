/**
 * Hunter.io API client — Email Finder & Verifier
 *
 * Requires HUNTER_API_KEY env var. Returns null gracefully when not configured.
 * Uses fetch directly (no SDK).
 *
 * Docs: https://hunter.io/api-documentation/v2
 */

const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

// ── Types ───────────────────────────────────────────────────────────────

export interface HunterSource {
  domain: string;
  uri: string;
  extracted_on: string;
  last_seen_on: string;
  still_on_page: boolean;
}

export interface HunterEmailFinderResult {
  email: string;
  score: number;
  status: string; // 'valid' | 'accept_all' | 'unknown' | etc.
  sources: HunterSource[];
  firstName: string;
  lastName: string;
  domain: string;
}

export interface HunterEmailVerifyResult {
  email: string;
  score: number;
  status: string; // 'valid' | 'invalid' | 'accept_all' | 'unknown' | 'disposable' | 'webmail'
  result: string; // 'deliverable' | 'undeliverable' | 'risky' | 'unknown'
  sources: HunterSource[];
}

// ── Helpers ─────────────────────────────────────────────────────────────

function getApiKey(): string | null {
  return process.env.HUNTER_API_KEY || null;
}

// ── Email Finder ────────────────────────────────────────────────────────

/**
 * Find an email address for a person at a given domain.
 *
 * @param firstName - Person's first name
 * @param lastName - Person's last name
 * @param domain - Company domain (e.g. "acme.com")
 * @returns The finder result, or null if API key is missing or request fails
 */
export async function findEmail(
  firstName: string,
  lastName: string,
  domain: string
): Promise<HunterEmailFinderResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      first_name: firstName,
      last_name: lastName,
      domain,
      api_key: apiKey,
    });

    const res = await fetch(`${HUNTER_BASE_URL}/email-finder?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Hunter.io email-finder failed',
          status: res.status,
          body,
        })
      );
      return null;
    }

    const json = await res.json();
    const data = json.data;

    if (!data?.email) return null;

    return {
      email: data.email,
      score: data.score ?? 0,
      status: data.verification?.status ?? 'unknown',
      sources: (data.sources ?? []).map((s: Record<string, unknown>) => ({
        domain: s.domain as string,
        uri: s.uri as string,
        extracted_on: s.extracted_on as string,
        last_seen_on: s.last_seen_on as string,
        still_on_page: s.still_on_page as boolean,
      })),
      firstName,
      lastName,
      domain,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Hunter.io email-finder exception',
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return null;
  }
}

// ── Email Verifier ──────────────────────────────────────────────────────

/**
 * Verify the deliverability of an email address.
 *
 * @param email - The email address to verify
 * @returns The verification result, or null if API key is missing or request fails
 */
export async function verifyEmail(
  email: string
): Promise<HunterEmailVerifyResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      email,
      api_key: apiKey,
    });

    const res = await fetch(`${HUNTER_BASE_URL}/email-verifier?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Hunter.io email-verifier failed',
          status: res.status,
          body,
        })
      );
      return null;
    }

    const json = await res.json();
    const data = json.data;

    if (!data) return null;

    return {
      email: data.email,
      score: data.score ?? 0,
      status: data.status ?? 'unknown',
      result: data.result ?? 'unknown',
      sources: (data.sources ?? []).map((s: Record<string, unknown>) => ({
        domain: s.domain as string,
        uri: s.uri as string,
        extracted_on: s.extracted_on as string,
        last_seen_on: s.last_seen_on as string,
        still_on_page: s.still_on_page as boolean,
      })),
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Hunter.io email-verifier exception',
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return null;
  }
}
