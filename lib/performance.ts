/**
 * Performance instrumentation for ReplySequence pipeline.
 * Tracks timing across all stages from webhook to draft generation.
 */

export interface PipelineStage {
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface PipelineMetrics {
  pipelineId: string;
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  stages: PipelineStage[];
}

// Store active pipelines by ID
const activePipelines: Map<string, PipelineMetrics> = new Map();

/**
 * Start tracking a new pipeline execution
 */
export function startPipeline(pipelineId: string): PipelineMetrics {
  const metrics: PipelineMetrics = {
    pipelineId,
    startTime: Date.now(),
    stages: [],
  };
  activePipelines.set(pipelineId, metrics);

  logPerformance('PIPELINE_START', {
    pipelineId,
    timestamp: new Date().toISOString(),
  });

  return metrics;
}

/**
 * Start a new stage within a pipeline
 */
export function startStage(
  pipelineId: string,
  stageName: string,
  metadata?: Record<string, unknown>
): void {
  const pipeline = activePipelines.get(pipelineId);
  if (!pipeline) {
    console.warn(`Pipeline ${pipelineId} not found for stage ${stageName}`);
    return;
  }

  const stage: PipelineStage = {
    name: stageName,
    startTime: Date.now(),
    metadata,
  };
  pipeline.stages.push(stage);

  const elapsedSincePipelineStart = Date.now() - pipeline.startTime;

  logPerformance('STAGE_START', {
    pipelineId,
    stage: stageName,
    elapsedSincePipelineStartMs: elapsedSincePipelineStart,
    ...metadata,
  });
}

/**
 * End a stage and record its duration
 */
export function endStage(
  pipelineId: string,
  stageName: string,
  metadata?: Record<string, unknown>
): number {
  const pipeline = activePipelines.get(pipelineId);
  if (!pipeline) {
    console.warn(`Pipeline ${pipelineId} not found for ending stage ${stageName}`);
    return 0;
  }

  const stage = pipeline.stages.find(s => s.name === stageName && !s.endTime);
  if (!stage) {
    console.warn(`Stage ${stageName} not found or already ended in pipeline ${pipelineId}`);
    return 0;
  }

  stage.endTime = Date.now();
  stage.durationMs = stage.endTime - stage.startTime;
  if (metadata) {
    stage.metadata = { ...stage.metadata, ...metadata };
  }

  const elapsedSincePipelineStart = Date.now() - pipeline.startTime;

  logPerformance('STAGE_END', {
    pipelineId,
    stage: stageName,
    stageDurationMs: stage.durationMs,
    elapsedSincePipelineStartMs: elapsedSincePipelineStart,
    ...metadata,
  });

  return stage.durationMs;
}

/**
 * End the pipeline and generate final metrics
 */
export function endPipeline(
  pipelineId: string,
  metadata?: Record<string, unknown>
): PipelineMetrics | null {
  const pipeline = activePipelines.get(pipelineId);
  if (!pipeline) {
    console.warn(`Pipeline ${pipelineId} not found`);
    return null;
  }

  pipeline.endTime = Date.now();
  pipeline.totalDurationMs = pipeline.endTime - pipeline.startTime;

  // Generate stage breakdown
  const stageBreakdown = pipeline.stages.map(s => ({
    stage: s.name,
    durationMs: s.durationMs || 0,
    percentOfTotal: s.durationMs
      ? Math.round((s.durationMs / pipeline.totalDurationMs!) * 100)
      : 0,
  }));

  logPerformance('PIPELINE_END', {
    pipelineId,
    totalDurationMs: pipeline.totalDurationMs,
    stageCount: pipeline.stages.length,
    stageBreakdown,
    targetMet: pipeline.totalDurationMs < 120000, // <2 min target
    ...metadata,
  });

  // Clean up
  activePipelines.delete(pipelineId);

  return pipeline;
}

/**
 * Log performance metrics in a structured format
 */
function logPerformance(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'info',
    category: 'PERFORMANCE',
    event,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

/**
 * Stage names for consistent tracking
 */
export const STAGES = {
  WEBHOOK_RECEIVED: 'webhook_received',
  LOCK_ACQUIRED: 'lock_acquired',
  EVENT_STORED: 'event_stored',
  MEETING_FETCHED: 'meeting_fetched',
  MEETING_CREATED: 'meeting_created',
  TRANSCRIPT_DOWNLOAD: 'transcript_download',
  TRANSCRIPT_PARSE: 'transcript_parse',
  TRANSCRIPT_STORED: 'transcript_stored',
  DRAFT_GENERATION: 'draft_generation',
  DRAFT_STORED: 'draft_stored',
} as const;

/**
 * Quick timing helper for inline measurements
 */
export function measureAsync<T>(
  pipelineId: string,
  stageName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  startStage(pipelineId, stageName, metadata);
  return fn()
    .then(result => {
      endStage(pipelineId, stageName, { success: true });
      return result;
    })
    .catch(error => {
      endStage(pipelineId, stageName, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    });
}

/**
 * Synchronous measurement helper
 */
export function measureSync<T>(
  pipelineId: string,
  stageName: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  startStage(pipelineId, stageName, metadata);
  try {
    const result = fn();
    endStage(pipelineId, stageName, { success: true });
    return result;
  } catch (error) {
    endStage(pipelineId, stageName, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
