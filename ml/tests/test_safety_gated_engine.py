"""Regression tests for the safety-gated hybrid decision architecture."""

from __future__ import annotations

import unittest

from ml.src.decision_engine import DecisionEngine


class SafetyGatedEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = DecisionEngine(method="tfidf")

    def test_negated_chest_pain_cannot_finish_as_safety_stop(self) -> None:
        result = self.engine.decide(
            "I do not have chest pain. I am only tired."
        )
        self.assertFalse(result["safety_rule_triggered"])
        self.assertNotEqual(result["final_prediction"], "safety_stop")

    def test_chest_day_cannot_finish_as_safety_stop(self) -> None:
        result = self.engine.decide(
            "Today is chest day, but I only have twenty minutes."
        )
        self.assertFalse(result["safety_rule_triggered"])
        self.assertNotEqual(result["final_prediction"], "safety_stop")

    def test_chinese_negated_sudden_pain_is_not_safety_stop(self) -> None:
        result = self.engine.decide("我没有突然疼痛，只是有点累。")
        self.assertFalse(result["safety_rule_triggered"])
        self.assertNotEqual(result["final_prediction"], "safety_stop")

    def test_dizziness_and_breathing_difficulty_stops(self) -> None:
        result = self.engine.decide(
            "I felt dizzy and had difficulty breathing."
        )
        self.assertTrue(result["safety_rule_triggered"])
        self.assertEqual(result["decision_layer"], "safety_override")
        self.assertEqual(result["final_prediction"], "safety_stop")

    def test_chinese_cancel_without_tomorrow_declines(self) -> None:
        result = self.engine.decide(
            "我今天不运动，也不要帮我改到明天。"
        )
        self.assertEqual(result["final_prediction"], "decline")
        self.assertEqual(
            result["explicit_intent"]["category"],
            "decline",
        )

    def test_chinese_move_to_tomorrow_postpones(self) -> None:
        result = self.engine.decide(
            "我今天不练，帮我改到明天晚上。"
        )
        self.assertEqual(result["final_prediction"], "postpone")
        self.assertEqual(
            result["explicit_intent"]["category"],
            "postpone",
        )

    def test_raw_safety_retrieval_is_gated_without_safety_rule(self) -> None:
        engine = DecisionEngine(method="tfidf")

        class SafetyFirstStub:
            method_name = "tfidf_word_char_cosine_fallback"
            model_name = None

            def similarities(self, _text: str) -> list[float]:
                return [
                    (
                        1.0
                        if scenario.category == "safety_stop"
                        else 0.9
                        if scenario.category == "adapt"
                        else 0.2
                    )
                    for scenario in engine.scenarios
                ]

        engine.backend = SafetyFirstStub()
        result = engine.decide("I am only tired after work.")
        self.assertFalse(result["safety_rule_triggered"])
        self.assertEqual(result["embedding_prediction_raw"], "safety_stop")
        self.assertNotEqual(result["final_prediction"], "safety_stop")
        self.assertEqual(result["best_non_safety_prediction"], "adapt")
        self.assertTrue(result["requires_confirmation"])
        self.assertEqual(
            result["override_reason"],
            "Retrieval suggested a safety category, but no explicit safety "
            "signal was detected.",
        )


if __name__ == "__main__":
    unittest.main()
