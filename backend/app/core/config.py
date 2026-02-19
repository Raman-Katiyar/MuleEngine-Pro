"""
RIFT 2026 Hackathon - Configuration Module
Money Muling Detection Engine
"""

from enum import Enum
from typing import Optional

class Environment(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"
    TESTING = "testing"

class Settings:
    """Application Configuration"""
    
    # Application Info
    APP_NAME = "RIFT 2026 Money Muling Detection Engine"
    APP_VERSION = "1.0.0"
    APP_DESCRIPTION = "Financial Crime Detection using Graph Theory & Temporal Analysis"
    
    # Environment
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = True
    
    # API Configuration
    API_HOST = "0.0.0.0"
    API_PORT = 8000
    API_RELOAD = True
    
    # CORS Configuration
    CORS_ORIGINS = ["*"]
    CORS_CREDENTIALS = True
    CORS_METHODS = ["*"]
    CORS_HEADERS = ["*"]
    
    # Processing Configuration
    MAX_CSV_SIZE_MB = 50  # Max CSV upload size
    MAX_TRANSACTIONS = 100_000  # Max transactions to process
    PROCESSING_TIMEOUT_SECONDS = 60  # Max processing time
    
    # Analysis Configuration
    MIN_CYCLE_LENGTH = 3
    MAX_CYCLE_LENGTH = 5
    FAN_THRESHOLD = 10
    TEMPORAL_WINDOW_HOURS = 72
    
    # Model Configuration
    SUSPICION_SCORE_MIN = 0.0
    SUSPICION_SCORE_MAX = 100.0
    MERCHANT_SCORE_CAP = 35.0
    
    @classmethod
    def get_settings(cls):
        """Get current settings instance"""
        return cls()

# Singleton instance
settings = Settings()
