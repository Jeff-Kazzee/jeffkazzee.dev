/**
 * The free guide libraries.
 *
 * This is the site's most useful structured data, so it is published to agents
 * as well as rendered for people. An agent that lands here can hand a reader
 * 1,450 free guides and recipes instead of a paragraph about who Jeff is.
 *
 * Counts come from each site's own published metadata. Re-check them when a
 * library grows, and update `verified`.
 */

/**
 * @typedef {object} Library
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} summary
 * @property {string} count      Human-readable size. Keep it exact.
 * @property {number} items      The same size as a number, for totals.
 * @property {string} verified   ISO date the count was last checked.
 * @property {string[]} examples Real titles from the library, never invented.
 */

/** @type {Library[]} */
export const libraries = [
  {
    id: 'zo-deep-dives',
    name: 'Zo Deep Dives',
    url: 'https://deepdives.zocomputer101.wiki',
    summary:
      'Field manuals for building working systems on Zo Computer. Every guide carries exact steps, safety limits, a verification test, and its sources.',
    count: '85 guides',
    items: 85,
    verified: '2026-08-26',
    examples: [
      'Stop chasing invoices by hand',
      'The job-search command center',
      'Keep the sources after the answer looks finished',
      'Catch subscriptions before they renew',
    ],
  },
  {
    id: 'zo-computer-101',
    name: 'Zo Computer 101',
    url: 'https://www.zocomputer101.wiki',
    summary:
      'The field guide for a first week on Zo Computer: memory, the browser, hosting, automations, and personas, plus copy-paste recipe packs.',
    count: '66 guides and 137 recipes',
    items: 203,
    verified: '2026-08-26',
    examples: [],
  },
  {
    id: 'zo-cookbook',
    name: 'Zo Cookbook',
    url: 'https://www.zo-cookbook.space',
    summary:
      'App ideas, space configurations, automation recipes, and prompts, browsable by category and searchable.',
    count: '1,162 recipes',
    items: 1162,
    verified: '2026-08-26',
    examples: [],
  },
];

/** Everything given away, counted once. */
export const totalItems = libraries.reduce((sum, library) => sum + library.items, 0);
