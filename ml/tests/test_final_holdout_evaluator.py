"""Pre-freeze structural tests for the final holdout evaluator."""

from __future__ import annotations

import unittest

from ml.src.decision_engine import DecisionEngine
from ml.src.final_holdout_evaluate import (
    FROZEN_SAFETY_GATED_RULES_SHA256,
    current_rules_sha256,
    evaluate_mode,
    verify_frozen_assets,
)


class FinalHoldoutEvaluatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = DecisionEngine(method="tfidf")
        cls.fixture_cases = [
            {
                "case_id": "fixture-adapt",
                "language": "en",
                "input_text": "I can still do a shorter option.",
                "expected_category": "adapt",
                "phenomena": ["temporary evaluator fixture"],
            },
            {
                "case_id": "fixture-postpone",
                "language": "en",
                "input_text": "Move this to tomorrow.",
                "expected_category": "postpone",
                "phenomena": ["temporary evaluator fixture"],
            },
            {
                "case_id": "fixture-decline",
                "language": "zh",
                "input_text": "今天不运动，也不要改期。",
                "expected_category": "decline",
                "phenomena": ["temporary evaluator fixture"],
            },
            {
                "case_id": "fixture-safety",
                "language": "zh",
                "input_text": "运动时突然出现尖锐疼痛。",
                "expected_category": "safety_stop",
                "phenomena": ["temporary evaluator fixture"],
            },
        ]

    def test_architecture_rule_hash_is_frozen(self) -> None:
        self.assertEqual(
            current_rules_sha256(),
            FROZEN_SAFETY_GATED_RULES_SHA256,
        )

    def test_historical_assets_match_frozen_hashes(self) -> None:
        actual = verify_frozen_assets()
        self.assertEqual(len(actual), 6)

    def test_pure_and_gated_modes_return_complete_metrics(self) -> None:
        for mode in ("pure_embedding", "safety_gated_hybrid"):
            with self.subTest(mode=mode):
                result = evaluate_mode(
                    self.engine,
                    self.fixture_cases,
                    mode,
                )
                self.assertEqual(result["metrics"]["total"], 4)
                self.assertIn("language_accuracy", result)
                self.assertIn("per_category", result)
                self.assertIn("confusion_by_expected_category", result)
                self.assertIn(
                    "raw_retrieval_safety_false_positive_rate",
                    result["metrics"],
                )


if __name__ == "__main__":
    unittest.main()
