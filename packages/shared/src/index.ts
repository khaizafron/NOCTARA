// NOCTARA Shared Contracts & Core Types

export type AgentId = 'NOX' | 'ARIA';
export type ActorId = 'ROOT' | 'NOX' | 'ARIA' | 'SYSTEM';

export type AgentState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'RESEARCHING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'AWAITING_APPROVAL'
  | 'ERROR_RECOVERY'
  | 'LEARNING'
  | 'OFFLINE';

export type AutonomyClass = 'A0' | 'A1' | 'A2' | 'A3' | 'A4';

export interface PolicyCheckResult {
  allowed: boolean;
  autonomyClass: AutonomyClass;
  requiresRootApproval: boolean;
  reason?: string;
}

// 7-Layer Memory Models
export type MemoryLayer =
  | 'working'
  | 'episodic'
  | 'semantic'
  | 'identity'
  | 'pattern'
  | 'project'
  | 'tool_learning';

export type MemoryType =
  | 'FACT'
  | 'PREFERENCE'
  | 'DECISION'
  | 'PATTERN'
  | 'PROJECT'
  | 'LEARNING'
  | 'WORKING'
  | 'UNKNOWN';

export type VerificationStatus = 'VERIFIED' | 'INFERRED' | 'UNVERIFIED' | 'OUTDATED' | 'CORRECTED';

export interface MemoryRecord {
  id: string;
  scope: 'shared' | 'aria' | 'nox' | 'project' | 'root';
  layer: MemoryLayer;
  type: MemoryType;
  content: string;
  sourceType: 'conversation' | 'file' | 'tool' | 'owner_statement' | 'agent_inference';
  sourceRef?: string;
  confidence: number; // 0.0 to 1.0
  importance: number; // 0.0 to 1.0
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  lastVerifiedAt?: string;
  supersedesId?: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface MemoryRetrievalQuery {
  query: string;
  scope?: ('shared' | 'aria' | 'nox' | 'project' | 'root')[];
  layers?: MemoryLayer[];
  types?: MemoryType[];
  minConfidence?: number;
  limit?: number;
}

// Model Provider Abstraction
export type ProviderId = 'gemini' | 'tokenrouter' | 'openrouter' | 'mock';

export type ApiFormat = 'gemini-native' | 'openai-chat' | 'openai-responses' | 'mock';

export interface ModelCapability {
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  supportsAudio: boolean;
  contextWindow: number;
}

export interface ModelMetadata {
  id: string;
  provider: ProviderId;
  apiFormat: ApiFormat;
  displayName: string;
  capabilities: ModelCapability;
  costTier: 'free' | 'low' | 'standard' | 'high';
  isConfigured: boolean;
  health: 'online' | 'degraded' | 'offline' | 'unconfigured';
  lastHealthCheck?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatInput {
  modelId?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  responseSchema?: Record<string, unknown>;
}

export interface ChatChunk {
  delta: string;
  toolCalls?: ToolCall[];
  finishReason?: string;
}

export interface ChatOutput {
  content: string;
  toolCalls?: ToolCall[];
  modelId: string;
  providerId: ProviderId;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// Tool System
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  riskClass: AutonomyClass;
  requiredPermission: string;
  timeoutMs?: number;
}

export interface ToolCall {
  id: string;
  toolId: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  toolId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}

// Voice Engine
export interface VoiceProfile {
  agentId: AgentId;
  gender: 'male' | 'female';
  style: string;
  pitch: number;
  rate: number;
  providerVoiceId?: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  agentId?: AgentId;
  isInterrupted: boolean;
}

// Autonomy & Task Loop
export type TaskStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface PlanStep {
  id: string;
  order: number;
  description: string;
  actionType: string;
  toolId?: string;
  arguments?: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  autonomyClass: AutonomyClass;
  requiresRootApproval: boolean;
  output?: unknown;
  error?: string;
}

export interface TaskPlan {
  id: string;
  goal: string;
  assignedAgent: AgentId;
  steps: PlanStep[];
  currentStepIndex: number;
  status: TaskStatus;
  maxToolBudget: number;
  executedToolCount: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// Self-Improvement Specs
export interface AuditFinding {
  id: string;
  category: 'correctness' | 'security' | 'performance' | 'test' | 'tech-debt' | 'dx';
  title: string;
  description: string;
  fileReference?: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'S' | 'M' | 'L';
  confidence: number;
}

export interface ImprovementPlan {
  id: string;
  findingId: string;
  branchName: string;
  worktreePath?: string;
  summary: string;
  verificationCommands: string[];
  status: 'DRAFT' | 'EXECUTING' | 'TEST_PASSED' | 'TEST_FAILED' | 'PR_OPEN' | 'MERGED' | 'REJECTED';
  diffSummary?: string;
}

// Realtime Event Contracts
export type NoctaraEventType =
  | 'root.message.created'
  | 'root.voice.started'
  | 'root.voice.interrupted'
  | 'agent.state.changed'
  | 'agent.thinking'
  | 'agent.speaking'
  | 'agent.interrupted'
  | 'agent.tool.started'
  | 'agent.tool.completed'
  | 'agent.tool.failed'
  | 'orchestrator.turn.decided'
  | 'memory.created'
  | 'memory.recalled'
  | 'memory.corrected'
  | 'task.started'
  | 'task.progress'
  | 'task.completed'
  | 'task.failed'
  | 'task.cancelled'
  | 'approval.requested'
  | 'approval.granted'
  | 'approval.rejected'
  | 'self_improvement.started'
  | 'self_improvement.tested'
  | 'self_improvement.pr.created'
  | 'provider.status.changed'
  | 'system.telemetry.updated'
  | 'github.webhook.received'
  | 'github.pull_request.received'
  | 'github.issue_comment.received'
  | 'github.installation.updated';

export interface NoctaraEvent<T = unknown> {
  id: string;
  type: NoctaraEventType;
  timestamp: string;
  actor: ActorId;
  payload: T;
}
