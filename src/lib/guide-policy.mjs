import { SITE } from '../data/agent-surface.mjs';

export const guideKindLabels = Object.freeze({ guide: 'Guide', 'build-note': 'Build note', idea: 'Idea' });
export const HARNESS_PATH = '/deepseek-harness/';
export const HARNESS_DESCRIPTION = "Tools and working notes from my coding-agent setup.";
export const HARNESS_GUIDANCE = "Pick a guide to see what each tool does, how it works and what I have checked.";
export const HARNESS_INTRODUCTION = "I build tools for my coding agents. DeepSeek Harness is where I put them to work.";
export const HARNESS_TOOLS = [
  {
    "title": "Advisor Models",
    "path": "/deepseek-harness/advisor-models/",
    "description": "Ask another model to review a decision. Your working agent supplies the evidence, reads the reply and keeps control of the job."
  },
  {
    "title": "Browser Verification",
    "path": "/deepseek-harness/browser-verification/",
    "description": "Open the running page and test an interaction. A successful build cannot tell you whether a button works."
  },
  {
    "title": "Team Worktree",
    "path": "/deepseek-harness/team-worktree/",
    "description": "Give teammates separate Git checkouts. Review the changes before bringing their work back into the project."
  },
  {
    "title": "Plugin Lab",
    "path": "/deepseek-harness/plugin-lab/",
    "description": "Set the checks before installing a capability. Use a separate review channel to decide whether it should stay."
  }
];
export const HARNESS_NOTES = "There is room here for small fixes, configuration changes and tests that went wrong.";
export const HARNESS_FUTURE = "Some of this work may feed into Vivary. Those connections are ideas, not shipped features.";
export const HARNESS_LIMITS = "These are my additions to DeepSeek Harness, separate from its official documentation. Each guide links the source and explains setup and testing limits.";

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
