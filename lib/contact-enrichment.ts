/**
 * Contact Enrichment via Clearbit API
 *
 * Enriches contacts with company data, job titles, and social profiles.
 * Gracefully degrades when CLEARBIT_API_KEY is not set.
 */

export interface EnrichmentResult {
  fullName: string | null;
  title: string | null;
  company: string | null;
  companyDomain: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
}

interface ClearbitPerson {
  id: string;
  fullName: string | null;
  employment: {
    title: string | null;
    name: string | null;
    domain: string | null;
  } | null;
  linkedin: { handle: string | null } | null;
  avatar: string | null;
}

interface ClearbitCompany {
  id: string;
  name: string | null;
  domain: string | null;
}

interface ClearbitCombinedResponse {
  person: ClearbitPerson | null;
  company: ClearbitCompany | null;
}

// Simple in-memory cache to avoid re-enriching in the same process lifetime
const enrichmentCache = new Map<string, { result: EnrichmentResult | null; fetchedAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Enrich a contact by email using the Clearbit Combined API.
 * Returns null if no API key is configured or if the lookup fails.
 */
export async function enrichContact(email: string): Promise<EnrichmentResult | null> {
  const apiKey = process.env.CLEARBIT_API_KEY;
  if (!apiKey) {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check in-memory cache
  const cached = enrichmentCache.get(normalizedEmail);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const response = await fetch(
      `https://api.clearbit.com/v2/combined/find?email=${encodeURIComponent(normalizedEmail)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // 404 = person not found, 422 = invalid email — not errors, just no data
      if (response.status === 404 || response.status === 422) {
        enrichmentCache.set(normalizedEmail, { result: null, fetchedAt: Date.now() });
        return null;
      }
      console.error(`Clearbit API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: ClearbitCombinedResponse = await response.json();

    const result: EnrichmentResult = {
      fullName: data.person?.fullName || null,
      title: data.person?.employment?.title || null,
      company: data.person?.employment?.name || data.company?.name || null,
      companyDomain: data.person?.employment?.domain || data.company?.domain || null,
      linkedinUrl: data.person?.linkedin?.handle
        ? `https://linkedin.com/in/${data.person.linkedin.handle}`
        : null,
      avatarUrl: data.person?.avatar || null,
    };

    enrichmentCache.set(normalizedEmail, { result, fetchedAt: Date.now() });
    return result;
  } catch (error) {
    console.error('Clearbit enrichment failed:', error);
    return null;
  }
}
