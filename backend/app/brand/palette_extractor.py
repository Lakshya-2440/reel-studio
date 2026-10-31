"""Palette Extractor for Reel Brand Kit Generator.

Extracts dominant 5-color palette (hex swatches) from scraped post images using
colorthief (if available) or PIL K-means clustering, with reliable fallback for
network, image, or format errors. Identifies primary, secondary, accent, surface, and text colors.
"""

from __future__ import annotations

import io
import math
import urllib.request
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field

# Check if colorthief is optionally installed
try:
    from colorthief import ColorThief
    HAS_COLORTHIEF = True
except ImportError:
    HAS_COLORTHIEF = False


# -----------------------------------------------------------------------------
# Color Models & Schemas
# -----------------------------------------------------------------------------
class PaletteColor(BaseModel):
    """Single color swatch in a brand palette."""
    name: str = Field(description="Descriptive name of the color swatch")
    hex: str = Field(description="Uppercase 6-digit hex string with # prefix")
    role: str = Field(description="Semantic brand role: primary, secondary, accent, surface, text, background")
    rgb: Optional[Tuple[int, int, int]] = Field(default=None, description="RGB tuple (0-255)")


class BrandPalette(BaseModel):
    """Complete 5-color semantic brand palette."""
    primary: str = Field(description="Primary brand color (anchor)")
    secondary: str = Field(description="Secondary supporting tone")
    accent: str = Field(description="High-contrast accent/pop color")
    surface: str = Field(description="Canvas or card background color")
    text: str = Field(description="High-contrast reading text color")
    colors: List[PaletteColor] = Field(default_factory=list, description="Ordered list of palette swatches")
    hex_list: List[str] = Field(default_factory=list, description="List of 5 hex color strings")

    def to_frontend_format(self) -> List[Dict[str, str]]:
        """Format matching frontend BrandKit.palette schema."""
        return [
            {
                "name": c.name,
                "hex": c.hex,
                "role": c.role if c.role in ("primary", "secondary", "accent", "background", "neutral") else "neutral",
            }
            for c in self.colors
        ]


# -----------------------------------------------------------------------------
# Color Math & Conversion Utilities
# -----------------------------------------------------------------------------
def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB 0-255 integers to uppercase #RRGGBB."""
    return f"#{int(r):02X}{int(g):02X}{int(b):02X}"


def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
    """Convert #RRGGBB or RRGGBB string to (r, g, b) tuple."""
    clean = hex_code.lstrip("#")
    if len(clean) == 3:
        clean = "".join(c * 2 for c in clean)
    if len(clean) != 6:
        return (30, 30, 36)
    return (int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16))


def rgb_to_hsl(r: int, g: int, b: int) -> Tuple[float, float, float]:
    """Convert RGB to HSL: h in [0, 1], s in [0, 1], l in [0, 1]."""
    rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
    cmax = max(rn, gn, bn)
    cmin = min(rn, gn, bn)
    diff = cmax - cmin
    l = (cmax + cmin) / 2.0

    if diff == 0:
        h = 0.0
        s = 0.0
    else:
        s = diff / (2.0 - cmax - cmin) if l > 0.5 else diff / (cmax + cmin)
        if cmax == rn:
            h = (gn - bn) / diff + (6.0 if gn < bn else 0.0)
        elif cmax == gn:
            h = (bn - rn) / diff + 2.0
        else:
            h = (rn - gn) / diff + 4.0
        h /= 6.0

    return (h, s, l)


def get_relative_luminance(r: int, g: int, b: int) -> float:
    """Compute WCAG 2.1 relative luminance for contrast calculations."""
    def channel_val(c: int) -> float:
        v = c / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel_val(r) + 0.7152 * channel_val(g) + 0.0722 * channel_val(b)


def name_color(r: int, g: int, b: int) -> str:
    """Generate a tasteful editorial color name based on HSL properties."""
    h, s, l = rgb_to_hsl(r, g, b)

    if l < 0.12:
        return "Executive Charcoal" if s < 0.2 else "Obsidian Ink"
    if l > 0.90:
        return "Parchment Cream" if h < 0.18 else "Clean Canvas"
    if s < 0.15:
        if l > 0.7:
            return "Steel Vapor"
        elif l > 0.4:
            return "Slate Neutral"
        else:
            return "Dark Granite"

    # Chromatic naming by hue angle
    deg = h * 360.0
    if deg < 25 or deg >= 345:
        return "Crimson Bold" if l < 0.5 else "Coral Flame"
    elif deg < 50:
        return "YC Flame Amber" if s > 0.6 else "Warm Ochre"
    elif deg < 75:
        return "Electric Gold" if l > 0.5 else "Amber Bronze"
    elif deg < 165:
        return "Terminal Emerald" if l < 0.5 else "Mint Highlight"
    elif deg < 205:
        return "Cyan Neon" if s > 0.6 else "Cadet Teal"
    elif deg < 265:
        return "Electric Indigo" if s > 0.5 else "Steel Blue"
    elif deg < 315:
        return "Deep Violet" if l < 0.5 else "Lavender Glow"
    else:
        return "Rose Magenta"


# -----------------------------------------------------------------------------
# Default Seed & Fallback Palettes
# -----------------------------------------------------------------------------
DEFAULT_PALETTE = {
    "primary": "#1E1E24",      # Dark Executive Charcoal
    "accent": "#F26522",       # YC Flame Amber
    "surface": "#FAF9F6",      # Warm Cream Canvas
    "secondary": "#4A4E69",    # Steel Slate
    "text": "#111827",         # Deep Pitch Text
}


def get_default_brand_palette(custom_colors: Optional[Dict[str, str]] = None) -> BrandPalette:
    """Return a robust, production-grade default brand palette."""
    base = dict(DEFAULT_PALETTE)
    if custom_colors:
        for k, v in custom_colors.items():
            if v and v.startswith("#"):
                base[k] = v.upper()

    swatches = [
        PaletteColor(
            name=name_color(*hex_to_rgb(base["primary"])),
            hex=base["primary"],
            role="primary",
            rgb=hex_to_rgb(base["primary"]),
        ),
        PaletteColor(
            name=name_color(*hex_to_rgb(base["accent"])),
            hex=base["accent"],
            role="accent",
            rgb=hex_to_rgb(base["accent"]),
        ),
        PaletteColor(
            name=name_color(*hex_to_rgb(base["secondary"])),
            hex=base["secondary"],
            role="secondary",
            rgb=hex_to_rgb(base["secondary"]),
        ),
        PaletteColor(
            name=name_color(*hex_to_rgb(base["surface"])),
            hex=base["surface"],
            role="background",
            rgb=hex_to_rgb(base["surface"]),
        ),
        PaletteColor(
            name=name_color(*hex_to_rgb(base["text"])),
            hex=base["text"],
            role="neutral",
            rgb=hex_to_rgb(base["text"]),
        ),
    ]

    return BrandPalette(
        primary=base["primary"],
        secondary=base["secondary"],
        accent=base["accent"],
        surface=base["surface"],
        text=base["text"],
        colors=swatches,
        hex_list=[s.hex for s in swatches],
    )


# -----------------------------------------------------------------------------
# Clustering & Extraction Engines
# -----------------------------------------------------------------------------
def extract_kmeans_clusters(image: Image.Image, k: int = 5) -> List[Tuple[int, int, int]]:
    """Extract k dominant RGB color centroids from a PIL Image using K-means clustering."""
    img = image.convert("RGB")
    # Downsample for fast execution (< 25ms) while preserving color spectrum
    img.thumbnail((120, 120))
    pixels = np.array(img).reshape(-1, 3).astype(np.float32)

    if len(pixels) == 0:
        return [hex_to_rgb(DEFAULT_PALETTE[key]) for key in ("primary", "secondary", "accent", "surface", "text")]

    # Deterministic K-means++ initialization
    np.random.seed(42)
    n_pixels = len(pixels)
    k = min(k, n_pixels)

    centroids = [pixels[np.random.randint(n_pixels)]]
    for _ in range(1, k):
        dists = np.min([np.sum((pixels - c) ** 2, axis=1) for c in centroids], axis=0)
        sum_dists = np.sum(dists)
        if sum_dists <= 1e-6:
            centroids.append(pixels[np.random.randint(n_pixels)])
            continue
        probs = dists / sum_dists
        cumprobs = np.cumsum(probs)
        r = np.random.rand()
        idx = int(np.searchsorted(cumprobs, r))
        idx = min(idx, n_pixels - 1)
        centroids.append(pixels[idx])

    centroids = np.array(centroids, dtype=np.float32)

    # 10 iterations of Lloyd's algorithm
    for _ in range(10):
        # Shape: (N, K)
        dists = np.linalg.norm(pixels[:, None, :] - centroids[None, :, :], axis=2)
        labels = np.argmin(dists, axis=1)

        new_centroids = []
        for i in range(k):
            cluster_pixels = pixels[labels == i]
            if len(cluster_pixels) > 0:
                new_centroids.append(cluster_pixels.mean(axis=0))
            else:
                new_centroids.append(centroids[i])
        centroids = np.array(new_centroids, dtype=np.float32)

    # Count points per cluster for dominance sorting
    dists = np.linalg.norm(pixels[:, None, :] - centroids[None, :, :], axis=2)
    labels = np.argmin(dists, axis=1)
    counts = [int(np.sum(labels == i)) for i in range(k)]
    sorted_order = np.argsort(counts)[::-1]

    results: List[Tuple[int, int, int]] = []
    for idx in sorted_order:
        c = centroids[idx].astype(int)
        r = max(0, min(255, int(c[0])))
        g = max(0, min(255, int(c[1])))
        b = max(0, min(255, int(c[2])))
        results.append((r, g, b))

    return results


def classify_palette_roles(clusters: List[Tuple[int, int, int]]) -> BrandPalette:
    """Classify extracted RGB clusters into semantic roles: primary, secondary, accent, surface, text."""
    if not clusters:
        return get_default_brand_palette()

    # Fill if fewer than 5 clusters
    working_clusters = list(clusters)
    fallback_defaults = [hex_to_rgb(DEFAULT_PALETTE[k]) for k in ("primary", "secondary", "accent", "surface", "text")]
    for fb in fallback_defaults:
        if len(working_clusters) >= 5:
            break
        if fb not in working_clusters:
            working_clusters.append(fb)

    # Compute color metrics
    metrics = []
    for rgb in working_clusters:
        h, s, l = rgb_to_hsl(*rgb)
        lum = get_relative_luminance(*rgb)
        metrics.append({
            "rgb": rgb,
            "hex": rgb_to_hex(*rgb),
            "h": h,
            "s": s,
            "l": l,
            "lum": lum,
        })

    # 1. Accent: color with highest saturation (vibrant pop)
    # Prefer saturation >= 0.35, otherwise highest saturation non-extreme lightness
    sorted_by_sat = sorted(metrics, key=lambda m: m["s"], reverse=True)
    accent_candidate = sorted_by_sat[0]
    # If top saturated is too dark (< 0.15) or too washed (> 0.95), check next
    for cand in sorted_by_sat:
        if 0.20 <= cand["l"] <= 0.85:
            accent_candidate = cand
            break

    remaining = [m for m in metrics if m["hex"] != accent_candidate["hex"]]

    # 2. Surface: highest luminance or background canvas tone
    sorted_by_lum = sorted(remaining, key=lambda m: m["lum"], reverse=True)
    surface_candidate = sorted_by_lum[0]

    # 3. Text: highest contrast against surface
    remaining = [m for m in remaining if m["hex"] != surface_candidate["hex"]]
    sorted_by_contrast = sorted(
        remaining,
        key=lambda m: abs(m["lum"] - surface_candidate["lum"]),
        reverse=True,
    )
    text_candidate = sorted_by_contrast[0] if sorted_by_contrast else {
        "rgb": hex_to_rgb("#111827"),
        "hex": "#111827",
        "lum": 0.01,
    }

    # 4. Primary: most dominant remaining cluster
    remaining = [m for m in remaining if m["hex"] != text_candidate["hex"]]
    primary_candidate = remaining[0] if remaining else {
        "rgb": hex_to_rgb("#1E1E24"),
        "hex": "#1E1E24",
    }

    # 5. Secondary: next supporting tone
    secondary_candidate = remaining[1] if len(remaining) > 1 else (
        remaining[0] if remaining else {"rgb": hex_to_rgb("#4A4E69"), "hex": "#4A4E69"}
    )

    # Assemble swatches
    roles = [
        ("primary", primary_candidate),
        ("secondary", secondary_candidate),
        ("accent", accent_candidate),
        ("background", surface_candidate),
        ("neutral", text_candidate),
    ]

    swatches: List[PaletteColor] = []
    seen_hexes = set()
    for role_name, item in roles:
        hex_val = item["hex"]
        if hex_val in seen_hexes:
            # Shift slightly if duplicate
            r, g, b = item["rgb"]
            hex_val = rgb_to_hex((r + 15) % 256, (g + 15) % 256, (b + 15) % 256)
        seen_hexes.add(hex_val)

        swatches.append(
            PaletteColor(
                name=name_color(*item["rgb"]),
                hex=hex_val,
                role=role_name,
                rgb=item["rgb"],
            )
        )

    return BrandPalette(
        primary=primary_candidate["hex"],
        secondary=secondary_candidate["hex"],
        accent=accent_candidate["hex"],
        surface=surface_candidate["hex"],
        text=text_candidate["hex"],
        colors=swatches,
        hex_list=[s.hex for s in swatches],
    )


# -----------------------------------------------------------------------------
# High-Level Public API
# -----------------------------------------------------------------------------
def download_image(url: str, timeout: float = 3.0) -> Optional[Image.Image]:
    """Download an image from a URL with timeout and User-Agent headers."""
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return None
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = response.read()
            if len(data) < 100:
                return None
            img = Image.open(io.BytesIO(data))
            img.load()
            return img
    except Exception:
        return None


def extract_palette_from_images(
    image_sources: List[Union[str, bytes, Image.Image]],
    fallback_colors: Optional[Dict[str, str]] = None,
    use_colorthief: bool = False,
) -> BrandPalette:
    """Extract dominant 5-color palette from a list of images or image URLs.

    Tries provided sources in order. If colorthief is requested and available, it is attempted.
    Otherwise uses fast, reliable PIL K-means clustering.
    Falls back gracefully to fallback_colors or default brand palette on failure.
    """
    if not image_sources:
        return get_default_brand_palette(fallback_colors)

    collected_clusters: List[Tuple[int, int, int]] = []

    for src in image_sources:
        img: Optional[Image.Image] = None
        try:
            if isinstance(src, Image.Image):
                img = src
            elif isinstance(src, bytes):
                img = Image.open(io.BytesIO(src))
            elif isinstance(src, str):
                img = download_image(src, timeout=3.0)

            if img is None:
                continue

            # Optional colorthief path
            if use_colorthief and HAS_COLORTHIEF and isinstance(src, bytes):
                try:
                    ct = ColorThief(io.BytesIO(src))
                    palette = ct.get_palette(color_count=5, quality=10)
                    if palette and len(palette) >= 3:
                        collected_clusters.extend(palette)
                        break
                except Exception:
                    pass

            # PIL K-means clustering
            clusters = extract_kmeans_clusters(img, k=5)
            if clusters:
                collected_clusters.extend(clusters)
                # If we collected 5 distinct clusters from a single valid image, we can classify
                if len(collected_clusters) >= 5:
                    break
        except Exception:
            continue

    if not collected_clusters:
        return get_default_brand_palette(fallback_colors)

    return classify_palette_roles(collected_clusters[:10])
