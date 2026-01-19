-- ReplySequence Database Schema
-- Sprint 1 Week 1: Meetings and Transcripts tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zoom_meeting_id VARCHAR(255) NOT NULL,
    host_email VARCHAR(255) NOT NULL,
    topic VARCHAR(500),
    start_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    participants JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    zoom_event_id VARCHAR(255),
    recording_download_url TEXT,
    transcript_download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    speaker_segments JSONB DEFAULT '[]'::jsonb,
    source VARCHAR(50) NOT NULL DEFAULT 'zoom',
    language VARCHAR(10) DEFAULT 'en',
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for meetings table
CREATE UNIQUE INDEX IF NOT EXISTS meetings_zoom_meeting_id_idx ON meetings(zoom_meeting_id);
CREATE INDEX IF NOT EXISTS meetings_host_email_idx ON meetings(host_email);
CREATE INDEX IF NOT EXISTS meetings_status_idx ON meetings(status);
CREATE INDEX IF NOT EXISTS meetings_created_at_idx ON meetings(created_at);

-- Indexes for transcripts table
CREATE INDEX IF NOT EXISTS transcripts_meeting_id_idx ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS transcripts_source_idx ON transcripts(source);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transcripts_updated_at ON transcripts;
CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE meetings IS 'Stores Zoom meeting metadata';
COMMENT ON TABLE transcripts IS 'Stores parsed transcripts with speaker segments';
COMMENT ON COLUMN meetings.participants IS 'JSONB array of participant objects with user_id, user_name, email';
COMMENT ON COLUMN transcripts.speaker_segments IS 'JSONB array of segments with speaker, start_time, end_time, text';
