from __future__ import annotations

import numpy as np


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    safe_denominator = np.clip(np.abs(y_true), 1.0, None)
    return float(np.mean(np.abs((y_true - y_pred) / safe_denominator)) * 100)


def residual_std(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    residuals = y_true - y_pred
    return float(np.std(residuals))
