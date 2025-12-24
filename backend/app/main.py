"""
UPISensei FastAPI Backend
Main application entry point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.config.settings import settings

app = FastAPI(
    title="UPISensei API",
    description="AI-driven financial intelligence system for UPI transaction analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "UPISensei API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

