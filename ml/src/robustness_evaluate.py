"""Run the frozen decision engine against an independent robustness set."""

from __future__ import annotations

import argparse
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


DEFAULT_ROBUSTNESS_PATH = PROJECT_ROOT / "data" / "robustness_cases.jsonl"
DEFAULT_FIXED_EVALUATION_PATH = PROJECT_ROOT / "data" / "evaluation_cases.csv"
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "outputs" / "robustness_results.json"
ROBUSTNESS_SOURCE = (
    "independent synthetic robustness set, created after model and rules were frozen"
)
FROZEN_RULES_SHA256 = (
    "8525d61f2724ef6565c8415e99d074ed32ba1f9692c437523a9f5b966c8a3808"
)
FROZEN_REFERENCE_SHA256 = (
    "9f528f9c88477a378da7c9ed43f1997e0f418d01b8e569a88f5bd2f7e2cfb16d"
)
FROZEN_FIXED_EVALUATION_SHA256 = (
    "2c465f34407963f27fff31e2a5f0ba0c19a0a45be4db542a2cb3df5a66fac35a"
)


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def current_rules_sha256() -> str:
    payload = json.dumps(
        {"safety": SAFETY_RULES, "intent": INTENT_RULES},
        ensure_ascii=False,
        sort_keys=True,
        default=list,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def load_robustness_cases(path: Path) -> list[dict[str, Any]]:
    cases = [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if len(cases) < 48:
        raise ValueError("Robustness set must contain at least 48 cases")

    ids = [case["case_id"] for case in cases]
    if len(ids) != len(set(ids)):
        raise ValueError("Robustness case IDs must be unique")

    languages = Counter(case["language"] for case in cases)
    if languages != {"en": 24, "zh": 24}:
        raise ValueError(
            f"Robustness language distribution must be 24/24, found {languages}"
        )

    categories = Counter(case["expected_category"] for case in cases)
    if any(categories[category] < 10 for category in VALID_CATEGORIES):
        raise ValueError(
            "Each category requires at least 10 robustness cases: "
            f"{categories}"
        )

    focus_cases = {
        case["focus_case"]
        for case in cases
        if case.get("focus_case") is not None
    }
    if focus_cases != set(range(1, 8)):
        raise ValueError(f"Focus cases 1-7 are required, found {focus_cases}")

    for case in cases:
        if case["expected_category"] not in VALID_CATEGORIES:
            raise ValueError(
                f"{case['case_id']} has invalid category "
                f"{case['expected_category']}"
            )
        if case["data_source"] != ROBUSTNESS_SOURCE:
            raise ValueError(
                f"{case['case_id']} has an invalid source disclosure"
            )
        if not case.get("phenomena"):
            raise ValueError(f"{case['case_id']} is missing phenomena labels")
    return cases


def verify_no_exact_copies(
    cases: list[dict[str, Any]],
    reference_path: Path,
    fixed_evaluation_path: Path,
) -> None:
    existing = {
        _normalise(scenario.scenario_text)
        for scenario in load_scenarios(reference_path)
    }
    import csv

    with fixed_evaluation_path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as stream:
        existing.update(
            _normalise(row["input_text"])
            for row in csv.DictReader(stream)
        )
    duplicates = [
        case["case_id"]
        for case in cases
        if _normalise(case["input_text"]) in existing
    ]
    if duplicates:
        raise ValueError(
            "Robustness cases must not copy frozen data: "
            + ", ".join(duplicates)
        )


def _language_accuracy(
    per_example: list[dict[str, Any]],
) -> dict[str, dict[str, float | int]]:
    report: dict[str, dict[str, float | int]] = {}
    for language in ("en", "zh"):
        examples = [
            example
            for example in per_example
            if example["language"] == language
        ]
        correct = sum(example["top1_correct"] for example in examples)
        report[language] = {
            "accuracy": round(correct / len(examples), 4),
            "correct": correct,
            "total": len(examples),
        }
    return report


def evaluate_mode(
    engine: DecisionEngine,
    cases: list[dict[str, Any]],
    mode: str,
) -> dict[str, Any]:
    if mode == "pure_embedding":
        decide: Callable[[str], dict[str, Any]] = engine.embedding_decide
    elif mode == "hybrid_final":
        decide = engine.decide
    else:
        raise ValueError(f"Unsupported mode: {mode}")

    confusion: defaultdict[str, Counter[str]] = defaultdict(Counter)
    per_example: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    safety_false_positives: list[dict[str, Any]] = []
    safety_misses: list[dict[str, Any]] = []
    confirmation_cases: list[dict[str, Any]] = []
    focus_cases: list[dict[str, Any]] = []
    correct = 0
    safety_expected = 0
    safety_override_hits = 0
    non_safety_count = 0
    safety_override_false_positives = 0
    explicit_rule_triggers = 0
    rule_rewrites = 0

    for case in cases:
        result = decide(case["input_text"])
        expected = case["expected_category"]
        predicted = result["final_prediction"]
        is_correct = predicted == expected
        correct += int(is_correct)
        confusion[expected][predicted] += 1

        if expected == "safety_stop":
            safety_expected += 1
            safety_override_hits += int(result["safety_override"]["active"])
        else:
            non_safety_count += 1
            safety_override_false_positives += int(
                result["safety_override"]["active"]
            )

        if result["decision_layer"].startswith("explicit_intent"):
            explicit_rule_triggers += 1
        if (
            result["embedding_prediction"] is not None
            and result["embedding_prediction"] != result["final_prediction"]
        ):
            rule_rewrites += 1

        record = {
            "case_id": case["case_id"],
            "focus_case": case.get("focus_case"),
            "language": case["language"],
            "input_text": case["input_text"],
            "phenomena": case["phenomena"],
            "expected_category": expected,
            "embedding_prediction": result["embedding_prediction"],
            "final_prediction": predicted,
            "decision_layer": result["decision_layer"],
            "matched_intent_rule": result["matched_intent_rule"],
            "override_reason": result["override_reason"],
            "top1_correct": is_correct,
            "top1_similarity": result["top1_similarity"],
            "top2_similarity": result["top2_similarity"],
            "similarity_margin": result["similarity_margin"],
            "requires_confirmation": result["requires_confirmation"],
            "confirmation_reasons": result["confirmation_reasons"],
            "safety_override": result["safety_override"],
            "top_match_ids": [
                match["scenario_id"] for match in result["top_matches"]
            ],
        }
        per_example.append(record)

        if not is_correct:
            failures.append(record)
        if predicted == "safety_stop" and expected != "safety_stop":
            safety_false_positives.append(record)
        if expected == "safety_stop" and predicted != "safety_stop":
            safety_misses.append(record)
        if result["requires_confirmation"]:
            confirmation_cases.append(record)
        if case.get("focus_case") is not None:
            focus_cases.append(record)

    count = len(cases)
    return {
        "metrics": {
            "overall_accuracy": round(correct / count, 4),
            "correct": correct,
            "total": count,
            "safety_category_recall": round(
                (safety_expected - len(safety_misses)) / safety_expected,
                4,
            ),
            "safety_category_false_positive_rate": round(
                len(safety_false_positives) / non_safety_count,
                4,
            ),
            "safety_override_recall": (
                round(safety_override_hits / safety_expected, 4)
                if mode == "hybrid_final"
                else None
            ),
            "safety_override_false_positive_rate": (
                round(
                    safety_override_false_positives / non_safety_count,
                    4,
                )
                if mode == "hybrid_final"
                else None
            ),
            "safety_expected": safety_expected,
            "non_safety_examples": non_safety_count,
            "explicit_intent_rule_trigger_count": (
                explicit_rule_triggers if mode == "hybrid_final" else 0
            ),
            "embedding_prediction_rewrite_count": (
                rule_rewrites if mode == "hybrid_final" else 0
            ),
            "requires_confirmation_count": len(confirmation_cases),
            "requires_confirmation_rate": round(
                len(confirmation_cases) / count,
                4,
            ),
        },
        "language_accuracy": _language_accuracy(per_example),
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
        "safety_false_positive_count": len(safety_false_positives),
        "safety_false_positive_case_ids": [
            case["case_id"] for case in safety_false_positives
        ],
        "safety_miss_count": len(safety_misses),
        "safety_miss_case_ids": [
            case["case_id"] for case in safety_misses
        ],
        "requires_confirmation_case_ids": [
            case["case_id"] for case in confirmation_cases
        ],
        "focus_cases": sorted(
            (
                {
                    "focus_case": case["focus_case"],
                    "case_id": case["case_id"],
                    "input_text": case["input_text"],
                    "expected_category": case["expected_category"],
                    "final_prediction": case["final_prediction"],
                    "decision_layer": case["decision_layer"],
                    "safety_override_active": case["safety_override"]["active"],
                    "requires_confirmation": case["requires_confirmation"],
                }
                for case in focus_cases
            ),
            key=lambda case: case["focus_case"],
        ),
        "per_example": per_example,
    }


def evaluate_backend(
    engine: DecisionEngine,
    cases: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "method": engine._method_metadata(),
        "pure_embedding": evaluate_mode(engine, cases, "pure_embedding"),
        "hybrid_final": evaluate_mode(engine, cases, "hybrid_final"),
    }


def build_report(
    robustness_path: Path,
    reference_path: Path,
    fixed_evaluation_path: Path,
) -> dict[str, Any]:
    cases = load_robustness_cases(robustness_path)
    verify_no_exact_copies(cases, reference_path, fixed_evaluation_path)
    rules_hash = current_rules_sha256()
    reference_hash = _file_sha256(reference_path)
    fixed_evaluation_hash = _file_sha256(fixed_evaluation_path)
    if rules_hash != FROZEN_RULES_SHA256:
        raise ValueError(
            "Frozen safety or intent rules changed before robustness evaluation"
        )
    if reference_hash != FROZEN_REFERENCE_SHA256:
        raise ValueError("Frozen 42-scenario reference dataset changed")
    if fixed_evaluation_hash != FROZEN_FIXED_EVALUATION_SHA256:
        raise ValueError("Frozen 16-case evaluation dataset changed")

    sentence_engine = DecisionEngine(
        data_path=reference_path,
        method="sentence-transformers",
    )
    tfidf_engine = DecisionEngine(data_path=reference_path, method="tfidf")
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_disclosure": ROBUSTNESS_SOURCE,
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
        "frozen_assets": {
            "reference_data_sha256": reference_hash,
            "fixed_evaluation_data_sha256": fixed_evaluation_hash,
            "safety_and_intent_rules_sha256": rules_hash,
            "reference_data_changed_for_audit": False,
            "fixed_evaluation_data_changed_for_audit": False,
            "rules_changed_for_audit": False,
        },
        "confirmation_thresholds": {
            "selection_timing": (
                "Frozen before running this robustness set, using the five "
                "non-safety, non-intent examples in the existing 16-case set."
            ),
            "sentence_transformer": {
                "minimum_top1_similarity": 0.50,
                "minimum_similarity_margin": 0.04,
                "frozen_set_observed_top1_range": [0.5308, 0.6948],
                "frozen_set_observed_margin_range": [0.0191, 0.3014],
            },
            "tfidf_fallback": {
                "minimum_top1_similarity": 0.17,
                "minimum_similarity_margin": 0.04,
                "frozen_set_observed_top1_range": [0.1817, 0.3174],
                "frozen_set_observed_margin_range": [0.0055, 0.1715],
            },
            "interpretation": (
                "requires_confirmation is a diagnostic flag, not a calibrated "
                "probability or a new output category."
            ),
        },
        "backend_results": {
            "sentence_transformer": evaluate_backend(
                sentence_engine,
                cases,
            ),
            "tfidf_fallback": evaluate_backend(tfidf_engine, cases),
        },
        "evidence_boundaries": [
            "This independent synthetic robustness set was created after model and rules were frozen.",
            "The cases are synthetic and are not real user data.",
            "The results cannot demonstrate real-world generalisation.",
            "The results cannot establish that exercise or medical advice is correct.",
            "A perfect score on the fixed 16-case set is not product validation.",
            "Hybrid improvements may come from transparent rules rather than the embedding model itself.",
        ],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate the frozen engine on independent robustness cases."
    )
    parser.add_argument(
        "--robustness-data",
        type=Path,
        default=DEFAULT_ROBUSTNESS_PATH,
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument(
        "--fixed-evaluation-data",
        type=Path,
        default=DEFAULT_FIXED_EVALUATION_PATH,
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    report = build_report(
        args.robustness_data,
        args.data,
        args.fixed_evaluation_data,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
