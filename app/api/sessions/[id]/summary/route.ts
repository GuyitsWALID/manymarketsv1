import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSessionSummaryHTML, generateSessionSummaryMarkdown, SessionData } from '@/lib/export/sessionSummary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'html'; // html, md, pdf
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get session messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, tool_calls, tool_results')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Check Pro status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'enterprise';

    // Prepare session data
    const sessionData: SessionData = {
      id: session.id,
      title: session.title,
      industry: session.industry,
      selected_niche: session.selected_niche,
      selected_uvz: session.selected_uvz,
      phase: session.phase,
      created_at: session.created_at,
      messages: messages || [],
    };

    const options = {
      isPro,
      includeWatermark: !isPro,
    };

    // Generate based on format
    if (format === 'md') {
      const markdown = generateSessionSummaryMarkdown(sessionData, options);
      const filename = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.md`;
      
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Default to HTML (can be printed as PDF)
      const html = generateSessionSummaryHTML(sessionData, options);
      
      if (format === 'pdf') {
        // For PDF, return HTML that user can print
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      const filename = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.html`;
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Session summary export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
