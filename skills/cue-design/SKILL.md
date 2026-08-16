---
name: cue-design
description: |
  Use when working on a task whose kind is design, when running a collaborative
  design or specification session, or when the user asks to discuss and refine
  an idea before building it.
---

# Design Task Sessions

A design task turns a loose idea into a specification the user is willing
to commit to. It is a conversation, not a deliverable pipeline.

## Purpose and Outputs

- **Purpose**: Refine a problem into an agreed design through discussion,
  analysis and critique.
- **Outputs**: A specification (`spec/index.md`), supporting reference
  documents (`doc/`), exploration notes (`note/`), deferred items
  (`todo/`), and milestone history (`log.md`).
- **Boundaries**: Does not write feature code or create downstream
  implementation task cards.

## Completion

A design task is complete when the user and the agent explicitly agree the
design has converged.

Producing a specification does not complete the task. Neither does running
out of questions. Ask; do not assume.

State this rule in the task card's acceptance criteria when creating a
design task, so a later session inherits it without needing this skill.

## The Specification Is the Working Surface

`spec/index.md` is what the discussion is conducted on, not what it
produces.

- Create it once the problem statement is settled, not before. On the
  first exchange you rarely understand enough to write something worth
  iterating on, and a premature specification anchors the discussion badly.
- Revise it in place as the design moves. It is expected to change many
  times.
- Keep it to intent, scope and requirements. Technical approach belongs in
  `plan/`, findings in `doc/`.

## Running the Session

- **Open by understanding, not by producing.** Restate the problem in your
  own words, surface the assumptions and constraints you have inferred,
  and name the trade-offs you can see.
- **Ask about real forks.** Put questions where the design could
  legitimately go more than one way. Do not ask what you can determine by
  reading the code.
- **Stop and wait.** After putting questions to the user, wait for the
  answers. Do not answer them yourself and continue.
- **Say when you disagree.** If a direction seems wrong, say so and say
  why. Agreement you do not hold is worthless to the user.
- **Say when you do not know.** An unanswerable question is a signal to
  investigate or prototype, not to guess.
- **Flag drift.** If the scope is growing, name it rather than following
  it.
