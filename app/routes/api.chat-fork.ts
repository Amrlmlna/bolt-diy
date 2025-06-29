import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getUserIdFromRequest } from '~/lib/auth/getUserId';
import { prisma } from '~/lib/.server/prisma';
import { nanoid } from 'nanoid';
import type { Message } from 'ai';

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = (await request.json()) as { chatId: string; messageId: string };
    const { chatId, messageId } = body;
    if (!chatId || !messageId) {
      return new Response('chatId and messageId required', { status: 400 });
    }

    const originalChat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });
    if (!originalChat) {
      return new Response('Chat not found', { status: 404 });
    }

    const messages = (originalChat.messages as Message[]) || [];
    const forkIndex = messages.findIndex((m) => m.id === messageId);
    if (forkIndex === -1) {
      return new Response('Message not found in chat', { status: 404 });
    }
    const forkedMessages = messages.slice(0, forkIndex + 1);
    const newUrlId = nanoid(8);
    const newDescription = `Fork of ${originalChat.description || originalChat.id}`;

    const newChat = await prisma.chat.create({
      data: {
        userId,
        messages: forkedMessages,
        urlId: newUrlId,
        description: newDescription,
      },
    });

    return new Response(JSON.stringify({ urlId: newChat.urlId, id: newChat.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error forking chat:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
