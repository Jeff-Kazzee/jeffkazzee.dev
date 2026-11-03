import { SITE } from '../data/agent-surface.mjs';

export const guideKindLabels = Object.freeze({ guide: 'Guide', 'build-note': 'Build note', idea: 'Idea' });
export const HARNESS_PATH = '/deepseek-harness/';
export const HARNESS_DESCRIPTION = "My plugins, workflow changes and build notes from working with DeepSeek Harness.";
export const HARNESS_INTRODUCTION = "I am using DeepSeek Harness as a place to build and test additions to how my agents work. This section documents those additions, the checks behind them and the parts that still need work. These are my extensions and notes, not official DeepSeek documentation.";
export const HARNESS_LIMITS = "The articles distinguish an authored addition from a stock Harness feature. They also separate source review, local checks and fresh installation testing. A public source link does not mean a ready-made download or an included model subscription.";
export const HARNESS_NOTES = "This section also has room for practical configuration changes, failed attempts and what I learn from testing them. A useful experiment does not have to become another plugin.";
export const HARNESS_TOOLS = [
  {
    "title": "Advisor Models",
    "path": "/deepseek-harness/advisor-models/",
    "description": "ask another model a bounded question without handing it tools or the whole conversation."
  },
  {
    "title": "Browser Verification",
    "path": "/deepseek-harness/browser-verification/",
    "description": "inspect the running page and check a specific interaction rather than treating a build as proof."
  },
  {
    "title": "Team Worktree",
    "path": "/deepseek-harness/team-worktree/",
    "description": "give teammates separate Git checkouts and review their changes before merging."
  },
  {
    "title": "Plugin Lab",
    "path": "/deepseek-harness/plugin-lab/",
    "description": "define the checks before installation, then use a separate channel to decide whether a capability should stay."
  }
];
export const HARNESS_FUTURE = 'Some of these experiments may inform my work on Vivary. That is a possibility, not a claim that these features already exist there or a committed roadmap.';

const isHarnessGuideId = (id) => typeof id === 'string' && /^deepseek-harness\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(id);

/** Missing approval never means published, even outside schema validation. */
/** @template {{ id: string, data: { draft?: boolean, pubDate: Date } }} T
 * @param {T[]} entries
 * @returns {T[]}
 */
export function selectPublishedGuides(entries) {
  return entries
    .filter(({ id, data }) => data.draft === false && isHarnessGuideId(id))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));
}

/** Guides are owned here. Imported canonical metadata cannot override this URL.
 * @param {{ id: string, data: { title: string, description: string, pubDate: Date, verifiedDate: Date, kind: "guide" | "build-note" | "idea", series: "deepseek-harness", tags: string[] } }} entry
 */
export function guideMetadata(entry) {
  const { id, data } = entry;
  if (!isHarnessGuideId(id)) throw new Error('Guide ID must stay within the DeepSeek Harness section.');
  const url = new URL('/' + id + '/', SITE).href;
  return {
    slug: id,
    url,
    canonicalUrl: url,
    markdownUrl: new URL('/' + id + '.md', SITE).href,
    title: data.title,
    description: data.description,
    pubDate: data.pubDate.toISOString().slice(0, 10),
    verifiedDate: data.verifiedDate.toISOString().slice(0, 10),
    kind: data.kind,
    kindLabel: guideKindLabels[data.kind],
    series: data.series,
    tags: data.tags,
  };
}
