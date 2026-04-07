from __future__ import annotations

import numpy as np
import pandas as pd


def baseline_predict(frame: pd.DataFrame) -> np.ndarray:
    lag_7 = frame["lag_7"].to_numpy(dtype=float)
    roll_7 = frame["rolling_avg_7"].to_numpy(dtype=float)
    lag_1 = frame["lag_1"].to_numpy(dtype=float)

    blended = (0.65 * lag_7) + (0.35 * roll_7)
    fallback = np.where(np.isnan(blended), lag_1, blended)
    fallback = np.where(np.isnan(fallback), roll_7, fallback)
    fallback = np.where(np.isnan(fallback), 0.0, fallback)

    return np.clip(fallback, a_min=0.0, a_max=None)
