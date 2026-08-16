---
name: cue-research
description: Use when working on a research task, or when performing technical exploration and investigation in any session.
---

# Research Sessions & Exploration

Research answers open questions and tests hypotheses. It produces durable
knowledge and evidence, not feature implementation code or target
specifications.

## Purpose and Outputs

- **Purpose**: Explore ideas, evaluate tools and dependencies, test
  hypotheses, and answer technical unknowns.
- **Outputs**:
  - **Diagnostic Traces (`trace/`)**: Raw evidence, benchmark logs, CLI
    outputs, error logs, reproduction steps, and point-in-time observation
    dumps.
  - **Durable Documentation (`doc/`)**: Synthesized findings, trade-off
    analyses, architecture reference, tool/crate evaluations, and decision
    context.
  - **Milestone History (`log.md`)**: Structured progress and key findings
    log entries.

### When to Use `trace/` vs `doc/`

- **`trace/` — Raw Evidence & Observations**:
  - Point-in-time snapshots captured during active discovery
    (`trace/<timestamp>-<hash>/...`).
  - Preserves unedited CLI outputs, benchmark runs, test failures, or
    step-by-step reproduction logs without delaying investigation to format
    or polish them.
- **`doc/` — Synthesized & Durable Knowledge**:
  - Stable, structured reference documents (`doc/<name>.md`).
  - Distills raw traces and learnings into durable knowledge (e.g.,
    architecture breakdowns, library comparisons, design trade-offs)
    intended to guide future tasks across sessions.

## Prior Context Discovery

Before opening new research paths, check if relevant research or context
already exists to avoid redundant work:

1. **Current Task Context**: Query existing artifacts for the active task
   (`cue list --task <slug> -t doc`, `cue list --task <slug> -t trace`).
2. **Project-Wide Store**: Search across all tasks and root artifacts
   (`cue list -a -t doc`, `cue list -a -t trace`).

**Code Drift Caution**: Treat existing artifacts as valuable orientation
and hints, but always verify critical findings against current source code as
codebases evolve.

## Execution Strategy: Breadth-First, Depth-Second

1. **Scout First (Breadth)**: Map the high-level landscape before diving into
   specifics. Understand directory structure, core abstractions, and main
   entry points. Never launch deep investigations into an unfamiliar
   repository without initial scouting.
2. **Targeted Deep Dives (Depth)**: Once the terrain is mapped and key
   questions are framed, conduct focused deep-dive investigations on specific
   paths, files, or dependencies.

## Delegation & Orchestration

- **Protect Primary Context Window**: Processing large volumes of source code,
  raw logs, or external docs rapidly saturates context.
- **Orchestrate Sub-Agents**: The primary agent acts as manager — framing
  target questions, delegating focused sub-tasks to sub-agents, and
  gathering summaries for final synthesis.

## Completion

A research task or phase is complete when the target questions have been
answered with evidence, or established as unanswerable by research alone.

## Boundaries

- Do not write feature implementation code.
- Do not draft target repository specifications (`spec/index.md`). That is a
  design task.
