from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

from etl.forecasting.baseline import baseline_predict
from etl.forecasting.constants import CATEGORICAL_FEATURES, NUMERIC_FEATURES, TARGET_COLUMN
from etl.forecasting.metrics import mae, mape, residual_std


@dataclass(frozen=True)
class EvaluationResult:
    baseline_mae: float
    baseline_mape: float
    xgb_mae: float
    xgb_mape: float
    residual_std: float


def build_model_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    regressor = XGBRegressor(
        n_estimators=350,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ]
    )


def fit_model(train_frame: pd.DataFrame) -> Pipeline:
    model = build_model_pipeline()
    x_train = train_frame[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_train = train_frame[TARGET_COLUMN].to_numpy(dtype=float)
    model.fit(x_train, y_train)
    return model


def evaluate_model(model: Pipeline, eval_frame: pd.DataFrame) -> EvaluationResult:
    x_eval = eval_frame[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_true = eval_frame[TARGET_COLUMN].to_numpy(dtype=float)

    baseline_pred = baseline_predict(eval_frame)
    xgb_pred = np.clip(model.predict(x_eval), a_min=0.0, a_max=None)

    return EvaluationResult(
        baseline_mae=mae(y_true, baseline_pred),
        baseline_mape=mape(y_true, baseline_pred),
        xgb_mae=mae(y_true, xgb_pred),
        xgb_mape=mape(y_true, xgb_pred),
        residual_std=residual_std(y_true, xgb_pred),
    )
