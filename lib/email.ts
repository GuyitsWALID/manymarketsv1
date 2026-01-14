import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdminClient;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://manymarketv1.vercel.app';
// Use Resend's test sender if no custom domain - works without verification!
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = 'ManyMarkets';

export interface DailyIdea {
  id: string;
  name: string;
  industry: string;
  one_liner: string;
  target_audience: string;
  opportunity_score: number;
  demand_level: string;
  featured_date: string;
}

interface EmailUser {
  id: string;
  email: string;
  subscription_tier: string;
}

/**
 * Generate unsubscribe token (simple signed token)
 */
function generateUnsubscribeToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret';
  // Simple hash - in production use proper JWT
  const hash = Buffer.from(`${payload}:${secret}`).toString('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${hash}`;
}

/**
 * Verify unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): { valid: boolean; userId?: string } {
  try {
    const [payloadB64, hash] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const [userId] = payload.split(':');
    
    const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret';
    const expectedHash = Buffer.from(`${payload}:${secret}`).toString('base64url');
    
    if (hash === expectedHash) {
      return { valid: true, userId };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Generate email HTML for daily idea notification
 */
function generateEmailHtml(idea: DailyIdea, user: EmailUser, unsubscribeToken: string): string {
  const isPro = user.subscription_tier === 'pro';
  const ideaUrl = `${APP_URL}/daily-ideas?id=${idea.id}`;
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
  
  const ctaText = isPro ? 'Research This Idea →' : 'View Full Report →';
  const ctaUrl = isPro ? `${APP_URL}/chat?idea=${idea.id}` : ideaUrl;
  
  // Score color
  const scoreColor = idea.opportunity_score >= 7 ? '#22c55e' : idea.opportunity_score >= 5 ? '#f59e0b' : '#ef4444';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today's Niche Idea</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF8E7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8E7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 4px solid #000000; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35, #ec4899); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">🔥 Today's AI Niche Idea</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${new Date(idea.featured_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </td>
          </tr>
          
          <!-- Score Badge -->
          <tr>
            <td style="padding: 24px 24px 0; text-align: center;">
              <div style="display: inline-block; background-color: ${scoreColor}; color: white; font-size: 32px; font-weight: 900; padding: 12px 24px; border-radius: 12px; border: 3px solid #000;">
                ${idea.opportunity_score}/10
              </div>
              <p style="margin: 8px 0 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Opportunity Score</p>
            </td>
          </tr>
          
          <!-- Idea Details -->
          <tr>
            <td style="padding: 24px;">
              <div style="background-color: #f8f9fa; border: 2px solid #000; border-radius: 12px; padding: 20px;">
                <span style="display: inline-block; background-color: #FF6B35; color: white; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">${idea.industry}</span>
                <h2 style="margin: 0 0 12px; color: #000; font-size: 22px; font-weight: 900;">${idea.name}</h2>
                <p style="margin: 0 0 16px; color: #333; font-size: 16px; line-height: 1.5;">${idea.one_liner}</p>
                
                <div style="border-top: 2px dashed #ddd; padding-top: 16px; margin-top: 16px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong style="color: #000;">Target Audience:</strong> ${idea.target_audience}
                  </p>
                  <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
                    <strong style="color: #000;">Demand:</strong> 
                    <span style="color: ${idea.demand_level === 'high' ? '#22c55e' : idea.demand_level === 'medium' ? '#f59e0b' : '#ef4444'}; text-transform: capitalize;">${idea.demand_level}</span>
                  </p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 24px 24px; text-align: center;">
              <a href="${ctaUrl}" style="display: inline-block; background-color: #FF6B35; color: white; font-size: 16px; font-weight: 700; padding: 16px 32px; border-radius: 8px; border: 3px solid #000; text-decoration: none; box-shadow: 4px 4px 0 #000;">
                ${ctaText}
              </a>
              ${!isPro ? `
              <p style="margin: 16px 0 0; color: #666; font-size: 13px;">
                <a href="${APP_URL}/upgrade" style="color: #FF6B35; text-decoration: underline;">Upgrade to Pro</a> to unlock full research & product builder
              </p>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; border-top: 2px solid #000; padding: 20px 24px; text-align: center;">
              <p style="margin: 0 0 8px; color: #666; font-size: 13px;">
                You're receiving this because you signed up for ManyMarkets.
              </p>
              <a href="${unsubscribeUrl}" style="color: #999; font-size: 12px; text-decoration: underline;">Unsubscribe from daily ideas</a>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send daily idea email to a single user
 */
export async function sendDailyIdeaEmail(
  idea: DailyIdea,
  user: EmailUser
): Promise<{ success: boolean; error?: string; messageId?: string; response?: any }> {
  try {
    const unsubscribeToken = generateUnsubscribeToken(user.id);
    const html = generateEmailHtml(idea, user, unsubscribeToken);

    // Send email and capture full response for debugging
    const response = await getResend().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: `🔥 Today's Niche: ${idea.name} (${idea.opportunity_score}/10)`,
      html,
    });

    // Log response for observability
    console.log('Resend response for', user.email, response);

    // The Resend SDK typically returns an object containing an id on success
    const messageId = (response && (response as any).id) || undefined;

    return { success: true, messageId, response };
  } catch (err: any) {
    console.error('Error sending daily idea email to', user.email, err?.message || err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Process a batch of emails from the queue
 * Returns number of emails processed
 */
export async function processBatchEmails(batchSize: number = 100): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
}> {
  // Get pending emails from queue
  const { data: queueItems, error: queueError } = await getSupabaseAdmin()
    .from('daily_idea_email_queue')
    .select(`
      id,
      user_id,
      idea_id,
      daily_niche_ideas!inner (
        id,
        name,
        industry,
        one_liner,
        target_audience,
        opportunity_score,
        demand_level,
        featured_date
      )
    `)
    .eq('status', 'pending')
    .limit(batchSize);
  
  if (queueError || !queueItems) {
    console.error('Failed to fetch queue:', queueError);
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0 };
  }
  
  if (queueItems.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0 };
  }
  
  // Get user emails
  const userIds = queueItems.map(q => q.user_id);
  const { data: profiles } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, email, subscription_tier')
    .in('id', userIds);
  
  const userMap = new Map(profiles?.map(p => [p.id, p]) || []);
  
  let succeeded = 0;
  let failed = 0;
  
  // Process each email
  for (const item of queueItems) {
    const user = userMap.get(item.user_id);
    if (!user || !user.email) {
      // Mark as failed - no email
      await getSupabaseAdmin()
        .from('daily_idea_email_queue')
        .update({ status: 'failed', error: 'No email found' })
        .eq('id', item.id);
      failed++;
      continue;
    }
    
    const idea = item.daily_niche_ideas as unknown as DailyIdea;
    const result = await sendDailyIdeaEmail(idea, user);
    
    if (result.success) {
      // Update queue entry with sent status and provider message id if available
      const updatePayload: any = { status: 'sent', sent_at: new Date().toISOString() };
      if ((result as any).messageId) updatePayload.provider_message_id = (result as any).messageId;
      if ((result as any).response) updatePayload.provider_response = JSON.stringify((result as any).response);

      await getSupabaseAdmin()
        .from('daily_idea_email_queue')
        .update(updatePayload)
        .eq('id', item.id);
      succeeded++;
    } else {
      // Store the error returned by the send operation for debugging
      await getSupabaseAdmin()
        .from('daily_idea_email_queue')
        .update({ status: 'failed', error: result.error })
        .eq('id', item.id);
      failed++;
    }
  }
  
  // Get remaining count
  const { count: remaining } = await getSupabaseAdmin()
    .from('daily_idea_email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  return {
    processed: queueItems.length,
    succeeded,
    failed,
    remaining: remaining || 0,
  };
}

/**
 * Queue emails for all subscribed users for a new idea
 */
export async function queueEmailsForIdea(ideaId: string): Promise<{ queued: number }> {
  // Get all users who haven't unsubscribed and have an email
  const { data: users, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('email_unsubscribed', false)
    .not('email', 'is', null);
  
  if (error || !users) {
    console.error('Failed to fetch users:', error);
    return { queued: 0 };
  }
  
  if (users.length === 0) {
    return { queued: 0 };
  }
  
  // Insert queue entries in batches of 1000
  const batchSize = 1000;
  let queued = 0;
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize).map(u => ({
      user_id: u.id,
      idea_id: ideaId,
      status: 'pending',
    }));
    
    const { error: insertError } = await getSupabaseAdmin()
      .from('daily_idea_email_queue')
      .insert(batch)
      .select();
    
    if (!insertError) {
      queued += batch.length;
    } else {
      console.error('Failed to queue batch:', insertError);
    }
  }
  
  return { queued };
}

/**
 * Unsubscribe a user from daily emails
 */
export async function unsubscribeUser(userId: string): Promise<{ success: boolean }> {
  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({ email_unsubscribed: true })
    .eq('id', userId);
  
  return { success: !error };
}
