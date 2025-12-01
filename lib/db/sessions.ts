import { createClient } from '@/lib/supabase/client';

export interface ResearchSession {
  id: string;
  user_id: string;
  title: string;
  phase: 'discovery' | 'niche_drilling' | 'uvz_identification' | 'validation' | 'product_ideation' | 'completed';
  phase_progress: number;
  industry: string | null;
  selected_niche: string | null;
  selected_uvz: string | null;
  message_count: number;
  tool_calls_count: number;
  is_archived: boolean;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls: any | null;
  tool_results: any | null;
  tokens_used: number | null;
  model_used: string;
  created_at: string;
}

// Create a new research session
export async function createSession(userId: string, title?: string): Promise<ResearchSession | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('research_sessions')
    .insert({
      user_id: userId,
      title: title || 'New Research Session',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return data;
}

// Get a session by ID
export async function getSession(sessionId: string): Promise<ResearchSession | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('research_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
}

// Get all sessions for a user
export async function getUserSessions(userId: string): Promise<ResearchSession[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('research_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data || [];
}

// Update session
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<ResearchSession, 'title' | 'phase' | 'phase_progress' | 'industry' | 'selected_niche' | 'selected_uvz' | 'is_archived' | 'is_starred'>>
): Promise<ResearchSession | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('research_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', error);
    return null;
  }

  return data;
}

// Delete session
export async function deleteSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('research_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting session:', error);
    return false;
  }

  return true;
}

// Save a message
export async function saveMessage(
  sessionId: string,
  userId: string,
  role: Message['role'],
  content: string,
  toolCalls?: any,
  toolResults?: any
): Promise<Message | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      tool_calls: toolCalls || null,
      tool_results: toolResults || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return null;
  }

  return data;
}

// Get messages for a session
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

// Update session title based on first message
export async function updateSessionTitleFromMessage(sessionId: string, firstMessage: string): Promise<void> {
  const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
  await updateSession(sessionId, { title });
}
