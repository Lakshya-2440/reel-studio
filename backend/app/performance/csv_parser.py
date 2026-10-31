"""
CSV Parser for Performance Feedback Loop (Req 6)
Flexible CSV parser with heuristic and alias column mapping, robust numeric coercion
(handling '12k', '1.5M', commas, percentages), and automated feature enrichment.
"""

import csv
import io
import re
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from app.performance.analyzer import extract_features, normalize_platform
from app.performance.schemas import PerformanceMetricInput

# Common header alias dictionaries (normalized: lowercased, stripped, underscores)
COLUMN_ALIASES: Dict[str, List[str]] = {
    "views": [
        "views",
        "view",
        "impressions",
        "impression",
        "reach",
        "view_count",
        "plays",
        "video_views",
        "total_views",
    ],
    "likes": [
        "likes",
        "like",
        "reactions",
        "reaction",
        "favorites",
        "upvotes",
        "reacts",
        "total_likes",
    ],
    "comments": [
        "comments",
        "comment",
        "replies",
        "reply",
        "discussion",
        "comments_count",
    ],
    "shares": [
        "shares",
        "share",
        "reposts",
        "repost",
        "retweets",
        "retweet",
        "forwards",
        "shares_count",
    ],
    "saves": [
        "saves",
        "save",
        "bookmarks",
        "bookmark",
        "saved",
        "bookmarks_count",
    ],
    "retention_pct": [
        "retention_pct",
        "retention",
        "watch_time",
        "watch_time_pct",
        "avg_watch_time",
        "completion_rate",
        "retention_rate",
        "avg_retention",
    ],
    "followers_gained": [
        "followers_gained",
        "followers",
        "new_followers",
        "follows",
        "subscriber_growth",
        "subscribers_gained",
    ],
    "platform": [
        "platform",
        "network",
        "channel",
        "source",
        "social_network",
    ],
    "content": [
        "content",
        "text",
        "caption",
        "post_text",
        "hook",
        "title",
        "headline",
        "copy",
        "body",
    ],
    "hook_type": [
        "hook_type",
        "hook_format",
        "format",
        "hook_category",
    ],
    "length_bucket": [
        "length_bucket",
        "length",
        "duration_bucket",
        "video_length",
    ],
    "time_slot": [
        "time_slot",
        "slot",
        "time",
        "post_time",
    ],
    "day_of_week": [
        "day_of_week",
        "day",
        "weekday",
    ],
    "post_id": [
        "post_id",
        "id",
        "clip_id",
        "post_url",
        "url",
    ],
    "posted_at": [
        "posted_at",
        "date",
        "timestamp",
        "created_at",
        "publish_date",
        "published_at",
    ],
}


def normalize_header(header: str) -> str:
    """Normalizes a raw CSV header name to snake_case."""
    h = header.strip().lower()
    h = re.sub(r"[^\w\s]", "", h)
    return re.sub(r"\s+", "_", h)


def parse_numeric_value(val: Any, default: float = 0.0) -> float:
    """
    Parses numeric strings with units or formatting:
      - '12k' -> 12000
      - '1.5M' -> 1500000
      - '45%' -> 45.0
      - '$50,000' -> 50000.0
    """
    if val is None or val == "":
        return default
    if isinstance(val, (int, float)):
        return float(val)

    s = str(val).strip().replace(",", "").replace("$", "")
    if not s:
        return default

    # Check for percentage
    if s.endswith("%"):
        try:
            return float(s[:-1].strip())
        except ValueError:
            return default

    # Check for multipliers
    multiplier = 1.0
    if s.lower().endswith("k"):
        multiplier = 1_000.0
        s = s[:-1]
    elif s.lower().endswith("m"):
        multiplier = 1_000_000.0
        s = s[:-1]
    elif s.lower().endswith("b"):
        multiplier = 1_000_000_000.0
        s = s[:-1]

    try:
        return float(s.strip()) * multiplier
    except ValueError:
        return default


def map_columns(headers: List[str]) -> Dict[str, str]:
    """
    Maps incoming CSV column headers to canonical schema fields.
    Returns: { canonical_field_name: raw_csv_header_name }
    """
    mapped: Dict[str, str] = {}
    normalized_headers = {normalize_header(h): h for h in headers}

    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_headers:
                mapped[canonical] = normalized_headers[alias]
                break

    return mapped


def parse_performance_csv(
    file_content: Union[str, bytes],
    default_platform: str = "linkedin",
    project_id: str = "proj_founder_files_42",
) -> Tuple[List[PerformanceMetricInput], List[str], List[str]]:
    """
    Parses a CSV string or byte payload into a list of PerformanceMetricInput objects.
    Returns:
      (parsed_records, detected_platforms, warnings)
    """
    if isinstance(file_content, bytes):
        text = file_content.decode("utf-8", errors="replace")
    else:
        text = file_content

    # Detect delimiter
    sample = text[:2048]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
        delimiter = dialect.delimiter
    except Exception:
        delimiter = ","

    f = io.StringIO(text.strip())
    reader = csv.DictReader(f, delimiter=delimiter)

    if not reader.fieldnames:
        return [], [], ["CSV appears to be empty or missing headers"]

    col_map = map_columns(reader.fieldnames)
    detected_platforms: Set[str] = set()
    records: List[PerformanceMetricInput] = []
    warnings: List[str] = []

    for row_idx, row in enumerate(reader, start=1):
        if not any(v.strip() for v in row.values() if v):
            continue  # skip empty lines

        # Extract values using mapped columns
        def get_val(canonical: str, default: Any = None) -> Any:
            col_name = col_map.get(canonical)
            if col_name and col_name in row:
                v = row[col_name]
                return v.strip() if isinstance(v, str) else v
            return default

        raw_platform = get_val("platform", default_platform)
        plt = normalize_platform(raw_platform)
        detected_platforms.add(plt)

        views = int(parse_numeric_value(get_val("views", 0)))
        likes = int(parse_numeric_value(get_val("likes", 0)))
        comments = int(parse_numeric_value(get_val("comments", 0)))
        shares = int(parse_numeric_value(get_val("shares", 0)))
        saves = int(parse_numeric_value(get_val("saves", 0)))
        followers = int(parse_numeric_value(get_val("followers_gained", 0)))
        
        raw_ret = get_val("retention_pct")
        retention = parse_numeric_value(raw_ret) if raw_ret is not None and str(raw_ret).strip() != "" else None

        content = get_val("content")
        post_id = get_val("post_id") or f"csv_row_{row_idx}"
        posted_at = get_val("posted_at")

        # Auto-extract missing features from content
        features = extract_features(
            content=content,
            platform=plt,
            posted_at=posted_at,
            explicit_tags={
                "hook_type": get_val("hook_type"),
                "length_bucket": get_val("length_bucket"),
                "time_slot": get_val("time_slot"),
                "day_of_week": get_val("day_of_week"),
            },
        )

        record = PerformanceMetricInput(
            project_id=project_id,
            post_id=post_id,
            platform=plt,
            views=views,
            likes=likes,
            comments=comments,
            shares=shares,
            saves=saves,
            retention_pct=retention,
            followers_gained=followers,
            content=content,
            hook_type=features.hook_type,
            length_bucket=features.length_bucket,
            topic=features.topic,
            time_slot=features.time_slot,
            day_of_week=features.day_of_week,
            posted_at=posted_at,
        )
        records.append(record)

    return records, sorted(list(detected_platforms)), warnings
