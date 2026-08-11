"""Behavioural tests for retrieval, output boundaries and safety rules."""

from __future__ import annotations

import unittest

from ml.src.decision_engine import (
    SAFETY_MESSAGE,
    DecisionEngine,
    find_safety_rules,
)


class DecisionEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = DecisionEngine(method="auto")

    def test_fatigue_without_pain_adapts(self) -> None:
        result = self.engine.decide(
            "I feel tired after work, there is no pain, and I could do a shorter session."
        )
        self.assertEqual(result["selected_category"], "adapt")
        self.assertFalse(result["safety_override"]["active"])

    def test_time_conflict_postpones_or_adapts(self) -> None:
        result = self.engine.decide(
            "A late meeting conflicts with my workout and I have very little time."
        )
        self.assertIn(result["selected_category"], {"postpone", "adapt"})

    def test_explicit_refusal_declines(self) -> None:
        result = self.engine.decide(
            "I explicitly do not want to exercise today. End the plan."
        )
        self.assertEqual(result["selected_category"], "decline")

    def test_sudden_sharp_pain_uses_safety_override(self) -> None:
        result = self.engine.decide(
            "A sudden sharp pain started in my knee during the session."
        )
        self.assertEqual(result["selected_category"], "safety_stop")
        self.assertTrue(result["safety_override"]["active"])
        self.assertEqual(
            result["method"]["name"],
            "rule_based_safety_override",
        )

    def test_safety_stop_never_suggests_light_exercise(self) -> None:
        result = self.engine.decide(
            "I have chest pain and difficulty breathing."
        )
        self.assertEqual(result["suggested_action"], SAFETY_MESSAGE)
        action = result["suggested_action"].lower()
        for unsafe_phrase in ("light workout", "take a walk", "keep training"):
            self.assertNotIn(unsafe_phrase, action)

    def test_output_contains_evidence_and_limitations(self) -> None:
        result = self.engine.decide(
            "I am tired after work and want to reduce the planned session."
        )
        self.assertGreaterEqual(len(result["top_matches"]), 1)
        self.assertIn("rationale", result)
        self.assertIn("explanation", result)
        self.assertIn("limitations", result)
        self.assertTrue(result["limitations"])
        self.assertEqual(len(result["top_matches"]), 3)
        self.assertIn("data_source", result["top_matches"][0])
        self.assertIn("review_status", result["top_matches"][0])
        for field in (
            "decision_layer",
            "matched_intent_rule",
            "safety_rule_triggered",
            "matched_safety_rule",
            "explicit_intent",
            "embedding_prediction_raw",
            "best_non_safety_prediction",
            "embedding_prediction",
            "final_prediction",
            "override_reason",
            "top1_similarity",
            "top2_similarity",
            "similarity_margin",
            "requires_confirmation",
        ):
            self.assertIn(field, result)

    def test_core_case_fatigue_with_lighter_option_adapts(self) -> None:
        result = self.engine.decide(
            "I planned leg day after work, but I feel tired and do not want "
            "to go outside. I could still do something lighter."
        )
        self.assertEqual(result["final_prediction"], "adapt")
        self.assertIn("explicit_intent", result["decision_layer"])
        self.assertEqual(
            result["matched_intent_rule"],
            "user requests a lower-effort option",
        )

    def test_core_case_pressure_with_lower_effort_option_adapts(self) -> None:
        result = self.engine.decide(
            "I feel pressured by the full plan. Please give me a "
            "lower-effort option."
        )
        self.assertEqual(result["final_prediction"], "adapt")
        self.assertEqual(
            result["matched_intent_rule"],
            "user requests a lower-effort option",
        )

    def test_core_case_decline_without_rescheduling_declines(self) -> None:
        result = self.engine.decide(
            "I do not want to exercise today. Do not reschedule it."
        )
        self.assertEqual(result["final_prediction"], "decline")
        self.assertEqual(
            result["matched_intent_rule"],
            "user declines without an alternative or reschedule",
        )

    def test_core_case_move_to_tomorrow_postpones(self) -> None:
        result = self.engine.decide(
            "I cannot train today. Move the session to tomorrow."
        )
        self.assertEqual(result["final_prediction"], "postpone")
        self.assertEqual(
            result["matched_intent_rule"],
            "user explicitly requests postponement",
        )

    def test_core_case_sharp_chest_pain_stops_safely(self) -> None:
        result = self.engine.decide(
            "I have sudden sharp chest pain and feel dizzy."
        )
        self.assertEqual(result["decision_layer"], "safety_override")
        self.assertEqual(result["final_prediction"], "safety_stop")
        self.assertIsNone(result["embedding_prediction"])
        self.assertEqual(result["suggested_action"], SAFETY_MESSAGE)
        unsafe_terms = ("walk", "light", "lighter", "continue exercise")
        self.assertFalse(
            any(term in result["suggested_action"].lower() for term in unsafe_terms)
        )

    def test_main_cli_example_adapts_without_explicit_lighter_word(self) -> None:
        result = self.engine.decide(
            "I planned leg day after work, but I feel tired and do not want "
            "to go outside."
        )
        self.assertEqual(result["final_prediction"], "adapt")
        self.assertEqual(
            result["matched_intent_rule"],
            "fatigue and an outdoor barrier without total refusal",
        )

    def test_tired_alone_is_not_an_explicit_decline(self) -> None:
        result = self.engine.decide("I feel tired after work.")
        self.assertNotEqual(result["decision_layer"], "explicit_intent_override")
        self.assertIsNone(result["matched_intent_rule"])

    def test_chinese_lower_effort_intent_adapts(self) -> None:
        result = self.engine.decide("我今天很累，但还能做一点轻量训练。")
        self.assertEqual(result["final_prediction"], "adapt")
        self.assertIn("explicit_intent", result["decision_layer"])

    def test_chinese_reschedule_intent_postpones(self) -> None:
        result = self.engine.decide("我今天不能训练，请改到明天。")
        self.assertEqual(result["final_prediction"], "postpone")
        self.assertIn("explicit_intent", result["decision_layer"])

    def test_chinese_decline_without_alternative_declines(self) -> None:
        result = self.engine.decide(
            "我今天不运动，不需要替代方案，也不要改期。"
        )
        self.assertEqual(result["final_prediction"], "decline")
        self.assertIn("explicit_intent", result["decision_layer"])

    def test_safety_rule_precedes_lighter_intent(self) -> None:
        result = self.engine.decide(
            "I have sudden sharp chest pain, but I could do something lighter."
        )
        self.assertEqual(result["decision_layer"], "safety_override")
        self.assertEqual(result["final_prediction"], "safety_stop")
        self.assertIsNone(result["embedding_prediction"])

    def test_chinese_safety_language_is_rule_based(self) -> None:
        result = self.engine.decide("运动时突然胸痛，而且呼吸困难。")
        self.assertEqual(result["selected_category"], "safety_stop")
        self.assertTrue(result["safety_override"]["active"])

    def test_negated_unusual_pain_does_not_trigger_safety(self) -> None:
        result = self.engine.decide(
            "I feel tired after work but have no unusual pain."
        )
        self.assertFalse(result["safety_override"]["active"])

    def test_difficult_to_breathe_triggers_safety(self) -> None:
        result = self.engine.decide(
            "It has become difficult to breathe during the session."
        )
        self.assertEqual(result["selected_category"], "safety_stop")
        self.assertTrue(result["safety_override"]["active"])

    def test_contrast_after_negation_still_triggers_safety(self) -> None:
        result = self.engine.decide(
            "I had no pain earlier, but now I have chest pain."
        )
        self.assertEqual(result["selected_category"], "safety_stop")
        self.assertTrue(result["safety_override"]["active"])

    def test_reference_safety_flags_match_rule_coverage(self) -> None:
        for scenario in self.engine.scenarios:
            with self.subTest(scenario=scenario.scenario_id):
                self.assertEqual(
                    bool(find_safety_rules(scenario.scenario_text)),
                    scenario.safety_flag,
                )


if __name__ == "__main__":
    unittest.main()
