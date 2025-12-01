import { createClient } from '@/lib/supabase/server';

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

// Create a new research session (server-side)
export async function createSessionServer(userId: string, title?: string): Promise<ResearchSession | null> {
  const supabase = await createClient();
  
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

// Get a session by ID (server-side)
export async function getSessionServer(sessionId: string): Promise<ResearchSession | null> {
  const supabase = await createClient();
  
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

// Save a message (server-side)
export async function saveMessageServer(
  sessionId: string,
  userId: string,
  role: Message['role'],
  content: string,
  toolCalls?: any,
  toolResults?: any
): Promise<Message | null> {
  const supabase = await createClient();
  
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

// Get messages for a session (server-side)
export async function getSessionMessagesServer(sessionId: string): Promise<Message[]> {
  const supabase = await createClient();
  
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

// Update session (server-side)
export async function updateSessionServer(
  sessionId: string,
  updates: Partial<Pick<ResearchSession, 'title' | 'phase' | 'phase_progress' | 'industry' | 'selected_niche' | 'selected_uvz' | 'is_archived' | 'is_starred' | 'tool_calls_count'>>
): Promise<ResearchSession | null> {
  const supabase = await createClient();
  
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

// Get current user (server-side)
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
