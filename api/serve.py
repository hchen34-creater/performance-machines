from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Required so joblib can reconstruct the custom transformer.
from pipeline_def import PerformanceFeatureTransformer


ARTIFACT_PATH = Path(__file__).with_name("pipeline.joblib")

try:
    bundle = joblib.load(ARTIFACT_PATH)
except Exception as exc:
    bundle = None
    artifact_error = str(exc)
else:
    artifact_error = None


app = FastAPI(
    title="Performance Machine API",
    description="Scores how unusual a vehicle is compared with the fitted performance-car reference data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class VehicleInput(BaseModel):
    horsepower: float = Field(gt=0, le=3000)
    zero_to_sixty: float = Field(gt=0, le=20)
    price: float = Field(gt=0, le=10000000)


def require_artifact():
    if bundle is None:
        raise HTTPException(
            status_code=503,
            detail=f"Pipeline artifact unavailable: {artifact_error}",
        )


@app.get("/")
def health():
    require_artifact()

    return {
        "status": "ok",
        "service": "Performance Machine API",
    }


@app.get("/pipeline")
def pipeline_info():
    require_artifact()

    return {
        "artifact": "pipeline.joblib",
        "metadata": bundle["metadata"],
    }


@app.post("/score")
def score_vehicle(vehicle: VehicleInput):
    require_artifact()

    values = np.array(
        [[vehicle.horsepower, vehicle.zero_to_sixty, vehicle.price]],
        dtype=float,
    )

    transformed = bundle["pipeline"].transform(values)

    distance = float(
        np.linalg.norm(transformed[0] - bundle["center"])
    )

    return {
        "input": vehicle.model_dump(),
        "anomaly_distance": round(distance, 3),
        "interpretation": (
            "Higher values indicate a performance profile farther "
            "from the fitted reference center."
        ),
    }
