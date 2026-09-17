from datetime import datetime, timezone

import joblib
import numpy as np
import sklearn
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from pipeline_def import PerformanceFeatureTransformer


# horsepower, 0-60 seconds, price
training_data = np.array([
    [275, 5.4, 35000],
    [300, 5.0, 42000],
    [335, 4.8, 48000],
    [400, 4.3, 55000],
    [450, 4.0, 65000],
    [480, 3.8, 72000],
    [500, 3.6, 80000],
    [550, 3.4, 95000],
    [600, 3.2, 110000],
    [650, 3.0, 130000],
    [700, 2.9, 160000],
    [750, 2.7, 190000],
    [800, 2.5, 230000],
    [900, 2.3, 300000],
    [1000, 2.0, 450000],
], dtype=float)


pipeline = Pipeline([
    ("performance_features", PerformanceFeatureTransformer()),
    ("scaler", StandardScaler()),
])

pipeline.fit(training_data)

# Learned reference center after the fitted pipeline transforms the training data.
matrix = pipeline.transform(training_data)
center = matrix.mean(axis=0)

bundle = {
    "pipeline": pipeline,
    "matrix": matrix,
    "center": center,
    "metadata": {
        "steps": [name for name, _ in pipeline.steps],
        "built_at": datetime.now(timezone.utc).isoformat(),
        "sklearn_version": sklearn.__version__,
        "input_fields": ["horsepower", "zero_to_sixty", "price"],
    },
}

joblib.dump(bundle, "pipeline.joblib")

print("Created pipeline.joblib")
print("scikit-learn:", sklearn.__version__)
print("steps:", bundle["metadata"]["steps"])
