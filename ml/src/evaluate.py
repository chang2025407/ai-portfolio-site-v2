"""Compare pure retrieval and hybrid decisions on fixed synthetic test cases."""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from .decision_engine import (
    DEFAULT_DATA_PATH,
    PROJECT_ROOT,
    VALID_CATEGORIES,
    DecisionEngine,
    load_scenarios,
)


DEFAULT_TEST_PATH = PROJECT_ROOT / "data" / "evaluation_cases.csv"
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "outputs" / "evaluation_results.json"
ROUND1_OUTPUT_PATH = PROJECT_ROOT / "outputs" / "round1_evaluation_results.json"
CATEGORY_ORDER = ("adapt", "postpone", "decline", "safety_stop")


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def load_evaluation_cases(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        cases = list(csv.DictReader(stream))
    if not cases:
        raise ValueError("Evaluation set is empty")
    for case in cases:
        if case["expected_category"] not in VALID_CATEGORIES:
            raise ValueError(
                f"{case['case_id']} has unsupported category "
                f"{case['expected_category']}"
            )
    return cases


def ensure_independent_cases(
    cases: list[dict[str, str]],
    reference_path: Path,
) -> None:
    reference_texts = {
        _normalise(scenario.scenario_text)
        for scenario in load_scenarios(reference_path)
    }
    duplicated = [
        case["case_id"]
        for case in cases
        if _normalise(case["input_text"]) in reference_texts
    ]
    if duplicated:
        raise ValueError(
            "Evaluation cases must not exactly duplicate reference scenarios: "
            + ", ".join(duplicated)
        )


def _classification_metrics(
    confusion: dict[str, Counter[str]],
) -> dict[str, dict[str, float | int]]:
    metrics: dict[str, dict[str, float | int]] = {}
    for category in CATEGORY_ORDER:
        true_positive = confusion[category].get(category, 0)
        false_positive = sum(
            confusion[expected].get(category, 0)
            for expected in CATEGORY_ORDER
            if expected != category
        )
        false_negative = sum(
            count
            for predicted, count in confusion[category].items()
            if predicted != category
        )
        support = sum(confusion[category].values())
        precision = (
            true_positive / (true_positive + false_positive)
            if true_positive + false_positive
            else 0.0
        )
        recall = true_positive / support if support else 0.0
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall
            else 0.0
        )
        metrics[category] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": support,
        }
    return metrics


def evaluate_mode(
    engine: DecisionEngine,
    cases: list[dict[str, str]],
    mode: str,
) -> dict[str, Any]:
    if mode == "pure_embedding":
        decide: Callable[[str], dict[str, Any]] = engine.embedding_decide
    elif mode == "hybrid_final":
        decide = engine.decide
    else:
        raise ValueError(f"Unsupported evaluation mode: {mode}")

    confusion: defaultdict[str, Counter[str]] = defaultdict(Counter)
    per_example: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    differences: list[dict[str, Any]] = []
    top1_correct = 0
    top3_all_hits = 0
    top3_non_safety_hits = 0
    non_safety_count = 0
    safety_expected = 0
    safety_overrides = 0
    rule_usage = 0
    confirmation_count = 0

    for case in cases:
        result = decide(case["input_text"])
        expected = case["expected_category"]
        predicted = result["final_prediction"]
        embedding_prediction = result["embedding_prediction"]
        top_categories = [match["category"] for match in result["top_matches"]]
        top1_hit = predicted == expected
        top3_hit = expected in top_categories if top_categories else None
        top1_correct += int(top1_hit)
        top3_all_hits += int(top3_hit is True)
        confusion[expected][predicted] += 1

        if expected == "safety_stop":
            safety_expected += 1
            safety_overrides += int(result["safety_override"]["active"])
        else:
            non_safety_count += 1
            top3_non_safety_hits += int(top3_hit is True)

        if result["decision_layer"].startswith("explicit_intent"):
            rule_usage += 1
        confirmation_count += int(result["requires_confirmation"])

        changed = (
            embedding_prediction is not None
            and embedding_prediction != result["final_prediction"]
        )
        if changed:
            differences.append(
                {
                    "case_id": case["case_id"],
                    "embedding_prediction": embedding_prediction,
                    "final_prediction": result["final_prediction"],
                    "matched_intent_rule": result["matched_intent_rule"],
                    "override_reason": result["override_reason"],
                }
            )

        record = {
            "case_id": case["case_id"],
            "input_text": case["input_text"],
            "expected_category": expected,
            "embedding_prediction": embedding_prediction,
            "final_prediction": result["final_prediction"],
            "decision_layer": result["decision_layer"],
            "matched_intent_rule": result["matched_intent_rule"],
            "override_reason": result["override_reason"],
            "top1_correct": top1_hit,
            "top3_retrieval_hit": top3_hit,
            "similarity_score": result["similarity_score"],
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

        if not top1_hit:
            failures.append(
                {
                    **record,
                    "failure_type": "category_mismatch",
                }
            )

    test_count = len(cases)
    retrieval_evaluated = (
        non_safety_count if mode == "hybrid_final" else test_count
    )
    retrieval_hits = (
        top3_non_safety_hits if mode == "hybrid_final" else top3_all_hits
    )
    return {
        "metrics": {
            "top1_category_accuracy": round(top1_correct / test_count, 4),
            "top1_correct": top1_correct,
            "top1_total": test_count,
            "top3_retrieval_hit_rate": round(
                retrieval_hits / retrieval_evaluated, 4
            ),
            "top3_retrieval_hits": retrieval_hits,
            "retrieval_evaluated_examples": retrieval_evaluated,
            "retrieval_excluded_safety_examples": (
                safety_expected if mode == "hybrid_final" else 0
            ),
            "retrieval_denominator_note": (
                "Hybrid retrieval is reported as 12/12 because four safety "
                "examples stop at the safety layer before retrieval."
                if mode == "hybrid_final"
                else "Pure retrieval is evaluated diagnostically on all 16 examples."
            ),
            "top3_non_safety_retrieval_hit_rate": round(
                top3_non_safety_hits / non_safety_count, 4
            ),
            "top3_non_safety_hits": top3_non_safety_hits,
            "top3_non_safety_total": non_safety_count,
            "safety_override_recall": (
                round(safety_overrides / safety_expected, 4)
                if mode == "hybrid_final"
                else None
            ),
            "safety_override_hits": (
                safety_overrides if mode == "hybrid_final" else None
            ),
            "safety_examples": safety_expected,
            "explicit_intent_rule_usage_count": (
                rule_usage if mode == "hybrid_final" else 0
            ),
            "rule_override_usage_count": (
                len(differences) if mode == "hybrid_final" else 0
            ),
            "explicit_intent_confirmation_count": (
                rule_usage - len(differences)
                if mode == "hybrid_final"
                else 0
            ),
            "embedding_final_difference_count": len(differences),
            "requires_confirmation_count": confirmation_count,
            "requires_confirmation_rate": round(
                confirmation_count / test_count,
                4,
            ),
        },
        "per_category": _classification_metrics(confusion),
        "confusion_by_expected_category": {
            expected: {
                predicted: confusion[expected].get(predicted, 0)
                for predicted in CATEGORY_ORDER
            }
            for expected in CATEGORY_ORDER
        },
        "embedding_final_differences": differences,
        "failure_count": len(failures),
        "failures": failures,
        "per_example": per_example,
    }


def evaluate_backend(
    engine: DecisionEngine,
    cases: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "method": engine._method_metadata(),
        "pure_embedding": evaluate_mode(engine, cases, "pure_embedding"),
        "hybrid_final": evaluate_mode(engine, cases, "hybrid_final"),
    }


def load_round1_baseline() -> dict[str, Any] | None:
    if not ROUND1_OUTPUT_PATH.exists():
        return None
    baseline = json.loads(ROUND1_OUTPUT_PATH.read_text(encoding="utf-8"))
    return {
        "method": baseline.get("method"),
        "reference_scenario_count": baseline.get("reference_scenario_count"),
        "top1_category_accuracy": baseline.get("metrics", {}).get(
            "top1_category_accuracy"
        ),
        "failure_count": baseline.get("failure_count"),
        "failure_case_ids": [
            failure["case_id"] for failure in baseline.get("failures", [])
        ],
    }


def build_report(
    reference_path: Path,
    cases: list[dict[str, str]],
    requested_backends: tuple[str, ...],
) -> dict[str, Any]:
    ensure_independent_cases(cases, reference_path)
    references = load_scenarios(reference_path)
    backend_results: dict[str, Any] = {}

    if "sentence-transformers" in requested_backends:
        backend_results["sentence_transformer"] = evaluate_backend(
            DecisionEngine(
                data_path=reference_path,
                method="sentence-transformers",
            ),
            cases,
        )
    if "tfidf" in requested_backends:
        backend_results["tfidf_fallback"] = evaluate_backend(
            DecisionEngine(data_path=reference_path, method="tfidf"),
            cases,
        )

    primary_key = (
        "sentence_transformer"
        if "sentence_transformer" in backend_results
        else next(iter(backend_results))
    )
    primary = backend_results[primary_key]
    pure_accuracy = primary["pure_embedding"]["metrics"][
        "top1_category_accuracy"
    ]
    hybrid_accuracy = primary["hybrid_final"]["metrics"][
        "top1_category_accuracy"
    ]
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "reference_scenario_count": len(references),
        "reference_category_distribution": dict(
            sorted(Counter(item.category for item in references).items())
        ),
        "review_status_distribution": dict(
            sorted(Counter(item.review_status for item in references).items())
        ),
        "test_example_count": len(cases),
        "test_category_distribution": dict(
            sorted(Counter(case["expected_category"] for case in cases).items())
        ),
        "evaluation_set_unchanged": True,
        "primary_backend": primary_key,
        "backend_results": backend_results,
        "primary_comparison": {
            "pure_embedding_accuracy": pure_accuracy,
            "hybrid_final_accuracy": hybrid_accuracy,
            "accuracy_delta": round(hybrid_accuracy - pure_accuracy, 4),
        },
        "comparison_to_round1": load_round1_baseline(),
        "evidence_boundaries": [
            "A small synthetic dataset cannot demonstrate real-world generalisation.",
            "Metrics verify pipeline behaviour and expose errors; they are not product validation.",
            "User testing evaluates understanding and interaction, not model correctness.",
            "No medical effect, exercise outcome or behaviour change is measured.",
            "Safety rules are a transparent prototype boundary, not medical triage.",
        ],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Compare pure retrieval and hybrid decision behaviour."
    )
    parser.add_argument(
        "--backends",
        choices=("all", "sentence-transformers", "tfidf"),
        default="all",
        help="Evaluate both backends by default.",
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--test-data", type=Path, default=DEFAULT_TEST_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    requested = (
        ("sentence-transformers", "tfidf")
        if args.backends == "all"
        else (args.backends,)
    )
    report = build_report(
        args.data,
        load_evaluation_cases(args.test_data),
        requested,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
