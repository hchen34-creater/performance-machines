import modal

app = modal.App("performance-machine-api")

image = (
    modal.Image.debian_slim()
    .pip_install(
        "fastapi",
        "numpy",
        "joblib",
        "pydantic",
        "scikit-learn==1.9.1",
    )
    .add_local_file("serve.py", remote_path="/root/serve.py")
    .add_local_file("pipeline_def.py", remote_path="/root/pipeline_def.py")
    .add_local_file("pipeline.joblib", remote_path="/root/pipeline.joblib")
)


@app.function(image=image)
@modal.asgi_app()
def web():
    import sys

    sys.path.insert(0, "/root")

    from serve import app as fastapi_app

    return fastapi_app