// The /context-engine/ simulation. Everything runs in the page. No model is
// called and nothing leaves the browser.
//
// It models the Claude Code default mode from the Context Engine README:
// an accepted edit inside a turn produces a revision and a digest notice with
// no Working Context bytes, and at the next user turn the request is rebuilt
// as the pinned prefix, the Working Context frame and the new message. The
// plain conversation beside it keeps every earlier message.

type Step = { label: string; find: string; replace: string; reply: string };

type Scenario = {
  task: string;
  clutterLabel: string;
  clutter: string;
  context: string;
  steps: Step[];
  messages: string[];
};

type Block = { role: string; label: string; text: string };

// The packet limit from the README, carrier included. Larger packets are
// refused, never truncated.
const PACKET_LIMIT = 32_000;

const PREFIX_TEXT =
  'System prompt, tool definitions and permissions. Context Engine leaves them unchanged apart from fixed guidance text that says where the Working Context file is.';

const repeat = (lines: string[], count: number) =>
  Array.from({ length: count }, (_, i) => lines[i % lines.length].replace('#', String(i + 1))).join('\n');

const testLog = [
  'FAIL src/billing/dates.test.ts',
  '  x renews on the last day of the month (41 ms)',
  '    Expected: 2026-03-31',
  '    Received: 2026-03-30',
  '    at dates.test.ts:41:18',
  repeat(
    [
      'PASS src/billing/plans.test.ts > plan # keeps its price after renewal',
      'PASS src/billing/invoices.test.ts > invoice # totals line items',
      'PASS src/billing/tax.test.ts > region # applies the right rate',
    ],
    60,
  ),
  'Tests: 1 failed, 180 passed, 181 total',
].join('\n');

const openings = ['A', 'B', 'C']
  .map(
    (name) =>
      `Opening ${name}:\n` +
      repeat(
        [
          'The ferry horn sounds twice before Mara sees the boat. She counts the gulls on the rail instead of the passengers, because counting passengers means looking for him.',
          'Salt on the window. A man in a green coat, then not. Mara folds the ticket until it is a small hard square and puts it in her mouth like a child would.',
          'Nine years, and the dock still smells of diesel and oranges. She had forgotten the oranges. Ilya would remember the oranges.',
        ],
        4,
      ),
  )
  .join('\n\n');

const reports = [
  repeat(['[api] step #: wrote handler, ran tests, all green, pushed commit to feature branch'], 18),
  repeat(['[ui] step #: form renders, waiting on error format from api, retried build'], 18),
  repeat(['[tests] step #: fixtures ready, cannot write ui tests until the form settles'], 18),
].join('\n');

const SCENARIOS: Record<string, Scenario> = {
  code: {
    task: 'The renewal test is failing. Find out why and fix it without changing the public API.',
    clutterLabel: 'test run output',
    clutter: testLog,
    context: `# Working Context

## Task
Fix the failing renewal test in src/billing without changing the public API.

## Decisions
- Keep the fix inside src/billing.

## Scratch
Test run, pasted in full:
${testLog}

Tried: mocking Date.now. No change.
`,
    steps: [
      {
        label: 'Offload the test log',
        find: `Test run, pasted in full:\n${testLog}`,
        replace:
          'Test log saved to .context-engine/demo/test-log.txt.\nOne failure: dates.test.ts:41, the renewal date is one day early.',
        reply: 'Saved the full log to a file and kept the one failure.',
      },
      {
        label: 'Record the cause',
        find: '- Keep the fix inside src/billing.',
        replace:
          '- Keep the fix inside src/billing.\n- Cause: the renewal date is computed in local time. Compute it in UTC.',
        reply: 'Recorded the cause as a decision.',
      },
      {
        label: 'Drop the dead end',
        find: '\n\nTried: mocking Date.now. No change.',
        replace: '',
        reply: 'Removed the note about the mock. It led nowhere.',
      },
    ],
    messages: ['Go ahead and write the fix.', 'Run the billing tests again.', 'Open a pull request.'],
  },
  write: {
    task: 'Draft chapter 12. Here are my three attempts at the opening.',
    clutterLabel: 'three draft openings',
    clutter: openings,
    context: `# Working Context

## Brief
Chapter 12. Mara meets her brother Ilya at the ferry after nine years.
Close third person, present tense, Mara's point of view. About 2,500 words.

## Canon
- Ilya has a scar across his right hand.
- The ferry runs twice a day, at 7 and at 19.
- Mara never says the word "home" out loud.

## Drafts
${openings}
`,
    steps: [
      {
        label: 'Keep one opening',
        find: `## Drafts\n${openings}`,
        replace:
          '## Drafts\nOpenings A and B saved to .context-engine/demo/openings.md.\nUsing C: the dock, the diesel, the oranges.',
        reply: 'Kept opening C and saved the other two to a file.',
      },
      {
        label: 'Correct the canon',
        find: '- Ilya has a scar across his right hand.',
        replace: '- Ilya has a scar across his left hand. Chapter 3 says left. Corrected.',
        reply: 'Fixed the scar to match chapter 3.',
      },
      {
        label: "Keep the writer's call",
        find: '## Canon',
        replace: '## Decisions\n- The writer cut the flashback to the fire. Do not bring it back.\n\n## Canon',
        reply: 'Noted that the flashback stays cut.',
      },
    ],
    messages: ['Draft the first scene.', 'Make Ilya quieter.', 'Read the last page back to me.'],
  },
  direct: {
    task: 'You coordinate three worker agents. Ship the settings page by Friday. Their reports are below.',
    clutterLabel: 'raw worker reports',
    clutter: reports,
    context: `# Working Context

## Goal
Ship the new settings page by Friday. Three workers, one reviewer.

## Board
- api: build the settings endpoint
- ui: build the settings form
- tests: cover both

## Reports, pasted in full
${reports}
`,
    steps: [
      {
        label: 'Fold reports into the board',
        find: `- api: build the settings endpoint\n- ui: build the settings form\n- tests: cover both\n\n## Reports, pasted in full\n${reports}`,
        replace:
          '- api: done, merged\n- ui: blocked, needs the error format from api\n- tests: waiting on ui\n\nFull reports saved to .context-engine/demo/reports.md.',
        reply: 'Folded the reports into one line per worker and saved the originals.',
      },
      {
        label: 'Unblock the UI worker',
        find: '## Board',
        replace: '## Decisions\n- Errors use { field, message }. Sent to ui.\n\n## Board',
        reply: 'Decided the error format and sent it to the UI worker.',
      },
      {
        label: 'Retire the finished worker',
        find: '- api: done, merged',
        replace: '- api: done, merged, worker stopped',
        reply: 'Stopped the API worker. Its work is merged.',
      },
    ],
    messages: ['What is blocking Friday?', 'Tell the reviewer to start.', 'Write the status note for the team.'],
  },
};

const encoder = new TextEncoder();
const bytes = (text: string) => encoder.encode(text).length;
const size = (n: number) => (n < 1000 ? `${n} B` : `${(n / 1000).toFixed(1)} kB`);

async function digest(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return 'unavailable';
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

const frame = (revision: number, text: string) =>
  `<working_context revision="${revision}">\n${text}</working_context>`;

function init() {
  const root = document.querySelector<HTMLElement>('[data-ce-demo]');
  if (!root) return;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const editor = $<HTMLTextAreaElement>('[data-editor]');
  const saveButton = $<HTMLButtonElement>('[data-save]');
  const sendButton = $<HTMLButtonElement>('[data-send]');
  const steps = $<HTMLElement>('[data-steps]');
  const notices = $<HTMLElement>('[data-notices]');
  const ceList = $<HTMLOListElement>('[data-ce-request]');
  const plainList = $<HTMLOListElement>('[data-plain-request]');
  const ceTotal = $<HTMLElement>('[data-ce-total]');
  const plainTotal = $<HTMLElement>('[data-plain-total]');
  const turnLabel = $<HTMLElement>('[data-turn]');
  const revisionLabel = $<HTMLElement>('[data-revision]');
  const editorSize = $<HTMLElement>('[data-editor-size]');

  let scenario: Scenario;
  let committed = '';
  let revision = 1;
  let turn = 4;
  let message = '';
  let messageIndex = 0;
  let history: Block[] = [];
  // The revision the current request frame was built from. Edits after it
  // wait for the next user turn.
  let framed = 1;
  let framedText = '';

  function renderBlocks(list: HTMLOListElement, blocks: Block[]) {
    list.replaceChildren(
      ...blocks.map((block) => {
        const item = document.createElement('li');
        item.dataset.role = block.role;
        const head = document.createElement('p');
        head.className = 'block-head';
        const role = document.createElement('span');
        role.className = 'role';
        role.textContent = block.role;
        const label = document.createElement('span');
        label.textContent = block.label;
        const weight = document.createElement('span');
        weight.className = 'weight';
        weight.textContent = size(bytes(block.text));
        head.append(role, label, weight);
        const body = document.createElement('pre');
        body.textContent = block.text;
        item.append(head, body);
        return item;
      }),
    );
    return blocks.reduce((sum, block) => sum + bytes(block.text), 0);
  }

  function renderRequests() {
    const prefix: Block = { role: 'prefix', label: 'Pinned prefix, unchanged', text: PREFIX_TEXT };
    const next: Block = { role: 'user', label: 'New message', text: message };
    const ceBlocks: Block[] = [
      prefix,
      { role: 'user', label: `Working Context, revision ${framed}`, text: frame(framed, framedText) },
      next,
    ];
    const ce = renderBlocks(ceList, ceBlocks);
    const plain = renderBlocks(plainList, [prefix, ...history, next]);
    ceTotal.textContent = `${ceBlocks.length} blocks, ${size(ce)}`;
    plainTotal.textContent = `${history.length + 2} blocks, ${size(plain)}`;
    turnLabel.textContent = String(turn);
  }

  function renderEditorState() {
    const changed = editor.value !== committed;
    saveButton.disabled = !changed;
    editorSize.textContent = `${size(bytes(editor.value))} of the ${size(PACKET_LIMIT)} packet limit`;
    revisionLabel.textContent = String(revision);
  }

  function notice(text: string, tone: 'ok' | 'refused' | 'info' = 'ok') {
    const item = document.createElement('li');
    item.dataset.tone = tone;
    item.textContent = text;
    notices.prepend(item);
  }

  async function commit(text: string, reply: string) {
    if (text === committed) return;
    if (bytes(frame(revision + 1, text)) > PACKET_LIMIT) {
      editor.value = committed;
      renderEditorState();
      notice(
        `Refused. That packet is over ${size(PACKET_LIMIT)}. Context Engine never truncates, so revision ${revision} stays in effect.`,
        'refused',
      );
      return;
    }
    committed = text;
    revision += 1;
    editor.value = text;
    history.push(
      { role: 'tool', label: 'Edit context.md', text: `Edit applied. ${size(bytes(text))} written.` },
      { role: 'assistant', label: 'Reply', text: reply },
    );
    const sum = await digest(text);
    notice(
      `Revision ${revision} accepted. sha256 ${sum.slice(0, 12)}. The notice carries no Working Context text. To read it inside this turn: context-engine read --session demo --framed`,
    );
    renderEditorState();
    renderRequests();
  }

  function renderSteps() {
    steps.replaceChildren(
      ...scenario.steps.map((step) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn';
        button.textContent = step.label;
        button.addEventListener('click', () => {
          if (!committed.includes(step.find)) {
            notice(`Nothing to change. The text that "${step.label}" edits is gone from the file.`, 'info');
            return;
          }
          button.disabled = true;
          void commit(committed.replace(step.find, step.replace), step.reply);
        });
        return button;
      }),
    );
  }

  function load(id: string) {
    scenario = SCENARIOS[id] ?? SCENARIOS.code;
    committed = scenario.context;
    framedText = committed;
    revision = 1;
    framed = 1;
    turn = 4;
    messageIndex = 0;
    message = scenario.messages[0];
    editor.value = committed;
    history = [
      { role: 'user', label: 'Turn 1', text: scenario.task },
      { role: 'tool', label: `Read ${scenario.clutterLabel}`, text: scenario.clutter },
      { role: 'assistant', label: 'Turns 1 to 3', text: 'Read it all and started a Working Context.' },
    ];
    notices.replaceChildren();
    notice('The session is three turns in. Edit the file or pick an agent action, then send the next message.', 'info');
    renderSteps();
    renderEditorState();
    renderRequests();
  }

  sendButton.addEventListener('click', () => {
    history.push({ role: 'user', label: `Turn ${turn}`, text: message });
    history.push({ role: 'assistant', label: 'Reply', text: 'Done.' });
    turn += 1;
    messageIndex = (messageIndex + 1) % scenario.messages.length;
    message = scenario.messages[messageIndex];
    framed = revision;
    framedText = committed;
    notices.replaceChildren();
    notice(
      `Turn ${turn}. The request is rebuilt from revision ${framed}. Earlier turns are not in it.`,
      'info',
    );
    renderRequests();
  });

  saveButton.addEventListener('click', () => void commit(editor.value, 'Edited the Working Context by hand.'));
  editor.addEventListener('input', renderEditorState);

  root.querySelectorAll<HTMLInputElement>('input[name="ce-scenario"]').forEach((input) => {
    input.addEventListener('change', () => input.checked && load(input.value));
  });

  root.hidden = false;
  root.closest('section')?.querySelector('[data-ce-nojs]')?.remove();
  load(root.querySelector<HTMLInputElement>('input[name="ce-scenario"]:checked')?.value ?? 'code');
}

init();
