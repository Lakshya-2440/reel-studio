-- Reel Database Schema
-- Target: Neon Postgres (with pgvector) & SQLite fallback

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT,
    duration_seconds FLOAT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    media_asset_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
    full_text TEXT NOT NULL,
    duration FLOAT,
    speaker_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transcript Segments
CREATE TABLE IF NOT EXISTS transcript_segments (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    speaker TEXT,
    text TEXT NOT NULL,
    embedding vector(384)
);

-- 5. Chapters
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    summary TEXT
);

-- 6. Clips
CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    duration FLOAT NOT NULL,
    hook_line TEXT,
    reasons JSONB DEFAULT '[]'::jsonb,
    score_breakdown JSONB DEFAULT '{}'::jsonb,
    overall_score FLOAT DEFAULT 0.0,
    evidence_quote TEXT,
    status TEXT DEFAULT 'suggested',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Platform Variants
CREATE TABLE IF NOT EXISTS platform_variants (
    id TEXT PRIMARY KEY,
    clip_id TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    hook TEXT,
    caption TEXT,
    hashtags TEXT[],
    cta TEXT,
    on_screen_text TEXT,
    voice_match_score FLOAT DEFAULT 0.0,
    is_edited BOOLEAN DEFAULT FALSE,
    final_text TEXT
);

-- 8. Voice Profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    summary TEXT,
    tone_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Voice Rules
CREATE TABLE IF NOT EXISTS voice_rules (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES voice_profiles(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    evidence_diff JSONB DEFAULT '{}'::jsonb,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Voice Examples
CREATE TABLE IF NOT EXISTS voice_examples (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES voice_profiles(id) ON DELETE CASCADE,
    platform TEXT,
    ai_draft TEXT,
    creator_final TEXT,
    diff_summary TEXT,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Calendar Items
CREATE TABLE IF NOT EXISTS calendar_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    clip_id TEXT REFERENCES clips(id) ON DELETE SET NULL,
    variant_id TEXT REFERENCES platform_variants(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled',
    slot_reason TEXT
);

-- 12. Performance Logs
CREATE TABLE IF NOT EXISTS performance_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    post_id TEXT,
    platform TEXT NOT NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    saves INT DEFAULT 0,
    retention_pct FLOAT DEFAULT 0.0,
    followers_gained INT DEFAULT 0,
    engagement_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Post Features
CREATE TABLE IF NOT EXISTS post_features (
    id TEXT PRIMARY KEY,
    log_id TEXT NOT NULL REFERENCES performance_logs(id) ON DELETE CASCADE,
    hook_type TEXT,
    length_bucket TEXT,
    topic TEXT,
    time_slot TEXT,
    day_of_week TEXT
);

-- 14. Feature Weights
CREATE TABLE IF NOT EXISTS feature_weights (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_value TEXT NOT NULL,
    weight FLOAT DEFAULT 1.0,
    lift_pct FLOAT DEFAULT 0.0,
    sample_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Insights
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    metric_lift TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Brand Kits
CREATE TABLE IF NOT EXISTS brand_kits (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tagline TEXT,
    palette_hex TEXT[],
    typography_notes TEXT,
    visual_style_notes TEXT,
    voice_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Scraped Posts
CREATE TABLE IF NOT EXISTS scraped_posts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    post_url TEXT,
    text TEXT,
    media_urls TEXT[],
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    posted_at TIMESTAMPTZ
);

-- 18. LLM Calls
CREATE TABLE IF NOT EXISTS llm_calls (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    provider TEXT NOT NULL,
    task TEXT NOT NULL,
    latency_ms FLOAT,
    fallback_used BOOLEAN DEFAULT FALSE,
    success BOOLEAN DEFAULT TRUE
);

-- Supporting Tables (PRD Section 8)
-- 19. Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    progress FLOAT DEFAULT 0.0,
    stage TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Voice Intakes
CREATE TABLE IF NOT EXISTS voice_intakes (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    raw_transcript TEXT NOT NULL,
    clean_text TEXT,
    intent_json JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Clip Feedback
CREATE TABLE IF NOT EXISTS clip_feedback (
    id TEXT PRIMARY KEY,
    clip_id TEXT REFERENCES clips(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & query speed
CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_project_id ON transcripts(project_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_transcript_id ON transcript_segments(transcript_id);
CREATE INDEX IF NOT EXISTS idx_chapters_transcript_id ON chapters(transcript_id);
CREATE INDEX IF NOT EXISTS idx_clips_project_id ON clips(project_id);
CREATE INDEX IF NOT EXISTS idx_platform_variants_clip_id ON platform_variants(clip_id);
CREATE INDEX IF NOT EXISTS idx_voice_rules_profile_id ON voice_rules(profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_examples_profile_id ON voice_examples(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_items_project_scheduled ON calendar_items(project_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_performance_logs_project_platform ON performance_logs(project_id, platform);
CREATE INDEX IF NOT EXISTS idx_post_features_log_id ON post_features(log_id);
CREATE INDEX IF NOT EXISTS idx_feature_weights_project ON feature_weights(project_id);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_project ON scraped_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_status ON jobs(project_id, status);
