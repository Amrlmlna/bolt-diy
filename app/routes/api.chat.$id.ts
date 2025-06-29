import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getUserIdFromRequest } from '~/lib/auth/getUserId';
import { prisma } from '~/lib/.server/prisma';
import type { Message } from 'ai';

// GET handler to fetch specific chat by ID or URL ID
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const id = params.id;

  if (!id) return new Response('Chat ID required', { status: 400 });

  try {
    // Try to find by ID first
    let chat = await prisma.chat.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    // If not found by ID, try by URL ID
    if (!chat) {
      chat = await prisma.chat.findFirst({
        where: {
          urlId: id,
          userId: userId,
        },
      });
    }

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    const formattedChat = {
      id: chat.id,
      urlId: chat.urlId,
      description: chat.description,
      messages: chat.messages as Message[],
      timestamp: chat.createdAt.toISOString(),
      metadata: undefined, // Not in schema yet
    };

    return new Response(JSON.stringify(formattedChat), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
