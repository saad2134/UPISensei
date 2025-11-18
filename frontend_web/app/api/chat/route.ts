import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini-service';
import { database } from '@/lib/database';

const geminiService = new GeminiService();

export async function POST(req: NextRequest) {
  try {
    const { message, fileIds = [] } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Valid message is required' }, 
        { status: 400 }
      );
    }

    console.log('Received chat request:', { message, fileIds });

    // Get user transactions (in real app, get userId from session)
    const userId = 'demo-user';
    const userTransactions = database.getTransactions(userId);
    
    // Get file context if file IDs provided
    let fileContext = '';
    if (fileIds.length > 0 && Array.isArray(fileIds)) {
      const files = fileIds
        .map((id: string) => database.getProcessedFile(id))
        .filter(Boolean);
      
      if (files.length > 0) {
        fileContext = `User uploaded ${files.length} file(s) containing transaction data that has been processed and added to their transaction history.`;
        console.log(`File context: ${files.length} files processed`);
      }
    }

    console.log('Calling Gemini service...');
    const response = await geminiService.chatWithUser(message, userTransactions, fileContext);
    console.log('Gemini response received');
    
    const assistantMessage = {
      id: Date.now().toString(),
      type: 'assistant' as const,
      content: response,
      timestamp: new Date().toISOString() // Use ISO string for consistency
    };

    return NextResponse.json(assistantMessage);
    
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process message';
    let statusCode = 500;
    
    if (error.message?.includes('API key')) {
      errorMessage = 'Gemini API configuration error';
      statusCode = 500;
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded';
      statusCode = 429;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}