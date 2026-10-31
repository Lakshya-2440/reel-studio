"""
Performance Feedback Loop Module for Reel (Req 6)
"""

from app.performance.router import router
from app.performance.analyzer import (
    calculate_engagement_score,
    extract_features,
    compute_feature_lifts,
    update_feature_weights,
    generate_causal_insights,
)
from app.performance.csv_parser import parse_performance_csv

__all__ = [
    "router",
    "calculate_engagement_score",
    "extract_features",
    "compute_feature_lifts",
    "update_feature_weights",
    "generate_causal_insights",
    "parse_performance_csv",
]
