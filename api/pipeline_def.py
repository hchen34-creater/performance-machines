import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin


class PerformanceFeatureTransformer(BaseEstimator, TransformerMixin):
    """Create performance-oriented features from vehicle data."""

    def __init__(self, horsepower_weight=1.0):
        self.horsepower_weight = horsepower_weight

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = np.asarray(X, dtype=float)

        horsepower = X[:, 0]
        zero_to_sixty = X[:, 1]
        price = X[:, 2]

        weighted_hp = horsepower * self.horsepower_weight
        hp_per_dollar = horsepower / np.maximum(price, 1) * 100000
        acceleration_power = horsepower / np.maximum(zero_to_sixty, 0.1)

        return np.column_stack(
            [weighted_hp, zero_to_sixty, price, hp_per_dollar, acceleration_power]
        )
