-- Raw Events table for storing incoming webhook payloads
-- Sprint 1 Day 2: Zoom webhook raw event storage

-- Raw events table
CREATE TABLE IF NOT EXISTS raw_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    zoom_event_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    -- Extracted fields for quick access
    meeting_id VARCHAR(255),
    end_time TIMESTAMP WITH TIME ZONE,
    recording_available VARCHAR(10),
    transcript_available VARCHAR(10),
    -- Error tracking
    error_message TEXT,
    -- Timestamps
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for raw_events table
CREATE UNIQUE INDEX IF NOT EXISTS raw_events_zoom_event_id_idx ON raw_events(zoom_event_id);
CREATE INDEX IF NOT EXISTS raw_events_event_type_idx ON raw_events(event_type);
CREATE INDEX IF NOT EXISTS raw_events_status_idx ON raw_events(status);
CREATE INDEX IF NOT EXISTS raw_events_meeting_id_idx ON raw_events(meeting_id);
CREATE INDEX IF NOT EXISTS raw_events_received_at_idx ON raw_events(received_at);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_raw_events_updated_at ON raw_events;
CREATE TRIGGER update_raw_events_updated_at
    BEFORE UPDATE ON raw_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE raw_events IS 'Stores raw Zoom webhook payloads for audit trail and reprocessing';
COMMENT ON COLUMN raw_events.zoom_event_id IS 'Unique event identifier for idempotency checking';
COMMENT ON COLUMN raw_events.payload IS 'Full raw JSON payload from Zoom webhook';
COMMENT ON COLUMN raw_events.status IS 'Processing status: received, processing, processed, failed';
