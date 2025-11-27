#!/bin/bash
export PYTHONPATH=.
python -m uvicorn server_py.main:app --host 0.0.0.0 --port 5000 --reload
