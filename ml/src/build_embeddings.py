"""Build a reproducible reference-vector artifact for inspection."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from .decision_engine import DEFAULT_DATA_PATH, DecisionEngine, PROJECT_ROOT


DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "outputs" / "scenario_embeddings.json"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build reference scenario vectors.")
    parser.add_argument(
        "--method",
        choices=("auto", "sentence-transformers", "tfidf"),
        default="auto",
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    engine = DecisionEngine(data_path=args.data, method=args.method)
    source_bytes = args.data.read_bytes()
    payload = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(args.data),
        "dataset_sha256": hashlib.sha256(source_bytes).hexdigest(),
        "scenario_count": len(engine.scenarios),
        "method": {
            "name": engine.backend.method_name,
            "model": engine.backend.model_name,
            "fallback_reason": engine.fallback_reason,
        },
        "scenario_ids": [scenario.scenario_id for scenario in engine.scenarios],
        "vectors": engine.backend.serialisable_vectors(),
        "limitations": [
            "This artifact represents synthetic reference scenarios only.",
            "Vector similarity is not a calibrated probability or medical judgement.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output),
                "scenario_count": payload["scenario_count"],
                "method": payload["method"],
                "dataset_sha256": payload["dataset_sha256"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
