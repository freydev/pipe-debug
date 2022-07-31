import os
import subprocess

def build(*args, **kwargs):
    subprocess.run(
        f"docker run --rm -v {os.getcwd()}/frontend:/app -v {os.getcwd()}/datapipe_app/frontend:/app/build -w /app node:18.7.0-slim yarn".split(' ')
    )

    subprocess.run(
        f"docker run --rm -v {os.getcwd()}/frontend:/app -v {os.getcwd()}/datapipe_app/frontend:/app/build -w /app node:18.7.0-slim yarn build".split(' ')
    )
