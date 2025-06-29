import { supabase } from '~/lib/supabaseClient';
import type { Message } from 'ai';
import type { ChatHistoryItem } from './useChatHistory';

export interface DatabaseChat {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: any;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current Supabase access token for API requests
 */
async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Get or create user in database from JWT token
 */
export async function getOrCreateUser() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Create user in database if not exists
  try {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    const dbUser = await response.json();
    return dbUser;
  } catch (error) {
    console.error('Error creating user in database:', error);
    // Return auth user as fallback
    return user;
  }
}

/**
 * Save chat to database using API route
 */
export async function saveChatToDatabase(chat: ChatHistoryItem): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch('/api/chat-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      id: chat.id,
      urlId: chat.urlId,
      description: chat.description,
      messages: chat.messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save chat: ${response.statusText}`);
  }
}

/**
 * Get all chats for current user from database using API route
 */
export async function getChatsFromDatabase(): Promise<ChatHistoryItem[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch('/api/chat-history', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chats: ${response.statusText}`);
  }

  const chats = (await response.json()) as ChatHistoryItem[];
  return chats;
}

/**
 * Get specific chat by ID or URL ID from database using API route
 */
export async function getChatFromDatabase(id: string): Promise<ChatHistoryItem | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`/api/chat/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch chat: ${response.statusText}`);
  }

  const chat = (await response.json()) as ChatHistoryItem;
  return chat;
}

/**
 * Delete chat from database using API route
 */
export async function deleteChatFromDatabase(id: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`/api/chat-history?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete chat: ${response.statusText}`);
  }
}

/**
 * Update chat description in database using API route
 */
export async function updateChatDescriptionInDatabase(id: string, description: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch('/api/chat-history', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      id,
      description,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update chat description: ${response.statusText}`);
  }
}
