// Feature: todo-life-dashboard — Property-Based Tests
import fc from 'fast-check';

// ─── GreetingModule ────────────────────────────────────────────────────────

describe('GreetingModule', () => {

  // Feature: todo-life-dashboard, Property 1: Greeting covers all hours
  test('Property 1: getGreetingForHour returns a valid greeting for every hour 0–23', () => {
    const VALID = new Set(['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night']);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        const result = window.__test.getGreetingForHour(hour);
        return typeof result === 'string' && result.length > 0 && VALID.has(result);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: todo-life-dashboard, Property 2: Greeting stable within time slot
  test('Property 2: two hours in the same slot produce the same greeting', () => {
    // Slot definitions: [min, max]
    const slots = [[5, 11], [12, 17], [18, 21]];
    // Night spans two ranges; test them separately
    const nightSlots = [[0, 4], [22, 23]];

    slots.forEach(([lo, hi]) => {
      fc.assert(
        fc.property(
          fc.integer({ min: lo, max: hi }),
          fc.integer({ min: lo, max: hi }),
          (h1, h2) => {
            return window.__test.getGreetingForHour(h1) === window.__test.getGreetingForHour(h2);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Both night ranges must also produce the same value
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: 0, max: 4 }), fc.integer({ min: 22, max: 23 })),
        fc.oneof(fc.integer({ min: 0, max: 4 }), fc.integer({ min: 22, max: 23 })),
        (h1, h2) => {
          return window.__test.getGreetingForHour(h1) === window.__test.getGreetingForHour(h2);
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ─── TimerModule ───────────────────────────────────────────────────────────

describe('TimerModule', () => {

  // Feature: todo-life-dashboard, Property 9: formatMMSS math correctness
  test('Property 9: formatMMSS returns MM:SS matching Math.floor(s/60) and s%60', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (s) => {
        const result = window.__test.formatMMSS(s);
        if (!/^\d{2}:\d{2}$/.test(result)) return false;
        const [mm, ss] = result.split(':').map(Number);
        return mm === Math.floor(s / 60) && ss === (s % 60);
      }),
      { numRuns: 100 }
    );
  });

});

// ─── TodoModule ────────────────────────────────────────────────────────────

describe('TodoModule', () => {

  // Feature: todo-life-dashboard, Property 3: Whitespace-only descriptions rejected
  test('Property 3: whitespace-only descriptions are always rejected', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 }),
        (raw) => {
          return window.__test.validateTaskDescription(raw).ok === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: todo-life-dashboard, Property 4: Valid descriptions accepted and trimmed
  test('Property 4: valid descriptions are accepted and correctly trimmed', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim().length >= 1 && s.trim().length <= 200),
        (raw) => {
          const result = window.__test.validateTaskDescription(raw);
          return result.ok === true && result.trimmed === raw.trim();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: todo-life-dashboard, Property 5: Task JSON round-trip
  test('Property 5: task array survives JSON serialise/deserialise round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id:        fc.uuid(),
            text:      fc.string({ minLength: 1, maxLength: 200 }),
            completed: fc.boolean(),
            createdAt: fc.integer(),
          })
        ),
        (tasks) => {
          const roundTripped = JSON.parse(JSON.stringify(tasks));
          if (roundTripped.length !== tasks.length) return false;
          return tasks.every((t, i) =>
            roundTripped[i].id        === t.id &&
            roundTripped[i].text      === t.text &&
            roundTripped[i].completed === t.completed &&
            roundTripped[i].createdAt === t.createdAt
          );
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ─── QuickLinksModule ──────────────────────────────────────────────────────

describe('QuickLinksModule', () => {

  // Feature: todo-life-dashboard, Property 6: Quick Link JSON round-trip
  test('Property 6: link array survives JSON serialise/deserialise round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id:    fc.uuid(),
            label: fc.string({ minLength: 1, maxLength: 50 }),
            url:   fc.string({ minLength: 1, maxLength: 2048 }),
          })
        ),
        (links) => {
          const roundTripped = JSON.parse(JSON.stringify(links));
          if (roundTripped.length !== links.length) return false;
          return links.every((l, i) =>
            roundTripped[i].id    === l.id &&
            roundTripped[i].label === l.label &&
            roundTripped[i].url   === l.url
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: todo-life-dashboard, Property 7: Valid links pass validation
  test('Property 7: valid label + valid URL always passes validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.constant('http://'), fc.constant('https://')).chain((prefix) =>
          fc.string({ minLength: 1, maxLength: 2040 }).map((suffix) => prefix + suffix)
        ),
        (label, url) => {
          // Skip if trimmed label would be empty (all whitespace)
          if (label.trim().length === 0) return true;
          const result = window.__test.validateLink(label, url);
          return result.ok === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: todo-life-dashboard, Property 8: Invalid URLs always rejected
  test('Property 8: URLs not starting with http:// or https:// are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string().filter((s) => !/^https?:\/\//i.test(s.trim())).filter((s) => s.trim().length > 0),
        (label, url) => {
          const result = window.__test.validateLink(label, url);
          return result.ok === false && result.errors.length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

});
