"""Transparent hybrid retrieval and rule-based safety prototype."""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
VALID_CATEGORIES = {"adapt", "postpone", "decline", "safety_stop"}
DATA_SOURCE_LABEL = "LLM-assisted synthetic seed data"
REVIEW_STATUS_LABELS = {"manually review required", "manually reviewed"}
SAFETY_MESSAGE = (
    "This prototype does not provide medical diagnosis. Stop the current "
    "exercise plan and consider appropriate professional support depending "
    "on the situation."
)
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_PATH = PROJECT_ROOT / "data" / "exercise_scenarios.csv"


SAFETY_RULES: tuple[tuple[str, str], ...] = (
    ("sudden_pain", r"\b(?:sudden|suddenly)\s+(?:sharp\s+)?(?:pain|discomfort)\b"),
    ("sharp_pain", r"\bsharp\s+(?:pain|ache|discomfort)\b"),
    ("unusual_pain", r"\bunusual\s+(?:pain|ache|discomfort)\b"),
    ("worsening_pain", r"\b(?:pain|ache|discomfort)\b.{0,40}\b(?:worsening|getting worse|increasing)\b"),
    ("chest_pain", r"\bchest\s+(?:pain|hurts|ache|discomfort)\b"),
    ("dizziness", r"\b(?:dizzy|dizziness|lightheaded|light-headed)\b"),
    ("difficulty_breathing", r"\b(?:(?:difficulty|trouble|problems?|hard time)\s+(?:breathing|catching (?:my|your|their) breath)|difficult\s+to\s+breathe)\b"),
    ("shortness_of_breath", r"\bshortness of breath\b"),
    ("fainting", r"\b(?:fainting|fainted|nearly fainted|might faint|about to faint|passed out)\b"),
    ("zh_sudden_pain", r"(?:突然|突发).{0,6}(?:疼痛|剧痛|不适)"),
    ("zh_sharp_pain", r"(?:尖锐|刺痛|刀割样).{0,6}(?:疼痛|痛|不适)?"),
    ("zh_unusual_pain", r"(?:异常|不寻常).{0,6}(?:疼痛|痛|不适)"),
    ("zh_worsening_pain", r"(?:疼痛|痛|不适).{0,12}(?:加重|恶化|越来越严重)"),
    ("zh_chest_pain", r"(?:胸痛|胸口痛|胸部疼痛|胸闷)"),
    ("zh_dizziness", r"(?:头晕|眩晕)"),
    ("zh_difficulty_breathing", r"(?:呼吸困难|喘不上气|气短|无法呼吸)"),
    ("zh_fainting", r"(?:晕厥|昏倒|快要晕倒|差点晕倒)"),
)


LIMITATIONS = [
    "This is a research prototype built from a small synthetic seed dataset, not a validated product.",
    "Similarity is not a calibrated probability or medical assessment.",
    "The prototype does not diagnose conditions or decide whether a person should exercise.",
    "Rule-based safety coverage is intentionally conservative and incomplete.",
    "Real-world generalisation, multilingual performance and repeated use have not been established.",
]

CONFIRMATION_THRESHOLDS = {
    "sentence_transformer_cosine": {
        "minimum_top1_similarity": 0.50,
        "minimum_similarity_margin": 0.04,
    },
    "tfidf_word_char_cosine_fallback": {
        "minimum_top1_similarity": 0.17,
        "minimum_similarity_margin": 0.04,
    },
}

CATEGORY_RESPONSES = {
    "adapt": {
        "rationale": (
            "The user indicates willingness to continue with a lower-demand or "
            "lower-friction option."
        ),
        "suggested_action": (
            "Offer a shorter, lighter or more accessible alternative while "
            "keeping decline equally visible."
        ),
    },
    "postpone": {
        "rationale": (
            "The user explicitly indicates that the activity should move to a "
            "later time or another day."
        ),
        "suggested_action": (
            "Offer a clearly labelled rescheduling choice without creating a "
            "new commitment automatically."
        ),
    },
    "decline": {
        "rationale": (
            "The user explicitly declines exercise now and does not request a "
            "replacement or future session."
        ),
        "suggested_action": (
            "Confirm the decision neutrally, stop suggesting alternatives and "
            "end the current decision flow."
        ),
    },
}

INTENT_RULES: tuple[dict[str, Any], ...] = (
    {
        "name": "user declines without an alternative or reschedule",
        "category": "decline",
        "patterns": (
            r"\b(?:do not|don't)\s+(?:want|need)\s+(?:an?|any)\s+(?:alternative|replacement)\b",
            r"\bwithout\s+reschedul(?:e|ing)\b",
            r"\b(?:do not|don't|not)\s+reschedul(?:e|ing)\b",
            r"\bstop\s+suggesting\b",
            r"\bend\s+(?:this|the)\s+decision\b",
            r"\bclose\s+(?:this|the)\s+plan\b",
            r"\bno\s+exercise\b",
            r"(?:不要|不需要|无需).{0,12}(?:替代|改期|重新安排|其他方案|改到|安排到)",
            r"(?:停止|别再).{0,8}(?:建议|推荐|劝说)",
            r"(?:结束|关闭).{0,8}(?:决定|决策|计划)",
        ),
    },
    {
        "name": "user requests a lower-effort option",
        "category": "adapt",
        "patterns": (
            r"\bshorter\b",
            r"\blighter\b",
            r"\blower[-\s](?:effort|demand|intensity)\b",
            r"\breduce\s+(?:the\s+)?(?:plan|session|workout|effort|intensity|duration)\b",
            r"\bdo\s+less\b",
            r"\b(?:still\s+(?:want|willing)|can|could)\b.{0,35}\b(?:move|do|manage|exercise|train|something)\b",
            r"\bindoor\s+(?:option|alternative|workout|session)\b",
            r"(?:缩短|更短|轻量|更轻|低负担|降低强度|减少训练|少做一点)",
            r"(?:仍然|还是|还能|可以).{0,10}(?:动一动|运动|训练|做一点)",
            r"(?:室内).{0,8}(?:选项|替代|运动|训练)",
        ),
    },
    {
        "name": "fatigue and an outdoor barrier without total refusal",
        "category": "adapt",
        "patterns": (
            r"(?=.*\b(?:tired|fatigued|worn out|low energy)\b)(?=.*\b(?:do not|don't)\s+want\s+to\s+go\s+outside\b)",
            r"(?=.*(?:疲劳|很累|没精神|精力不足))(?=.*(?:不想出门|不想去户外))",
        ),
    },
    {
        "name": "user explicitly requests postponement",
        "category": "postpone",
        "patterns": (
            r"\b(?:tomorrow|later|postpone|reschedule)\b",
            r"\bmove\b.{0,25}\b(?:another day|a different day|tomorrow|later)\b",
            r"(?:明天|稍后|以后|改期|重新安排|另一天|改到)",
        ),
    },
    {
        "name": "user explicitly declines today's exercise",
        "category": "decline",
        "patterns": (
            r"\b(?:cancel|skip)\s+(?:today(?:'s)?|this)\s+(?:workout|session|training|plan)?\b",
            r"\b(?:not today|today off)\b",
            r"\b(?:do not|don't|choose not to)\s+(?:want to\s+)?(?:exercise|work out|train)\s+today\b",
            r"(?:今天|这次).{0,8}(?:不运动|不训练|取消|跳过)",
        ),
    },
)


@dataclass(frozen=True)
class Scenario:
    scenario_id: str
    scenario_text: str
    category: str
    rationale: str
    suggested_action: str
    safety_flag: bool
    data_source: str
    review_status: str


def load_scenarios(path: Path | str = DEFAULT_DATA_PATH) -> list[Scenario]:
    """Load and validate the manually reviewable synthetic reference set."""

    scenarios: list[Scenario] = []
    with Path(path).open("r", encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            category = row["category"].strip()
            if category not in VALID_CATEGORIES:
                raise ValueError(f"Unsupported category: {category}")
            if row["data_source"].strip() != DATA_SOURCE_LABEL:
                raise ValueError(f"{row['scenario_id']} has an invalid data-source disclosure")
            if row["review_status"].strip() not in REVIEW_STATUS_LABELS:
                raise ValueError(f"{row['scenario_id']} is missing the manual-review label")
            safety_flag = row["safety_flag"].strip().lower() == "true"
            if safety_flag != (category == "safety_stop"):
                raise ValueError(
                    f"{row['scenario_id']} has inconsistent category and safety flag"
                )
            scenarios.append(
                Scenario(
                    scenario_id=row["scenario_id"].strip(),
                    scenario_text=row["scenario_text"].strip(),
                    category=category,
                    rationale=row["rationale"].strip(),
                    suggested_action=row["suggested_action"].strip(),
                    safety_flag=safety_flag,
                    data_source=row["data_source"].strip(),
                    review_status=row["review_status"].strip(),
                )
            )
    if not scenarios:
        raise ValueError("Scenario dataset is empty")
    if len({scenario.scenario_id for scenario in scenarios}) != len(scenarios):
        raise ValueError("Scenario IDs must be unique")
    return scenarios


def find_safety_rules(text: str) -> list[str]:
    """Return the explicit safety rules matched before model retrieval."""

    matches: list[str] = []
    for rule_name, pattern in SAFETY_RULES:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            prefix = text[max(0, match.start() - 36) : match.start()]
            prefix = re.split(
                r"\b(?:but|however|yet)\b|但|不过|然而",
                prefix,
                flags=re.IGNORECASE,
            )[-1]
            negated = re.search(
                r"(?:\bno\b|\bnot\b|\bwithout\b|\bden(?:y|ies|ied)\b|"
                r"没有|无|并未)[^.!?。！？,，;；]{0,30}$",
                prefix,
                flags=re.IGNORECASE,
            )
            if not negated:
                matches.append(rule_name)
                break
    return matches


def _normalise_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def find_intent_rule(text: str) -> dict[str, str] | None:
    """Return the first transparent action-intent rule matched by precedence."""

    normalised = _normalise_text(text)
    for rule in INTENT_RULES:
        if any(
            re.search(pattern, normalised, flags=re.IGNORECASE)
            for pattern in rule["patterns"]
        ):
            return {
                "name": str(rule["name"]),
                "category": str(rule["category"]),
            }
    return None


class TfidfCosineBackend:
    """Small, dependency-free word/character TF-IDF fallback."""

    method_name = "tfidf_word_char_cosine_fallback"
    model_name = None

    def __init__(self, texts: Iterable[str]) -> None:
        self._documents = [self._feature_counts(text) for text in texts]
        document_frequency: Counter[str] = Counter()
        for document in self._documents:
            document_frequency.update(document.keys())
        count = len(self._documents)
        self.idf = {
            feature: math.log((1 + count) / (1 + frequency)) + 1
            for feature, frequency in document_frequency.items()
        }
        self.vectors = [self._vectorise_counts(document) for document in self._documents]

    @staticmethod
    def _feature_counts(text: str) -> Counter[str]:
        normalised = _normalise_text(text)
        words = re.findall(r"[a-z0-9']+|[\u4e00-\u9fff]", normalised)
        features: Counter[str] = Counter()
        for word in words:
            features[f"w:{word}"] += 2.0
        for left, right in zip(words, words[1:]):
            features[f"b:{left}_{right}"] += 2.5
        padded = f" {normalised} "
        for size in (2, 3, 4, 5):
            for index in range(max(0, len(padded) - size + 1)):
                features[f"c{size}:{padded[index:index + size]}"] += 0.35
        return features

    def _vectorise_counts(self, counts: Counter[str]) -> dict[str, float]:
        weighted = {
            feature: (1 + math.log(value)) * self.idf[feature]
            for feature, value in counts.items()
            if feature in self.idf and value > 0
        }
        norm = math.sqrt(sum(value * value for value in weighted.values()))
        if not norm:
            return {}
        return {feature: value / norm for feature, value in weighted.items()}

    def encode_query(self, text: str) -> dict[str, float]:
        return self._vectorise_counts(self._feature_counts(text))

    def similarities(self, text: str) -> list[float]:
        query = self.encode_query(text)
        return [
            sum(query.get(feature, 0.0) * value for feature, value in vector.items())
            for vector in self.vectors
        ]

    def serialisable_vectors(self) -> list[dict[str, float]]:
        return self.vectors


class SentenceTransformerBackend:
    """Preferred semantic embedding backend."""

    method_name = "sentence_transformer_cosine"

    def __init__(self, texts: Iterable[str], model_name: str = MODEL_NAME) -> None:
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.vectors = np.asarray(
            self.model.encode(
                list(texts),
                normalize_embeddings=True,
                show_progress_bar=False,
            ),
            dtype=float,
        )

    def similarities(self, text: str) -> list[float]:
        query = np.asarray(
            self.model.encode(
                [text],
                normalize_embeddings=True,
                show_progress_bar=False,
            )[0],
            dtype=float,
        )
        return (self.vectors @ query).tolist()

    def serialisable_vectors(self) -> list[list[float]]:
        return self.vectors.tolist()


class DecisionEngine:
    """Safety-gated retrieval with explicit user intent and visible evidence."""

    def __init__(
        self,
        data_path: Path | str = DEFAULT_DATA_PATH,
        method: str = "auto",
        model_name: str = MODEL_NAME,
    ) -> None:
        self.scenarios = load_scenarios(data_path)
        self.fallback_reason: str | None = None
        texts = [scenario.scenario_text for scenario in self.scenarios]
        if method not in {"auto", "sentence-transformers", "tfidf"}:
            raise ValueError(f"Unknown method: {method}")
        if method in {"auto", "sentence-transformers"}:
            try:
                self.backend: SentenceTransformerBackend | TfidfCosineBackend = (
                    SentenceTransformerBackend(texts, model_name)
                )
            except Exception as error:
                if method == "sentence-transformers":
                    raise
                self.fallback_reason = f"{type(error).__name__}: {error}"
                self.backend = TfidfCosineBackend(texts)
        else:
            self.backend = TfidfCosineBackend(texts)

    def _method_metadata(self) -> dict[str, Any]:
        return {
            "name": self.backend.method_name,
            "model": self.backend.model_name,
            "fallback_reason": self.fallback_reason,
        }

    def embedding_decide(self, text: str, top_k: int = 3) -> dict[str, Any]:
        """Return the raw retrieval decision without safety or intent rules."""

        original_input = text.strip()
        if not original_input:
            raise ValueError("Input text must not be empty")

        scores = self.backend.similarities(original_input)
        ranked_all = sorted(
            range(len(scores)),
            key=lambda index: scores[index],
            reverse=True,
        )
        result_count = max(1, min(top_k, len(scores)))
        ranked_indices = ranked_all[:result_count]
        non_safety_indices = [
            index
            for index in ranked_all
            if self.scenarios[index].category != "safety_stop"
        ][:result_count]

        def summarise(
            indices: list[int],
        ) -> tuple[str, list[dict[str, Any]], Scenario]:
            category_scores: defaultdict[str, float] = defaultdict(float)
            matches: list[dict[str, Any]] = []
            for rank, index in enumerate(indices, start=1):
                scenario = self.scenarios[index]
                similarity = float(scores[index])
                category_scores[scenario.category] += (
                    max(0.0, similarity) / rank
                )
                matches.append(
                    {
                        "rank": rank,
                        "scenario_id": scenario.scenario_id,
                        "scenario_text": scenario.scenario_text,
                        "category": scenario.category,
                        "similarity": round(similarity, 4),
                        "rationale": scenario.rationale,
                        "data_source": scenario.data_source,
                        "review_status": scenario.review_status,
                    }
                )
            category = max(
                category_scores,
                key=lambda candidate: (
                    category_scores[candidate],
                    next(
                        scores[index]
                        for index in indices
                        if self.scenarios[index].category == candidate
                    ),
                ),
            )
            selected_match = next(
                match for match in matches if match["category"] == category
            )
            selected_scenario = next(
                scenario
                for scenario in self.scenarios
                if scenario.scenario_id == selected_match["scenario_id"]
            )
            return category, matches, selected_scenario

        selected_category, top_matches, selected_scenario = summarise(
            ranked_indices
        )
        best_non_safety, top_non_safety_matches, _ = summarise(
            non_safety_indices
        )
        top1_similarity = top_matches[0]["similarity"]
        top2_similarity = (
            top_matches[1]["similarity"] if len(top_matches) > 1 else None
        )
        similarity_margin = (
            round(top1_similarity - top2_similarity, 4)
            if top2_similarity is not None
            else None
        )
        thresholds = CONFIRMATION_THRESHOLDS[self.backend.method_name]
        confirmation_reasons: list[str] = []
        if top1_similarity < thresholds["minimum_top1_similarity"]:
            confirmation_reasons.append("top1_similarity_below_frozen_threshold")
        if (
            similarity_margin is None
            or similarity_margin < thresholds["minimum_similarity_margin"]
        ):
            confirmation_reasons.append("similarity_margin_below_frozen_threshold")

        return {
            "original_input": original_input,
            "method": self._method_metadata(),
            "top_matches": top_matches,
            "top_non_safety_matches": top_non_safety_matches,
            "decision_layer": "embedding_retrieval",
            "matched_intent_rule": None,
            "safety_rule_triggered": False,
            "matched_safety_rule": None,
            "explicit_intent": None,
            "embedding_prediction_raw": selected_category,
            "best_non_safety_prediction": best_non_safety,
            "embedding_prediction": selected_category,
            "final_prediction": selected_category,
            "override_reason": None,
            "top1_similarity": top1_similarity,
            "top2_similarity": top2_similarity,
            "similarity_margin": similarity_margin,
            "requires_confirmation": bool(confirmation_reasons),
            "confirmation_reasons": confirmation_reasons,
            "confirmation_thresholds": thresholds,
            "selected_category": selected_category,
            "similarity_score": next(
                match["similarity"]
                for match in top_matches
                if match["category"] == selected_category
            ),
            "rationale": selected_scenario.rationale,
            "suggested_action": selected_scenario.suggested_action,
            "explanation": (
                "The selected category is the highest weighted category among "
                "the top retrieved synthetic reference scenarios. Similarity "
                "shows textual closeness, not confidence that the action is correct."
            ),
            "safety_override": {
                "active": False,
                "type": "rule_based_override",
                "matched_rules": [],
            },
            "limitations": LIMITATIONS,
        }

    def decide(self, text: str, top_k: int = 3) -> dict[str, Any]:
        """Return a transparent JSON-ready hybrid decision-support result."""

        original_input = text.strip()
        if not original_input:
            raise ValueError("Input text must not be empty")

        matched_safety_rules = find_safety_rules(original_input)
        if matched_safety_rules:
            return {
                "original_input": original_input,
                "method": {
                    "name": "rule_based_safety_override",
                    "model": None,
                    "fallback_reason": None,
                },
                "top_matches": [],
                "top_non_safety_matches": [],
                "decision_layer": "safety_override",
                "matched_intent_rule": None,
                "safety_rule_triggered": True,
                "matched_safety_rule": matched_safety_rules[0],
                "explicit_intent": None,
                "embedding_prediction_raw": None,
                "best_non_safety_prediction": None,
                "embedding_prediction": None,
                "final_prediction": "safety_stop",
                "override_reason": (
                    "A predefined safety phrase matched before explicit-intent "
                    "rules and embedding retrieval."
                ),
                "top1_similarity": None,
                "top2_similarity": None,
                "similarity_margin": None,
                "requires_confirmation": False,
                "confirmation_reasons": [],
                "confirmation_thresholds": None,
                "selected_category": "safety_stop",
                "similarity_score": None,
                "rationale": (
                    "One or more predefined safety phrases matched before "
                    "similarity retrieval. This is a rule-based override, not "
                    "a model judgement or diagnosis."
                ),
                "suggested_action": SAFETY_MESSAGE,
                "explanation": (
                    "The safety rule takes precedence, so the embedding model "
                    "is not consulted and no lighter exercise is suggested."
                ),
                "safety_override": {
                    "active": True,
                    "type": "rule_based_override",
                    "matched_rules": matched_safety_rules,
                },
                "limitations": LIMITATIONS,
            }

        embedding_result = self.embedding_decide(original_input, top_k=top_k)
        intent_rule = find_intent_rule(original_input)
        raw_prediction = embedding_result["embedding_prediction_raw"]
        raw_safety_without_rule = raw_prediction == "safety_stop"

        if intent_rule:
            final_prediction = intent_rule["category"]
            changed = final_prediction != raw_prediction
            response = CATEGORY_RESPONSES[final_prediction]
            return {
                **embedding_result,
                "decision_layer": (
                    "explicit_intent_with_safety_gate"
                    if raw_safety_without_rule
                    else (
                        "explicit_intent_override"
                        if changed
                        else "explicit_intent_confirmation"
                    )
                ),
                "matched_intent_rule": intent_rule["name"],
                "explicit_intent": intent_rule,
                "final_prediction": final_prediction,
                "override_reason": (
                    "Retrieval suggested a safety category, but no explicit "
                    "safety signal was detected."
                    if raw_safety_without_rule
                    else (
                        f"Explicit action intent takes precedence over the raw "
                        f"{raw_prediction} retrieval prediction."
                        if changed
                        else "Explicit action intent confirms the retrieval prediction."
                    )
                ),
                "requires_confirmation": raw_safety_without_rule,
                "confirmation_reasons": (
                    ["retrieval_safety_without_explicit_signal"]
                    if raw_safety_without_rule
                    else []
                ),
                "selected_category": final_prediction,
                "rationale": response["rationale"],
                "suggested_action": response["suggested_action"],
                "explanation": (
                    "Explicit user intent determines the non-safety outcome. "
                    "A raw safety retrieval can request confirmation but cannot "
                    "produce the final safety category without a safety rule."
                ),
            }

        if raw_safety_without_rule:
            final_prediction = embedding_result["best_non_safety_prediction"]
            response = CATEGORY_RESPONSES[final_prediction]
            return {
                **embedding_result,
                "decision_layer": "safety_gate_override",
                "final_prediction": final_prediction,
                "override_reason": (
                    "Retrieval suggested a safety category, but no explicit "
                    "safety signal was detected."
                ),
                "requires_confirmation": True,
                "confirmation_reasons": [
                    "retrieval_safety_without_explicit_signal"
                ],
                "selected_category": final_prediction,
                "rationale": response["rationale"],
                "suggested_action": response["suggested_action"],
                "explanation": (
                    "The safety gate prevents semantic similarity from creating "
                    "a final safety-stop decision. The best non-safety category "
                    "is provisional and requires user confirmation."
                ),
            }

        return embedding_result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the transparent exercise decision-support prototype."
    )
    parser.add_argument("--text", required=True, help="User description to match.")
    parser.add_argument(
        "--method",
        choices=("auto", "sentence-transformers", "tfidf"),
        default="auto",
        help="Retrieval backend. Auto falls back to TF-IDF if needed.",
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Reference scenario CSV.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path for saving the same JSON printed to stdout.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    engine = DecisionEngine(data_path=args.data, method=args.method)
    rendered = json.dumps(
        engine.decide(args.text),
        ensure_ascii=False,
        indent=2,
    )
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
