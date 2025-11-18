// lib/chat-service.ts
const CHAT_API_URL = '/api/chat';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const sendMessage = async (message: string, fileIds?: string[]): Promise<ChatMessage> => {
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, fileIds }),
  });
  
  return response.json();
};

export const uploadFile = async (file: File): Promise<{ fileId: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};