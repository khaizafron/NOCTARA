import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  globalWebhookDeliveryStore,
  parsePullRequestPayload,
  parseIssueCommentPayload,
  formatUntrustedGitHubInput
} from '@noctara/github';
import { globalRealtimeRoom } from '@noctara/realtime';
import { serverCore } from '../../../../lib/server-core.js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1. Read raw body BEFORE JSON parsing to preserve cryptographic signature bytes
  const rawBody = await req.text();

  // 2. Extract GitHub security and delivery headers
  const signature = req.headers.get('x-hub-signature-256');
  const event = req.headers.get('x-github-event');
  const deliveryId = req.headers.get('x-github-delivery');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // 3. Reject missing webhook secret configuration
  if (!secret) {
    console.error('[GITHUB WEBHOOK] GITHUB_WEBHOOK_SECRET is not configured on the server.');
    return NextResponse.json(
      { error: 'Server configuration error: GITHUB_WEBHOOK_SECRET is missing.' },
      { status: 500 }
    );
  }

  // 4. Reject missing or invalid HMAC-SHA256 signature
  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    console.warn('[GITHUB WEBHOOK] Unauthorized request: Missing or invalid signature.');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing x-hub-signature-256.' },
      { status: 401 }
    );
  }

  // 5. Require event and delivery identifier headers
  if (!event || !deliveryId) {
    return NextResponse.json(
      { error: 'Bad Request: Missing x-github-event or x-github-delivery header.' },
      { status: 400 }
    );
  }

  // 6. Idempotency Check: Prevent processing identical delivery attempts multiple times
  if (globalWebhookDeliveryStore.isProcessed(deliveryId)) {
    return NextResponse.json(
      {
        ok: true,
        status: 'already_processed',
        deliveryId,
        message: 'Duplicate webhook delivery acknowledged.'
      },
      { status: 200 }
    );
  }

  // 7. Parse verified JSON payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Bad Request: Payload is not valid JSON.' },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  const repoName = payload.repository?.full_name || 'unknown';
  const senderLogin = payload.sender?.login || 'unknown';
  const installationId = payload.installation?.id;

  // Validate configured installation ID consistency if GITHUB_INSTALLATION_ID is set
  if (process.env.GITHUB_INSTALLATION_ID && installationId) {
    if (String(process.env.GITHUB_INSTALLATION_ID) !== String(installationId)) {
      console.warn(
        `[GITHUB WEBHOOK] Installation ID mismatch: received ${installationId}, expected ${process.env.GITHUB_INSTALLATION_ID}`
      );
    }
  }

  // Broadcast webhook received event to Realtime Room (HUD)
  await globalRealtimeRoom.broadcast({
    id: `evt_gh_${Date.now()}`,
    type: 'github.webhook.received',
    timestamp,
    actor: 'SYSTEM',
    payload: {
      deliveryId,
      event,
      action: payload.action,
      repository: repoName,
      sender: senderLogin,
      installationId
    }
  });

  // 8. Dispatch based on event type
  let dispatchResult: Record<string, unknown> = {};

  try {
    switch (event) {
      case 'ping': {
        dispatchResult = {
          ok: true,
          status: 'pong',
          zen: payload.zen,
          hookId: payload.hook_id
        };
        break;
      }

      case 'pull_request': {
        const pr = parsePullRequestPayload(payload);
        if (pr) {
          // Record in durable memory audit log
          await serverCore.memory.createMemory({
            scope: 'project',
            type: 'PROJECT',
            layer: 'project',
            content: `GitHub Pull Request #${pr.prNumber} (${pr.action}) in ${pr.repo} by @${pr.sender}: "${pr.title}" (branch: ${pr.headBranch} -> ${pr.baseBranch}).`,
            sourceType: 'tool',
            sourceRef: `github:pr:${pr.repo}:${pr.prNumber}:${deliveryId}`,
            confidence: 1.0,
            importance: 0.7,
            verificationStatus: 'VERIFIED'
          });

          // Broadcast PR event to Realtime Room (HUD)
          await globalRealtimeRoom.broadcast({
            id: `evt_pr_${Date.now()}`,
            type: 'github.pull_request.received',
            timestamp,
            actor: 'SYSTEM',
            payload: pr
          });

          dispatchResult = {
            ok: true,
            event: 'pull_request',
            action: pr.action,
            prNumber: pr.prNumber,
            repo: pr.repo
          };
        }
        break;
      }

      case 'issue_comment': {
        const comment = parseIssueCommentPayload(payload);
        if (comment && comment.action === 'created') {
          // Broadcast comment event to Realtime Room (HUD)
          await globalRealtimeRoom.broadcast({
            id: `evt_comment_${Date.now()}`,
            type: 'github.issue_comment.received',
            timestamp,
            actor: 'SYSTEM',
            payload: comment
          });

          // Route to agent ONLY if addressed to @nox or @aria
          if (comment.targetAgent !== 'NONE') {
            const formattedPrompt = formatUntrustedGitHubInput(
              comment.sender,
              comment.repo,
              comment.commentBody
            );

            // Execute in background so webhook returns fast and remains non-blocking
            (async () => {
              try {
                if (comment.targetAgent === 'NOX') {
                  await serverCore.nox.processMessage(formattedPrompt);
                } else if (comment.targetAgent === 'ARIA') {
                  await serverCore.aria.processMessage(formattedPrompt);
                } else if (comment.targetAgent === 'BOTH') {
                  await serverCore.orchestrator.executeConversation(formattedPrompt);
                }
              } catch (err) {
                console.error('[GITHUB WEBHOOK] Error routing comment to agent:', err);
              }
            })();
          }

          dispatchResult = {
            ok: true,
            event: 'issue_comment',
            issueNumber: comment.issueNumber,
            targetAgent: comment.targetAgent
          };
        } else {
          dispatchResult = { ok: true, event: 'issue_comment', action: payload.action, status: 'ignored' };
        }
        break;
      }

      case 'installation': {
        await globalRealtimeRoom.broadcast({
          id: `evt_inst_${Date.now()}`,
          type: 'github.installation.updated',
          timestamp,
          actor: 'SYSTEM',
          payload: {
            action: payload.action,
            installationId: payload.installation?.id,
            account: payload.installation?.account?.login
          }
        });

        dispatchResult = {
          ok: true,
          event: 'installation',
          action: payload.action,
          installationId: payload.installation?.id
        };
        break;
      }

      default: {
        // Unknown or unhandled events: safely acknowledge without triggering side effects
        dispatchResult = {
          ok: true,
          status: 'acknowledged',
          event,
          action: payload.action
        };
        break;
      }
    }

    // Record delivery for idempotency
    globalWebhookDeliveryStore.record({
      deliveryId,
      eventType: event,
      action: payload.action,
      repository: repoName,
      sender: senderLogin,
      installationId,
      status: 'PROCESSED',
      receivedAt: timestamp
    });

    return NextResponse.json(dispatchResult, { status: 200 });
  } catch (error: any) {
    console.error('[GITHUB WEBHOOK ERROR]', error);
    globalWebhookDeliveryStore.record({
      deliveryId,
      eventType: event,
      status: 'ERROR',
      error: error.message,
      receivedAt: timestamp
    });
    return NextResponse.json({ error: 'Internal Webhook Processing Error', message: error.message }, { status: 500 });
  }
}
