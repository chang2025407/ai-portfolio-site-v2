"""Evaluate the frozen safety-gated engine on a final unseen holdout set."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from .decision_engine import (
    DEFAULT_DATA_PATH,
    INTENT_RULES,
    PROJECT_ROOT,
    SAFETY_RULES,
    VALID_CATEGORIES,
    DecisionEngine,
    load_scenarios,
)
from .evaluate import CATEGORY_ORDER, _classification_metrics


DEFAULT_HOLDOUT_PATH = PROJECT_ROOT / "data" / "final_holdout_cases.jsonl"
DEFAULT_FIXED_EVALUATION_PATH = PROJECT_ROOT / "data" / "evaluation_cases.csv"
DEFAULT_ROBUSTNESS_PATH = PROJECT_ROOT / "data" / "robustness_cases.jsonl"
DEFAULT_EVALUATION_RESULT_PATH = (
    PROJECT_ROOT / "outputs" / "evaluation_results.json"
)
DEFAULT_ROBUSTNESS_RESULT_PATH = (
    PROJECT_ROOT / "outputs" / "robustness_results.json"
)
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "outputs" / "final_holdout_results.json"
HOLDOUT_SOURCE = (
    "final synthetic holdout, created after safety-gated architecture was frozen"
)

FROZEN_REFERENCE_SHA256 = (
    "9f528f9c88477a378da7c9ed43f1997e0f418d01b8e569a88f5bd2f7e2cfb16d"
)
FROZEN_FIXED_EVALUATION_SHA256 = (
    "2c465f34407963f27fff31e2a5f0ba0c19a0a45be4db542a2cb3df5a66fac35a"
)
FROZEN_ROBUSTNESS_DATA_SHA256 = (
    "a2d67ea4b5c676b507e7867394af6995785520fa7f0b867fb2b0cd69de368e0b"
)
FROZEN_EVALUATION_RESULT_SHA256 = (
    "357907216a842f88c57e274483d07652ac832149010245e14541fa21fd9ceec8"
)
FROZEN_ROBUSTNESS_RESULT_SHA256 = (
    "ac221cf3376f1e708720505716be6d0d5d9e90d455561d4fdbf674c872c1e678"
)
FROZEN_SAFETY_GATED_RULES_SHA256 = (
    "f27419e5bbcd9aa5d7fea5bb69228c4a658e2e1554a61d3190a2df2ca2f3cd2d"
)


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def current_rules_sha256() -> str:
    payload = json.dumps(
        {"safety": SAFETY_RULES, "intent": INTENT_RULES},
        ensure_ascii=False,
        sort_keys=True,
        default=list,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def load_holdout_cases(path: Path) -> list[dict[str, Any]]:
    cases = [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if len(cases) != 60:
        raise ValueError(f"Final holdout must contain exactly 60 cases, found {len(cases)}")

    ids = [case["case_id"] for case in cases]
    if len(ids) != len(set(ids)):
        raise ValueError("Final holdout case IDs must be unique")

    languages = Counter(case["language"] for case in cases)
    if languages != {"en": 30, "zh": 30}:
        raise ValueError(
            f"Final holdout language distribution must be 30/30, found {languages}"
        )

    categories = Counter(case["expected_category"] for case in cases)
    expected_distribution = {
        "adapt": 15,
        "postpone": 15,
        "decline": 15,
        "safety_stop": 15,
    }
    if categories != expected_distribution:
        raise ValueError(
            "Final holdout categories must be balanced 15 each, found "
            f"{categories}"
        )

    for case in cases:
        if case["expected_category"] not in VALID_CATEGORIES:
            raise ValueError(f"{case['case_id']} has an invalid category")
        if case["data_source"] != HOLDOUT_SOURCE:
            raise ValueError(
                f"{case['case_id']} has an invalid holdout disclosure"
            )
        if not case.get("phenomena"):
            raise ValueError(f"{case['case_id']} is missing phenomena labels")
    return cases


def verify_no_exact_copies(
    cases: list[dict[str, Any]],
    reference_path: Path,
    fixed_evaluation_path: Path,
    robustness_path: Path,
) -> None:
    existing = {
        _normalise(scenario.scenario_text)
        for scenario in load_scenarios(reference_path)
    }
    with fixed_evaluation_path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as stream:
        existing.update(
            _normalise(row["input_text"])
            for row in csv.DictReader(stream)
        )
    existing.update(
        _normalise(json.loads(line)["input_text"])
        for line in robustness_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    )
    duplicates = [
        case["case_id"]
        for case in cases
        if _normalise(case["input_text"]) in existing
    ]
    if duplicates:
        raise ValueError(
            "Final holdout must not copy prior data: " + ", ".join(duplicates)
        )


def verify_frozen_assets() -> dict[str, str]:
    actual = {
        "reference_data_sha256": file_sha256(DEFAULT_DATA_PATH),
        "fixed_evaluation_data_sha256": file_sha256(
            DEFAULT_FIXED_EVALUATION_PATH
        ),
        "robustness_data_sha256": file_sha256(DEFAULT_ROBUSTNESS_PATH),
        "evaluation_results_sha256": file_sha256(
            DEFAULT_EVALUATION_RESULT_PATH
        ),
        "robustness_results_sha256": file_sha256(
            DEFAULT_ROBUSTNESS_RESULT_PATH
        ),
        "safety_gated_rules_sha256": current_rules_sha256(),
    }
    expected = {
        "reference_data_sha256": FROZEN_REFERENCE_SHA256,
        "fixed_evaluation_data_sha256": FROZEN_FIXED_EVALUATION_SHA256,
        "robustness_data_sha256": FROZEN_ROBUSTNESS_DATA_SHA256,
        "evaluation_results_sha256": FROZEN_EVALUATION_RESULT_SHA256,
        "robustness_results_sha256": FROZEN_ROBUSTNESS_RESULT_SHA256,
        "safety_gated_rules_sha256": FROZEN_SAFETY_GATED_RULES_SHA256,
    }
    mismatches = [
        name for name, value in actual.items() if value != expected[name]
    ]
    if mismatches:
        raise ValueError(
            "Frozen architecture or evidence changed: " + ", ".join(mismatches)
        )
    return actual


def _language_accuracy(
    examples: list[dict[str, Any]],
) -> dict[str, dict[str, float | int]]:
    report: dict[str, dict[str, float | int]] = {}
    for language in ("en", "zh"):
        language_examples = [
            example
            for example in examples
            if example["language"] == language
        ]
        correct = sum(example["top1_correct"] for example in language_examples)
        report[language] = {
            "accuracy": round(correct / len(language_examples), 4),
            "correct": correct,
            "total": len(language_examples),
        }
    return report


def evaluate_mode(
    engine: DecisionEngine,
    cases: list[dict[str, Any]],
    mode: str,
) -> dict[str, Any]:
    if mode == "pure_embedding":
        decide: Callable[[str], dict[str, Any]] = engine.embedding_decide
    elif mode == "safety_gated_hybrid":
        decide = engine.decide
    else:
        raise ValueError(f"Unsupported holdout mode: {mode}")

    confusion: defaultdict[str, Counter[str]] = defaultdict(Counter)
    examples: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    correct = 0
    safety_count = 0
    non_safety_count = 0
    final_safety_hits = 0
    final_safety_false_positives = 0
    raw_safety_false_positives = 0
    safety_rule_hits = 0
    confirmation_count = 0
    explicit_intent_count = 0

    for case in cases:
        result = decide(case["input_text"])
        expected = case["expected_category"]
        predicted = result["final_prediction"]
        is_correct = predicted == expected
        correct += int(is_correct)
        confusion[expected][predicted] += 1
        confirmation_count += int(result["requires_confirmation"])
        explicit_intent_count += int(result["explicit_intent"] is not None)

        if expected == "safety_stop":
            safety_count += 1
            final_safety_hits += int(predicted == "safety_stop")
            safety_rule_hits += int(result["safety_rule_triggered"])
        else:
            non_safety_count += 1
            final_safety_false_positives += int(predicted == "safety_stop")
            raw_safety_false_positives += int(
                result["embedding_prediction_raw"] == "safety_stop"
            )

        record = {
            "case_id": case["case_id"],
            "language": case["language"],
            "input_text": case["input_text"],
            "phenomena": case["phenomena"],
            "expected_category": expected,
            "embedding_prediction_raw": result["embedding_prediction_raw"],
            "best_non_safety_prediction": result[
                "best_non_safety_prediction"
            ],
            "final_prediction": predicted,
            "decision_layer": result["decision_layer"],
            "safety_rule_triggered": result["safety_rule_triggered"],
            "matched_safety_rule": result["matched_safety_rule"],
            "explicit_intent": result["explicit_intent"],
            "override_reason": result["override_reason"],
            "top1_similarity": result["top1_similarity"],
            "top2_similarity": result["top2_similarity"],
            "similarity_margin": result["similarity_margin"],
            "requires_confirmation": result["requires_confirmation"],
            "confirmation_reasons": result["confirmation_reasons"],
            "top1_correct": is_correct,
            "top_match_ids": [
                match["scenario_id"] for match in result["top_matches"]
            ],
        }
        examples.append(record)
        if not is_correct:
            failures.append(record)

    total = len(cases)
    return {
        "metrics": {
            "overall_accuracy": round(correct / total, 4),
            "correct": correct,
            "total": total,
            "safety_recall": round(final_safety_hits / safety_count, 4),
            "final_safety_false_positive_rate": round(
                final_safety_false_positives / non_safety_count,
                4,
            ),
            "raw_retrieval_safety_false_positive_rate": round(
                raw_safety_false_positives / non_safety_count,
                4,
            ),
            "safety_rule_recall": (
                round(safety_rule_hits / safety_count, 4)
                if mode == "safety_gated_hybrid"
                else None
            ),
            "requires_confirmation_count": confirmation_count,
            "requires_confirmation_rate": round(
                confirmation_count / total,
                4,
            ),
            "explicit_intent_count": (
                explicit_intent_count
                if mode == "safety_gated_hybrid"
                else 0
            ),
            "safety_examples": safety_count,
            "non_safety_examples": non_safety_count,
        },
        "language_accuracy": _language_accuracy(examples),
        "per_category": _classification_metrics(confusion),
        "confusion_by_expected_category": {
            expected: {
                predicted: confusion[expected].get(predicted, 0)
                for predicted in CATEGORY_ORDER
            }
            for expected in CATEGORY_ORDER
        },
        "failure_count": len(failures),
        "failures": failures,
        "final_safety_false_positive_case_ids": [
            example["case_id"]
            for example in examples
            if example["expected_category"] != "safety_stop"
            and example["final_prediction"] == "safety_stop"
        ],
        "raw_retrieval_safety_false_positive_case_ids": [
            example["case_id"]
            for example in examples
            if example["expected_category"] != "safety_stop"
            and example["embedding_prediction_raw"] == "safety_stop"
        ],
        "safety_miss_case_ids": [
            example["case_id"]
            for example in examples
            if example["expected_category"] == "safety_stop"
            and example["final_prediction"] != "safety_stop"
        ],
        "requires_confirmation_case_ids": [
            example["case_id"]
            for example in examples
            if example["requires_confirmation"]
        ],
        "per_example": examples,
    }


def evaluate_backend(
    engine: DecisionEngine,
    cases: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "method": engine._method_metadata(),
        "pure_embedding": evaluate_mode(engine, cases, "pure_embedding"),
        "safety_gated_hybrid": evaluate_mode(
            engine,
            cases,
            "safety_gated_hybrid",
        ),
    }


def build_report(
    holdout_path: Path,
    reference_path: Path,
    fixed_evaluation_path: Path,
    robustness_path: Path,
) -> dict[str, Any]:
    frozen_assets = verify_frozen_assets()
    cases = load_holdout_cases(holdout_path)
    verify_no_exact_copies(
        cases,
        reference_path,
        fixed_evaluation_path,
        robustness_path,
    )
    sentence_engine = DecisionEngine(
        data_path=reference_path,
        method="sentence-transformers",
    )
    tfidf_engine = DecisionEngine(data_path=reference_path, method="tfidf")
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_disclosure": HOLDOUT_SOURCE,
        "case_count": len(cases),
        "language_distribution": dict(
            sorted(Counter(case["language"] for case in cases).items())
        ),
        "category_distribution": dict(
            sorted(
                Counter(
                    case["expected_category"] for case in cases
                ).items()
            )
        ),
        "frozen_assets": frozen_assets,
        "backend_results": {
            "sentence_transformer": evaluate_backend(
                sentence_engine,
                cases,
            ),
            "tfidf_fallback": evaluate_backend(tfidf_engine, cases),
        },
        "evidence_boundaries": [
            "The 48-case robustness set was used to identify architecture problems.",
            "The 60-case final holdout was created only after the safety-gated architecture was frozen.",
            "The final holdout must not be used for further tuning.",
            "All reference, evaluation, robustness and holdout data are synthetic rather than real user data.",
            "The results do not validate a product, medical correctness or exercise advice.",
            "A final safety_stop requires an explicit safety rule; semantic similarity alone cannot produce it.",
        ],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate the frozen safety-gated engine on final holdout data."
    )
    parser.add_argument(
        "--holdout-data",
        type=Path,
        default=DEFAULT_HOLDOUT_PATH,
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument(
        "--fixed-evaluation-data",
        type=Path,
        default=DEFAULT_FIXED_EVALUATION_PATH,
    )
    parser.add_argument(
        "--robustness-data",
        type=Path,
        default=DEFAULT_ROBUSTNESS_PATH,
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    report = build_report(
        args.holdout_data,
        args.data,
        args.fixed_evaluation_data,
        args.robustness_data,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
