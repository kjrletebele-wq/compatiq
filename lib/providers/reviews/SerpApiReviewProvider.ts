import type { ReviewProvider } from './ReviewProvider';
import type { ReviewSearchInput, ReviewSearchResult, ReviewSignal } from '@/lib/types/reviews';
import {
  makeNotConfiguredStatus, makeConnectedStatus, makeFailedStatus, makeNoResultsStatus,
} from '@/lib/types/providers';
import { serpApiIsConfigured, serpApiSearch } from '@/lib/providers/search/SerpApiClient';
import { classifyReviewResult, buildReviewDeviceQuery } from '@/lib/logic/reviewMatchEngine';

export class SerpApiReviewProvider implements ReviewProvider {
  name = 'SerpApi Search (Reviews)';

  isConfigured(): boolean {
    return serpApiIsConfigured();
  }

  async searchReviews(input: ReviewSearchInput): Promise<ReviewSearchResult> {
    const now = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        success: false,
        providerStatuses: [makeNotConfiguredStatus(this.name)],
        signals: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }

    try {
      // Build a focused query including CPU number for exact-model searches
      const cleanDevice = buildReviewDeviceQuery(input.device, input.specs);

      // Run 4 targeted searches in parallel
      const [generalData, batteryData, performanceData, buildData] = await Promise.allSettled([
        serpApiSearch({ q: `${cleanDevice} review pros cons 2024`, num: 10 }),
        serpApiSearch({ q: `${cleanDevice} battery life review`, num: 8 }),
        serpApiSearch({ q: `${cleanDevice} performance benchmark review`, num: 8 }),
        serpApiSearch({ q: `${cleanDevice} build quality keyboard display review`, num: 8 }),
      ]);

      type SearchResult = { snippet: string; title: string; link: string };

      // Flatten all snippets per category
      const extract = (settled: PromiseSettledResult<Awaited<ReturnType<typeof serpApiSearch>>>): SearchResult[] =>
        settled.status === 'fulfilled'
          ? (settled.value.organic_results ?? []).map(r => ({ snippet: r.snippet ?? '', title: r.title ?? '', link: r.link ?? '' }))
          : [];

      const generalResults = extract(generalData);
      const batteryResults = extract(batteryData);
      const performanceResults = extract(performanceData);
      const buildResults = extract(buildData);

      const allResults = [...generalResults, ...batteryResults, ...performanceResults, ...buildResults];

      if (allResults.length === 0) {
        return {
          success: false,
          providerStatuses: [makeNoResultsStatus(this.name)],
          signals: [],
          warnings: [],
          lastCheckedAt: now,
        };
      }

      // Classify each result by how well it matches the exact target device
      const classify = (r: SearchResult) =>
        classifyReviewResult(`${r.title} ${r.snippet}`, input.device, input.specs);

      const classified = allResults.map(r => ({ ...r, matchType: classify(r) }));

      // Filter by match quality — exclude unrelated and conflicting variants
      const exactResults = classified.filter(r => r.matchType === 'exactDevice');
      const familyResults = classified.filter(r => r.matchType === 'sameModelFamily');

      // Use exact results first; fall back to family results if insufficient
      const hasExact = exactResults.length >= 2;
      const useResults = hasExact
        ? { general: filterByCategory(exactResults, generalResults), battery: filterByCategory(exactResults, batteryResults), performance: filterByCategory(exactResults, performanceResults), build: filterByCategory(exactResults, buildResults) }
        : { general: filterByCategory([...exactResults, ...familyResults], generalResults), battery: filterByCategory([...exactResults, ...familyResults], batteryResults), performance: filterByCategory([...exactResults, ...familyResults], performanceResults), build: filterByCategory([...exactResults, ...familyResults], buildResults) };

      const usableCount = useResults.general.length + useResults.battery.length + useResults.performance.length + useResults.build.length;

      if (usableCount === 0) {
        // No matching results at all
        return {
          success: true,
          providerStatuses: [makeConnectedStatus(this.name, `Searched ${allResults.length} snippets — no matching review signals for this exact device.`)],
          signals: [{
            sourceName: 'Web review synthesis (via SerpApi)',
            sourceUrl: null,
            overallSentiment: 'neutral',
            reviewSummary: `We couldn't find any reviews that specifically matched this model out of ${allResults.length} search results.`,
            commonPraises: [],
            commonComplaints: [],
            batteryConcerns: [],
            performanceConcerns: [],
            buildQualityConcerns: [],
            reliabilityConcerns: [],
            valueForMoneyComments: [],
            lastCheckedAt: now,
            confidence: 'low',
            matchCoverage: 'family',
            noExactSignals: true,
          }],
          warnings: [],
          lastCheckedAt: now,
        };
      }

      const matchCoverage: ReviewSignal['matchCoverage'] = hasExact
        ? (familyResults.length === 0 ? 'exact' : 'mixed')
        : 'family';

      const signal = synthesiseSignal(
        cleanDevice,
        useResults.general,
        useResults.battery,
        useResults.performance,
        useResults.build,
        now,
        matchCoverage,
        !hasExact,
      );

      return {
        success: !!signal,
        providerStatuses: [makeConnectedStatus(
          this.name,
          `Analysed ${usableCount} matched snippets (${exactResults.length} exact, ${familyResults.length} family) from ${allResults.length} total results.`,
        )],
        signals: signal ? [signal] : [],
        warnings: [],
        lastCheckedAt: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown SerpApi error';
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit');
      return {
        success: false,
        providerStatuses: [{
          providerName: this.name,
          connected: false,
          status: isRateLimit ? 'rate-limited' : 'failed',
          message: msg,
          lastCheckedAt: now,
        }],
        signals: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ClassifiedResult = { snippet: string; title: string; link: string; matchType: string };

/**
 * From the set of classified (matched) results, keep only those that also
 * appear in the original category results list.
 */
function filterByCategory(
  matched: ClassifiedResult[],
  categoryOriginals: { snippet: string; title: string; link: string }[],
): { snippet: string; title: string; link: string }[] {
  const linkSet = new Set(categoryOriginals.map(r => r.link));
  return matched.filter(r => linkSet.has(r.link));
}

// ─── Signal synthesis ─────────────────────────────────────────────────────────

type SearchResult = { snippet: string; title: string; link: string };

function allSnippets(results: SearchResult[]): string {
  return results.map(r => r.snippet).filter(Boolean).join(' ');
}

/**
 * Extract complete review phrases from snippets that contain a keyword.
 * Returns up to `max` unique, well-formed phrases.
 *
 * Guards applied on every phrase candidate:
 *  1. Must be an actual review statement — not a question, help request, or
 *     pre-purchase intent comment (e.g. "guys help me with a laptop",
 *     "should I buy this?", "thinking of buying").
 *  2. Must have at least 5 meaningful words.
 *  3. Takes the COMPLETE sentence rather than a hard word-count slice, so
 *     phrases are never cut off mid-thought. Capped gracefully at ~160 chars.
 */

/** Sentences that end with "?" are questions, not review opinions. */
const QUESTION_RE = /\?/;

/**
 * Patterns that indicate the sentence is a help-seeking or pre-purchase
 * intent comment — not a concluded opinion from someone who owns the device.
 */
const NON_REVIEW_SIGNALS = new RegExp(
  '\\b(' +
  'help\\s+me|guys?\\s+help|pls?\\s+help|please\\s+help|need\\s+help|' +
  'should\\s+i\\s+(buy|get|choose)|which\\s+(laptop|phone|device)\\s+should|' +
  'can\\s+someone|anyone\\s+(know|have|tried|recommend)|does\\s+anyone|' +
  'looking\\s+for\\s+(a\\s+)?(laptop|phone|device|advice|recommendation)|' +
  'need\\s+(advice|a\\s+recommendation)|recommend\\s+me|' +
  'thinking\\s+of\\s+(buying|getting)|planning\\s+to\\s+(buy|get)|' +
  'want\\s+to\\s+(buy|get)|considering\\s+(buying|getting|this)|' +
  'is\\s+it\\s+worth\\s+(buying|getting)|what\\s+should\\s+i\\s+(buy|get)|' +
  'i\\s+am\\s+looking|im\\s+looking|asking\\s+for|' +
  'what\\s+do\\s+you\\s+(think|recommend)' +
  ')\\b',
  'i'
);

/** Weak words that should not be left dangling at the end of an extracted phrase. */
const TRAILING_WEAK = new RegExp(
  '\\s+(and|but|or|with|for|of|the|a|an|in|on|at|to|by|as|is|are|was|were|' +
  'that|which|this|it|its|also|so|very|quite|more|even|just|still|then|than|' +
  'yet|though|when|where|while|since|because|if|although|however|despite|' +
  'including|such|like|about|both|from|into|during|before|after|among|through|' +
  'against|near|upon)\\s*$',
  'i'
);

const NEGATIVE_SIGNALS = /\b(but|however|although|except|only okay|not great|poor|bad|disappointing|dim|slow|lag|cheap|flimsy|unfortunately|downside|drawback|issue|problem|cons?:)\b/i;

function extractPhrases(text: string, keywords: RegExp, max: number, excludeNegative = false): string[] {
  const sentences = text.split(/[.!?;]/);
  const found: string[] = [];

  for (const raw of sentences) {
    const sentence = raw.trim();

    // ── Hard filters ─────────────────────────────────────────────────────────
    if (sentence.length < 15) continue;                       // too short to be meaningful
    if (!keywords.test(sentence)) continue;                   // doesn't match topic keyword
    if (QUESTION_RE.test(raw)) continue;                      // is a question — skip
    if (NON_REVIEW_SIGNALS.test(sentence)) continue;          // help request / pre-purchase intent
    if (excludeNegative && NEGATIVE_SIGNALS.test(sentence)) continue;

    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length < 5) continue;                           // need at least 5 words

    // ── Build a clean, complete phrase ───────────────────────────────────────
    let phrase = sentence
      .replace(/\s*\.{2,}\s*/g, ' ')   // collapse ellipsis (SerpApi truncation artefact)
      .replace(/^\W+/, '')              // strip leading punctuation / special chars
      .trim();

    // Cap at ~160 chars; try to cut at the last comma before the limit so the
    // phrase ends at a natural clause boundary rather than mid-word.
    if (phrase.length > 160) {
      const commaAt = phrase.lastIndexOf(',', 160);
      phrase = commaAt > 60 ? phrase.slice(0, commaAt).trim() : phrase.slice(0, 160).trim();
    }

    // Strip dangling conjunctions / prepositions left at the tail
    phrase = phrase.replace(TRAILING_WEAK, '').trim();

    // Capitalise first letter
    const clean = phrase.charAt(0).toUpperCase() + phrase.slice(1);

    if (
      clean.length > 15 &&
      !found.some(f => f.toLowerCase().startsWith(clean.toLowerCase().slice(0, 25)))
    ) {
      found.push(clean);
      if (found.length >= max) break;
    }
  }
  return found;
}

function synthesiseSignal(
  deviceName: string,
  generalResults: SearchResult[],
  batteryResults: SearchResult[],
  performanceResults: SearchResult[],
  buildResults: SearchResult[],
  now: string,
  matchCoverage: ReviewSignal['matchCoverage'],
  noExactSignals: boolean,
): ReviewSignal | null {
  const generalText = allSnippets(generalResults);
  const batteryText = allSnippets(batteryResults);
  const performanceText = allSnippets(performanceResults);
  const buildText = allSnippets(buildResults);
  const allText = [generalText, batteryText, performanceText, buildText].join(' ');

  if (!allText.trim()) return null;

  const s = allText.toLowerCase();

  // ── Praises ──────────────────────────────────────────────────────────────────
  const praises: string[] = [];

  if (/\b(fast|snappy|quick|responsive|smooth|fluid|speedy)\b/.test(s))
    praises.push(...extractPhrases(allText, /fast|snappy|quick|responsive|smooth|fluid|speedy/i, 2, true));

  if (/\b(great display|vivid|bright screen|excellent screen|beautiful display|good screen|gorgeous display)\b/.test(s))
    praises.push(...extractPhrases(allText, /great display|vivid|bright screen|excellent screen|beautiful display|good screen|gorgeous display/i, 2, true));

  if (/\b(good battery|great battery|long battery|all[- ]day|excellent battery|impressive battery)\b/.test(s))
    praises.push(...extractPhrases(allText, /good battery|great battery|long battery|all[- ]day|excellent battery|impressive battery/i, 2, true));

  if (/\b(value for money|affordable|great price|good deal|budget[- ]friendly|best value)\b/.test(s))
    praises.push(...extractPhrases(allText, /value for money|affordable|great price|good deal|budget[- ]friendly|best value/i, 2, true));

  if (/\b(lightweight|thin|portable|slim|compact|easy to carry)\b/.test(s))
    praises.push(...extractPhrases(allText, /lightweight|thin|portable|slim|compact|easy to carry/i, 1, true));

  if (/\b(solid build|premium|sturdy|well[- ]built|durable|good build)\b/.test(s))
    praises.push(...extractPhrases(allText, /solid build|premium|sturdy|well[- ]built|durable|good build/i, 1, true));

  const uniquePraises = dedup(praises, 5);

  // ── Complaints ────────────────────────────────────────────────────────────────
  const complaints: string[] = [];

  if (/\b(slow|lag|sluggish|stutter|freeze|crawl)\b/.test(s))
    complaints.push(...extractPhrases(allText, /slow|lag|sluggish|stutter|freeze|crawl/i, 2));

  if (/\b(poor battery|short battery|battery drain|dies fast|disappointing battery)\b/.test(s))
    complaints.push(...extractPhrases(allText, /poor battery|short battery|battery drain|dies fast|disappointing battery/i, 2));

  if (/\b(dim|low brightness|poor display|washed out|not bright)\b/.test(s))
    complaints.push(...extractPhrases(allText, /dim|low brightness|poor display|washed out|not bright/i, 2));

  if (/\b(plastic|cheap|flimsy|flex|creak|poor build|fragile)\b/.test(s))
    complaints.push(...extractPhrases(allText, /plastic|cheap|flimsy|flex|creak|poor build|fragile/i, 2));

  if (/\b(loud fan|noisy|fan noise)\b/.test(s))
    complaints.push(...extractPhrases(allText, /loud fan|noisy|fan noise/i, 1));

  if (/\b(poor keyboard|mushy key|bad trackpad|small trackpad)\b/.test(s))
    complaints.push(...extractPhrases(allText, /poor keyboard|mushy key|bad trackpad|small trackpad/i, 1));

  const uniqueComplaints = dedup(complaints, 5);

  // ── Battery ───────────────────────────────────────────────────────────────────
  const batteryConcerns: string[] = [];
  const bt = batteryText.toLowerCase();

  if (/\b(hours?|battery life|wh|watt[- ]?hour)\b/.test(bt)) {
    const hourMatches = [...batteryText.matchAll(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?hours?/gi)];
    if (hourMatches.length > 0) {
      const hours = hourMatches.map(m => parseFloat(m[1])).filter(h => h >= 1 && h <= 30);
      if (hours.length > 0) {
        const min = Math.min(...hours);
        const max = Math.max(...hours);
        if (min !== max) {
          batteryConcerns.push(`Battery life reported between ${min}–${max} hours depending on workload`);
        } else {
          batteryConcerns.push(`Battery life reported around ${min} hours`);
        }
      }
    }
  }

  if (/\b(poor battery|short battery|battery drain|dies fast|disappointing battery|not great battery)\b/.test(bt))
    batteryConcerns.push(...extractPhrases(batteryText, /poor battery|short battery|battery drain|dies fast|disappointing battery|not great battery/i, 2));

  if (/\b(good battery|great battery|long battery|all[- ]day|impressive battery)\b/.test(bt))
    batteryConcerns.push(...extractPhrases(batteryText, /good battery|great battery|long battery|all[- ]day|impressive battery/i, 1));

  // ── Performance ───────────────────────────────────────────────────────────────
  const performanceConcerns: string[] = [];
  const pt = performanceText.toLowerCase();

  if (/\b(hot|overheat|thermal|heat|throttle|throttling)\b/.test(pt))
    performanceConcerns.push(...extractPhrases(performanceText, /hot|overheat|thermal|heat|throttle|throttling/i, 2));

  if (/\b(slow|lag|stutter|sluggish)\b/.test(pt))
    performanceConcerns.push(...extractPhrases(performanceText, /slow|lag|stutter|sluggish/i, 2));

  if (/\b(fast|smooth|great performance|handles|capable|benchmark)\b/.test(pt))
    performanceConcerns.push(...extractPhrases(performanceText, /fast|smooth|great performance|handles|capable|benchmark/i, 2));

  // ── Build quality ─────────────────────────────────────────────────────────────
  const buildQualityConcerns: string[] = [];
  const bq = buildText.toLowerCase();

  if (/\b(plastic|cheap feel|flimsy|flex|creak)\b/.test(bq))
    buildQualityConcerns.push(...extractPhrases(buildText, /plastic|cheap feel|flimsy|flex|creak/i, 2));

  if (/\b(solid|sturdy|well[- ]built|premium feel|good build|quality feel)\b/.test(bq))
    buildQualityConcerns.push(...extractPhrases(buildText, /solid|sturdy|well[- ]built|premium feel|good build|quality feel/i, 2));

  if (/\b(keyboard|trackpad|touchpad|hinge|screen flex)\b/.test(bq))
    buildQualityConcerns.push(...extractPhrases(buildText, /keyboard|trackpad|touchpad|hinge|screen flex/i, 2));

  // ── Value for money ────────────────────────────────────────────────────────────
  const valueForMoneyComments: string[] = extractPhrases(
    allText,
    /value for money|worth the price|good deal|overpriced|great price|affordable|budget|best buy/i,
    3,
  );

  // ── Reliability ────────────────────────────────────────────────────────────────
  const reliabilityConcerns: string[] = extractPhrases(
    allText,
    /reliable|unreliable|fail|broke|lasted|long[- ]term|after [0-9]+ month|after a year/i,
    3,
  );

  // ── Sentiment ─────────────────────────────────────────────────────────────────
  const positiveScore = countMatches(s, /\b(great|excellent|good|love|impressive|recommend|best|fast|smooth|solid)\b/g);
  const negativeScore = countMatches(s, /\b(bad|poor|terrible|disappointing|avoid|slow|lag|fail|cheap|hot|noisy)\b/g);

  let sentiment: ReviewSignal['overallSentiment'];
  // Only assign positive/negative sentiment when based on exact model matches
  if (noExactSignals) {
    sentiment = 'neutral'; // Can't claim positive/negative without exact-model evidence
  } else {
    const ratio = positiveScore / Math.max(1, positiveScore + negativeScore);
    if (ratio >= 0.65) sentiment = 'positive';
    else if (ratio <= 0.35) sentiment = 'negative';
    else if (positiveScore > 0 || negativeScore > 0) sentiment = 'mixed';
    else sentiment = 'neutral';
  }

  // ── Summary ────────────────────────────────────────────────────────────────────
  const totalSources = generalResults.length + batteryResults.length + performanceResults.length + buildResults.length;
  // Plain-English sentiment note — only shown when we have exact-model evidence
  const sentimentNote = noExactSignals ? '' :
    sentiment === 'positive' ? 'People who own this generally rate it well. ' :
    sentiment === 'negative' ? 'There are a few things that come up a lot — worth reading through before you decide. ' :
    sentiment === 'mixed' ? 'Opinions are a bit split — some love it, some have gripes. ' : '';

  const coverageNote = noExactSignals
    ? `We couldn't find reviews for this exact model, so we pulled from similar versions in the same range. `
    : matchCoverage === 'mixed'
    ? `Some of these are from owners of this exact model, others from similar versions. `
    : '';

  const reviewSummary =
    `We went through ${totalSources} reviews from around the web — covering battery life, day-to-day performance, and build quality. ` +
    coverageNote + sentimentNote +
    `These come from web searches, so treat them as a general guide rather than expert verdicts.`;

  const topSource = generalResults[0] ?? batteryResults[0] ?? null;

  return {
    sourceName: 'Web review synthesis (via SerpApi)',
    sourceUrl: topSource?.link ?? null,
    overallSentiment: sentiment,
    reviewSummary,
    commonPraises: uniquePraises,
    commonComplaints: uniqueComplaints,
    batteryConcerns: dedup(batteryConcerns, 4),
    performanceConcerns: dedup(performanceConcerns, 4),
    buildQualityConcerns: dedup(buildQualityConcerns, 4),
    reliabilityConcerns: dedup(reliabilityConcerns, 3),
    valueForMoneyComments: dedup(valueForMoneyComments, 3),
    lastCheckedAt: now,
    confidence: 'medium',
    matchCoverage,
    noExactSignals,
  };
}

function dedup(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().slice(0, 30);
    if (!seen.has(key) && item.trim().length > 5) {
      seen.add(key);
      result.push(item);
      if (result.length >= max) break;
    }
  }
  return result;
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}
