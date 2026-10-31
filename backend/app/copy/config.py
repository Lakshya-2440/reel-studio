from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml
from pydantic import BaseModel, Field


class PlatformConfig(BaseModel):
    name: str
    alias: str
    max_characters: int = 3000
    cut_off_at: int = 210
    min_hashtags: int = 0
    max_hashtags: int = 5
    cta_style: str = "conversational_question"
    style_guidelines: List[str] = Field(default_factory=list)
    default_hashtags: List[str] = Field(default_factory=list)
    sample_cta: str = ""
    on_screen_text: bool = False
    requires_hook_ab: bool = True
    max_title_characters: Optional[int] = None
    thread_min_posts: Optional[int] = None
    thread_max_posts: Optional[int] = None


PLATFORM_KEY_ALIASES = {
    "linkedin": "linkedin",
    "reels": "instagram_reels",
    "instagram_reels": "instagram_reels",
    "instagram": "instagram_reels",
    "shorts": "youtube_shorts",
    "youtube_shorts": "youtube_shorts",
    "youtube": "youtube_shorts",
    "x": "twitter",
    "twitter": "twitter",
    "tiktok": "tiktok",
}


def _find_platforms_yaml_path() -> Path:
    candidates = [
        Path(__file__).resolve().parent / "platforms.yaml",
        Path(__file__).resolve().parents[3] / "platforms.yaml",
        Path.cwd() / "platforms.yaml",
        Path.cwd() / "backend" / "app" / "copy" / "platforms.yaml",
    ]
    for p in candidates:
        if p.exists() and p.is_file():
            return p
    return Path(__file__).resolve().parent / "platforms.yaml"


_CACHED_CONFIGS: Optional[Dict[str, PlatformConfig]] = None


def load_platform_configs(force_reload: bool = False) -> Dict[str, PlatformConfig]:
    global _CACHED_CONFIGS
    if _CACHED_CONFIGS is not None and not force_reload:
        return _CACHED_CONFIGS

    yaml_path = _find_platforms_yaml_path()
    if not yaml_path.exists():
        # Fallback hardcoded defaults if file missing
        configs = _default_platform_configs()
        _CACHED_CONFIGS = configs
        return configs

    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    platforms_dict = data.get("platforms", {})
    configs: Dict[str, PlatformConfig] = {}
    for key, p_data in platforms_dict.items():
        configs[key] = PlatformConfig(**p_data)

    _CACHED_CONFIGS = configs
    return configs


get_all_platform_configs = load_platform_configs


def get_platform_config(platform_name: str) -> PlatformConfig:
    normalized = PLATFORM_KEY_ALIASES.get(platform_name.lower().strip(), platform_name.lower().strip())
    configs = load_platform_configs()
    if normalized in configs:
        return configs[normalized]
    # Check if alias was used as key directly
    for cfg in configs.values():
        if cfg.alias == normalized or cfg.name.lower() == platform_name.lower():
            return cfg
    # If totally unknown, return linkedin baseline
    return configs.get("linkedin", _default_platform_configs()["linkedin"])


def _default_platform_configs() -> Dict[str, PlatformConfig]:
    return {
        "linkedin": PlatformConfig(
            name="LinkedIn",
            alias="linkedin",
            max_characters=3000,
            cut_off_at=210,
            min_hashtags=0,
            max_hashtags=3,
            cta_style="conversational_question",
            style_guidelines=[
                "Lead with an insight or quantitative contrast in the first 210 characters (before 'see more' fold)",
                "Short punchy paragraphs with 1-2 sentences each",
                "Zero emoji fluff in the opening three lines",
                "Strictly 0 to 3 high-relevance hashtags at the footer",
                "End with a conversational founder debate question as CTA",
            ],
            default_hashtags=["#B2BMarketing", "#FounderLedGrowth", "#Startups"],
            sample_cta="What is the single biggest bottleneck in your current pricing model?",
            on_screen_text=False,
            requires_hook_ab=True,
        ),
        "instagram_reels": PlatformConfig(
            name="Instagram Reels",
            alias="reels",
            max_characters=2200,
            cut_off_at=125,
            min_hashtags=3,
            max_hashtags=8,
            cta_style="save_or_comment",
            style_guidelines=[
                "First line must be an irresistible caption hook",
                "Generous line breaks between thoughts for instant scanning",
                "3 to 8 targeted niche hashtags",
                "On-screen text beat recommendation for the 9:16 vertical video frame",
                "Clear save/comment call to action",
            ],
            default_hashtags=["#startuptips", "#saasgrowth", "#founders", "#podcastclips", "#buildinpublic"],
            sample_cta="Save this post for your next strategy session 📌",
            on_screen_text=True,
            requires_hook_ab=True,
        ),
        "youtube_shorts": PlatformConfig(
            name="YouTube Shorts",
            alias="shorts",
            max_title_characters=100,
            max_characters=5000,
            cut_off_at=100,
            min_hashtags=1,
            max_hashtags=5,
            cta_style="pinned_comment",
            style_guidelines=[
                "Punchy click-worthy title strictly under or equal to 100 characters including #Shorts",
                "SEO-optimized description loaded with relevant topic keywords",
                "Engaging pinned comment prompt to spark immediate community discussion",
                "On-screen title beat synchronized with video intro",
            ],
            default_hashtags=["#Shorts", "#Startups", "#FounderFiles"],
            sample_cta="Drop your reaction in the pinned comment below 👇",
            on_screen_text=True,
            requires_hook_ab=True,
        ),
        "twitter": PlatformConfig(
            name="X (Twitter)",
            alias="x",
            max_characters=280,
            cut_off_at=280,
            min_hashtags=0,
            max_hashtags=2,
            cta_style="retweet_or_debate",
            thread_min_posts=3,
            thread_max_posts=5,
            style_guidelines=[
                "Primary post strictly <= 280 characters",
                "High-conviction contrarian statement or core takeaway",
                "Blank line between every single sentence",
                "Provide a 3-5 post thread expanding the framework",
                "0 to 2 hashtags maximum",
            ],
            default_hashtags=["#buildinpublic"],
            sample_cta="Repost to share with your founder network 🔄",
            on_screen_text=False,
            requires_hook_ab=True,
        ),
        "tiktok": PlatformConfig(
            name="TikTok",
            alias="tiktok",
            max_characters=2200,
            cut_off_at=150,
            min_hashtags=3,
            max_hashtags=6,
            cta_style="follow_or_comment",
            style_guidelines=[
                "Ultra-short hook caption (1-2 lines max before fold)",
                "Trending hashtag style (generic tech/founder niches, no fake #fyp claims)",
                "Visual text beats highlighting key moments",
                "Casual, high-energy tone without corporate jargon",
            ],
            default_hashtags=["#startuptok", "#founders", "#businessadvice", "#techtok"],
            sample_cta="Follow for weekly founder breakdowns",
            on_screen_text=True,
            requires_hook_ab=True,
        ),
    }
