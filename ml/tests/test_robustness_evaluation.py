"""Integrity tests for the frozen independent robustness audit."""

from __future__ import annotations

import json
import unittest
from collections import Counter

from ml.src.decision_engine import DEFAULT_DATA_PATH, DecisionEngine
from ml.src.robustness_evaluate import (
    DEFAULT_FIXED_EVALUATION_PATH,
    DEFAULT_OUTPUT_PATH,
    DEFAULT_ROBUSTNESS_PATH,
    FROZEN_FIXED_EVALUATION_SHA256,
    FROZEN_REFERENCE_SHA256,
    FROZEN_RULES_SHA256,
    ROBUSTNESS_SOURCE,
    _file_sha256,
    load_robustness_cases,
    verify_no_exact_copies,
)


class RobustnessDatasetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cases = load_robustness_cases(DEFAULT_ROBUSTNESS_PATH)
        cls.engine = DecisionEngine(method="tfidf")

    def test_dataset_has_frozen_balanced_scope(self) -> None:
        self.assertEqual(len(self.cases), 48)
        self.assertEqual(
            Counter(case["language"] for case in self.cases),
            {"en": 24, "zh": 24},
        )
        self.assertEqual(
            Counter(case["expected_category"] for case in self.cases),
            {
                "adapt": 12,
                "postpone": 12,
                "decline": 12,
                "safety_stop": 12,
            },
        )
        self.assertTrue(
            all(case["data_source"] == ROBUSTNESS_SOURCE for case in self.cases)
        )

    def test_robustness_cases_are_not_exact_frozen_data_copies(self) -> None:
        verify_no_exact_copies(
            self.cases,
            DEFAULT_DATA_PATH,
            DEFAULT_FIXED_EVALUATION_PATH,
        )

    def test_all_seven_focus_cases_are_present_once(self) -> None:
        focus = [
            case["focus_case"]
            for case in self.cases
            if case.get("focus_case") is not None
        ]
        self.assertEqual(sorted(focus), list(range(1, 8)))

    def test_historical_report_keeps_pre_audit_rule_hash(self) -> None:
        report = json.loads(DEFAULT_OUTPUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(
            report["frozen_assets"]["safety_and_intent_rules_sha256"],
            FROZEN_RULES_SHA256,
        )

    def test_reference_and_fixed_evaluation_data_match_frozen_hashes(self) -> None:
        self.assertEqual(_file_sha256(DEFAULT_DATA_PATH), FROZEN_REFERENCE_SHA256)
        self.assertEqual(
            _file_sha256(DEFAULT_FIXED_EVALUATION_PATH),
            FROZEN_FIXED_EVALUATION_SHA256,
        )

    def test_embedding_output_exposes_uncertainty_diagnostics(self) -> None:
        result = self.engine.embedding_decide(
            "A vague change makes the original activity feel different."
        )
        self.assertIsInstance(result["top1_similarity"], float)
        self.assertIsInstance(result["top2_similarity"], float)
        self.assertAlmostEqual(
            result["similarity_margin"],
            round(result["top1_similarity"] - result["top2_similarity"], 4),
        )
        self.assertIsInstance(result["requires_confirmation"], bool)
        self.assertIn("confirmation_thresholds", result)

    def test_explicit_intent_does_not_request_model_confirmation(self) -> None:
        result = self.engine.decide(
            "Please give me a lower-effort option instead."
        )
        self.assertIn("explicit_intent", result["decision_layer"])
        self.assertFalse(result["requires_confirmation"])

    def test_safety_override_does_not_request_model_confirmation(self) -> None:
        result = self.engine.decide("I have sudden sharp chest pain.")
        self.assertEqual(result["decision_layer"], "safety_override")
        self.assertFalse(result["requires_confirmation"])
        self.assertIsNone(result["top1_similarity"])


if __name__ == "__main__":
    unittest.main()
