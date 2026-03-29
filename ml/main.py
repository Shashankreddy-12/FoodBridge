from fastapi import FastAPI
from pydantic import BaseModel

from matching import match_donations
from predictor import predict_demand
from nlp_safety import analyze_safety
from routing import optimize_route

app = FastAPI(title="FoodBridge ML Service")

class EmptyPayload(BaseModel):
    pass

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/match")
def match_endpoint(data: dict):
    return {"result": "stub", "action": "match_donations"}

@app.post("/predict")
def predict_endpoint(data: dict):
    return {"result": "stub", "action": "predict_demand"}

@app.post("/safety-score")
def safety_endpoint(data: dict):
    return {"result": "stub", "action": "analyze_safety"}

@app.post("/route")
def route_endpoint(data: dict):
    return {"result": "stub", "action": "optimize_route"}
