from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
from sklearn.pipeline import Pipeline


def save_model_artifact(path: Path, model: Pipeline, metadata: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "metadata": metadata}, path)


def load_model_artifact(path: Path) -> tuple[Pipeline, dict[str, Any]]:
    payload = joblib.load(path)
    return payload["model"], payload.get("metadata", {})
