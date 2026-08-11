# Transparent exercise decision-engine experiment

This directory contains the first technical experiment for **Should I Work
Out Today?** It is a research prototype for testing an
`input -> match -> explain -> output` pipeline. It does not decide whether
someone should exercise, provide medical diagnosis, or demonstrate product
validation.

## Research question

Can a small, inspectable retrieval pipeline connect a user's description of
an exercise barrier to relevant reference scenarios, while keeping the
recommendation explainable and allowing explicit safety rules to override the
model?

The prototype returns three similar synthetic scenarios, a raw retrieval
category, the final hybrid category, the decision layer, the matched rationale,
an optional action, and the limitations of the result. The similarity score is
textual closeness, not calibrated confidence.

## Why text embeddings

Exercise barriers are often described in varied natural language. A sentence
embedding can retrieve semantically related examples without requiring a
fixed form field for every possible phrase. The preferred backend is:

`sentence-transformers/all-MiniLM-L6-v2`

If the package or model cannot be loaded, `--method auto` uses the explicitly
labelled `tfidf_word_char_cosine_fallback`. The fallback combines word,
word-bigram and character n-gram TF-IDF features and uses cosine similarity.
It is lexical rather than semantic and is included so the pipeline remains
auditable and runnable in constrained environments.

## Data source and limitations

`data/exercise_scenarios.csv` contains a small synthetic reference set across
four categories:

- `adapt`
- `postpone`
- `decline`
- `safety_stop`

Every row is disclosed as:

- `data_source`: `LLM-assisted synthetic seed data`
- `review_status`: `manually review required`

The original rows remain labelled `manually review required`. Six boundary
examples added in the second iteration are labelled `manually reviewed`.
Every row remains synthetic: the rows do not come from participants and have
not been medically validated. They must not be represented as real user
evidence. The fixed independent synthetic evaluation set in
`data/evaluation_cases.csv` contains paraphrases that are not exact copies of
reference rows.

## Safety before similarity

The engine checks explicit English and Chinese safety phrases before running
retrieval. The rules cover sudden, sharp, unusual or worsening pain, chest
pain, dizziness, difficulty breathing and fainting. A match causes a
rule-based `safety_stop` and prevents lighter exercise, walking or
continue-training suggestions.

The fixed message is:

> This prototype does not provide medical diagnosis. Stop the current
> exercise plan and consider appropriate professional support depending on
> the situation.

This override is deliberately visible in the JSON. It is not a model
prediction and is not complete medical triage.

## Why a hybrid system was used

Embeddings are useful for retrieving semantically similar reference scenarios,
but embedding similarity alone did not reliably distinguish three different
user intentions: adapting an activity, cancelling it, and moving it to another
time. Those boundaries often turn on a few explicit action phrases rather than
the overall topic of the message.

The engine therefore uses three inspectable layers:

1. **Safety override:** predefined safety phrases stop the pipeline before
   retrieval.
2. **Explicit user intent:** transparent English and Chinese rules prioritise a
   clearly requested lower-effort option, postponement, or refusal.
3. **Embedding retrieval:** the preferred sentence model, or labelled TF-IDF
   fallback, handles inputs without a decisive safety or action-intent signal.

Safety and explicit user choice take priority over similarity. The intent layer
does not treat tiredness or reluctance to go outside as refusal by itself. These
rules are interaction and safety boundaries, not medical judgement. The raw
embedding prediction remains in the output so any override can be audited.
This experiment validates only the technical pipeline; it does not establish
real-world generalisation.

## Install

From the repository root:

```bash
python -m venv ml/.venv
```

Activate the environment, then install:

```bash
python -m pip install -r ml/requirements.txt
```

Model files and virtual environments must remain outside Git.

## Run a decision

```bash
python -m ml.src.decision_engine \
  --text "I planned leg day after work, but I feel tired and do not want to go outside."
```

Force the deterministic fallback:

```bash
python -m ml.src.decision_engine \
  --method tfidf \
  --text "A meeting now overlaps with my workout."
```

The JSON includes:

- original input and actual method
- top three matched synthetic examples
- `decision_layer` and the matched explicit-intent rule
- raw `embedding_prediction` and `final_prediction`
- a visible override reason, selected category and similarity
- top-one and top-two similarity, their margin, and `requires_confirmation`
- rationale and suggested action
- visible safety-override state
- evidence limitations

## Build reference vectors

```bash
python -m ml.src.build_embeddings --method auto
```

This creates `ml/outputs/scenario_embeddings.json`. The generated vector file
is ignored by Git because it can be reproduced and may vary by backend.

## Evaluate

```bash
python -m ml.src.evaluate --backends all
```

The checked-in `outputs/evaluation_results.json` is the unedited output from
the current environment. It compares both sentence-transformer and TF-IDF
backends in two modes: pure retrieval and the final hybrid pipeline.
Evaluation reports:

- test-example count
- top-1 category accuracy
- precision, recall and F1 for each category
- confusion matrices
- top-3 retrieval hit rates
- rule-based safety override recall
- explicit-intent rule and actual override counts
- differences between raw embedding and final predictions
- individual failures

The hybrid top-3 result is reported as 12/12, not 16/16. Four safety examples
stop before embedding retrieval and are therefore excluded from the hybrid
retrieval denominator. The pure-retrieval diagnostic still reports all 16
examples separately.

Run the frozen post-development robustness audit with:

```bash
python -m ml.src.robustness_evaluate
```

This evaluates MiniLM pure retrieval, MiniLM hybrid, TF-IDF pure retrieval and
TF-IDF hybrid against `data/robustness_cases.jsonl`. The script verifies hashes
for the 42 reference scenarios, the fixed 16-case evaluation set, and the
safety and intent rules before it runs.

These metrics only verify the small prototype pipeline and reveal errors.
They cannot establish real-world generalisation, medical effect, behaviour
change, or product validity. User testing evaluates whether people understand
and control the interaction; it does not validate model correctness.

## Test

No test framework dependency is required:

```bash
python -m unittest discover -s ml/tests -v
```

## Current result

The checked-in run used the preferred
`sentence-transformers/all-MiniLM-L6-v2` backend and the TF-IDF fallback:

- 42 reference scenarios: 11 `adapt`, 11 `postpone`, 11 `decline`, and 9
  `safety_stop`
- 16 independent synthetic evaluation cases: 4 per category
- first-round MiniLM hybrid accuracy: 13/16 (`0.8125`)
- current MiniLM pure-retrieval accuracy: 15/16 (`0.9375`)
- current MiniLM hybrid accuracy: 16/16 (`1.0`)
- current TF-IDF pure-retrieval accuracy: 14/16 (`0.875`)
- current TF-IDF hybrid accuracy: 16/16 (`1.0`)
- hybrid top-3 retrieval hit rate: 12/12 non-safety cases (`1.0`)
- hybrid safety override recall: 4/4 (`1.0`)

MiniLM pure retrieval still classifies the pressure-plus-lower-demand case as
`decline`; the explicit lower-effort rule changes the final result to `adapt`.
TF-IDF pure retrieval similarly needs overrides for the fatigue-plus-shorter
case and pressure-plus-lower-demand case. The final hybrid evaluation has no
failures on this small fixed set. This perfect result does not prove
generalisation: the set is synthetic, small and designed to test known pipeline
boundaries.

The unchanged first-round report is archived in
`outputs/round1_evaluation_results.json`. Full second-round results are in
`outputs/evaluation_results.json` and should be regenerated whenever the
dataset, safety rules, model or retrieval logic changes.

## Independent robustness audit

The robustness set was created after the model, 42 reference scenarios, fixed
16-case evaluation set, safety rules and intent rules were frozen. It contains
48 new synthetic cases: 24 English and 24 Chinese, with 12 expected examples
for each category. It covers paraphrase, negation, double negation, mixed
intent, changed intent, ambiguous wording, figurative pain language and
explicit safety signals. It is still synthetic data, not participant evidence.

No rule, reference scenario or expected label was changed after the robustness
results were observed. The frozen audit produced:

| Method | Overall | English | Chinese |
| --- | ---: | ---: | ---: |
| MiniLM pure retrieval | 28/48 (`0.5833`) | 18/24 | 10/24 |
| MiniLM hybrid final | 31/48 (`0.6458`) | 16/24 | 15/24 |
| TF-IDF pure retrieval | 33/48 (`0.6875`) | 17/24 | 16/24 |
| TF-IDF hybrid final | 35/48 (`0.7292`) | 17/24 | 18/24 |

For both hybrid methods, the rule-based safety override detected 12/12 safety
examples and produced 0/36 rule-level false positives. This does not mean the
final category had no safety false positives: MiniLM retrieval classified
3/36 non-safety inputs as `safety_stop`, and TF-IDF retrieval classified 1/36
that way. In particular, the frozen engine incorrectly treated negated chest
pain and “chest day” as final safety categories through retrieval even though
the safety rules themselves did not fire.

The audit also exposed intent-ordering limitations. The Chinese request to
decline today and not move the activity to tomorrow was classified as
`postpone`. All failures, safety false positives and safety misses are retained
in `outputs/robustness_results.json`; they were not used to retune the system.

### Confirmation diagnostic

`requires_confirmation` does not add a category or claim calibrated
uncertainty. It marks retrieval-only outputs when textual evidence is weak:

- MiniLM: top-one similarity below `0.50`, or top-one/top-two margin below
  `0.04`
- TF-IDF: top-one similarity below `0.17`, or margin below `0.04`

These thresholds were frozen before the robustness set was run. They were
selected from the five non-safety, non-intent examples in the existing 16-case
set, whose observed MiniLM top-one range was `0.5308-0.6948` and margin range
was `0.0191-0.3014`; the TF-IDF ranges were `0.1817-0.3174` and
`0.0055-0.1715`. They are provisional diagnostic thresholds, not calibrated
confidence boundaries.

On the robustness set, MiniLM pure retrieval requested confirmation for 29/48
cases and MiniLM hybrid for 13/48. TF-IDF pure retrieval requested confirmation
for 11/48 and TF-IDF hybrid for 7/48. Explicit intent and safety decisions do
not use this retrieval-confirmation flag.

This audit cannot prove real-world generalisation, exercise correctness,
medical correctness, behaviour change or product validity. A 100% score on the
small fixed test set is not product validation. Any hybrid improvement must be
attributed partly to transparent rules rather than to the embedding model
alone.

## Connection to the interaction prototype

A next phase can expose this engine behind a local API and connect it to the
existing prototype's understanding, judgement and correction states. The UI
should show matched evidence, allow correction, keep refusal final, and label
rule-based safety behaviour separately from similarity retrieval.

Before any product integration, the project still needs manually reviewed
reference data, dedicated safety review, multilingual error analysis and
tests of correction, refusal and safety-stop branches.

## LLM disclosure

An LLM assisted with the initial code structure, documentation and synthetic
seed phrasing. The implementation is designed for human inspection. The seed
data is explicitly labelled for manual review, and no generated scenario is
presented as participant evidence, medical guidance or a validated outcome.

## Safety-gated architecture and final holdout

The 48-case independent robustness set was used to identify two architecture
problems: semantic retrieval could create a final `safety_stop` without an
explicit safety signal, and mixed decline/postpone language could override the
user's refusal. Those historical cases, failures and result files remain
unchanged.

The next architecture gates `safety_stop` behind the explicit safety rules.
Retrieval still records `embedding_prediction_raw`, including a raw
`safety_stop`, but semantic similarity alone cannot create that final outcome.
When retrieval suggests safety without a rule match, the engine selects the
highest retrieved non-safety category, sets `requires_confirmation` to true,
and exposes the override reason. Explicit safety matches still stop before
ordinary exercise suggestions.

After this architecture, its rules and its evaluator were committed and
frozen, a new 60-case holdout was created:

- 30 English and 30 Chinese cases
- 15 cases for each of `adapt`, `postpone`, `decline` and `safety_stop`
- no exact copies from the 42 reference scenarios, fixed 16-case evaluation
  set or 48-case robustness set
- disclosed as `final synthetic holdout, created after safety-gated
  architecture was frozen`

The final holdout was run once and was not used for rule, threshold, reference
data or expected-label changes:

| Method | Overall | English | Chinese |
| --- | ---: | ---: | ---: |
| MiniLM pure retrieval | 33/60 (`0.5500`) | 22/30 | 11/30 |
| MiniLM safety-gated hybrid | 42/60 (`0.7000`) | 22/30 | 20/30 |
| TF-IDF pure retrieval | 38/60 (`0.6333`) | 18/30 | 20/30 |
| TF-IDF safety-gated hybrid | 42/60 (`0.7000`) | 20/30 | 22/30 |

MiniLM raw retrieval produced 6/45 non-safety safety false positives; TF-IDF
raw retrieval produced 2/45. Both safety-gated hybrid outputs produced 0/45
final safety false positives. Both gated methods detected 14/15 safety cases.
The missed case phrased the signal as “pain became suddenly sharp”, which did
not match the frozen rule wording. This failure is retained rather than fixed
after seeing the holdout.

MiniLM pure retrieval requested confirmation for 29/60 cases and its gated
hybrid for 20/60. TF-IDF pure retrieval requested confirmation for 16/60 and
its gated hybrid for 10/60. Full confusion matrices, per-category metrics,
failures, raw safety false positives and confirmation cases are preserved in
`outputs/final_holdout_results.json`.

All datasets in this experiment remain synthetic. The robustness and holdout
results do not establish product validity, medical correctness, exercise
correctness, behaviour change or real-world generalisation. The final holdout
must not be used for further tuning, and any hybrid improvement must be
attributed partly to transparent rules rather than to the embedding model.
