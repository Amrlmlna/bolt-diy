import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getUserIdFromRequest } from '~/lib/auth/getUserId';
import { prisma } from '~/lib/.server/prisma';
import type { Message } from 'ai';

// GET handler to fetch all chat histories for the authenticated user
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedChats = chats.map((chat: any) => ({
      id: chat.id,
      urlId: chat.urlId,
      description: chat.description,
      messages: chat.messages as Message[],
      timestamp: chat.createdAt.toISOString(),
      metadata: undefined, // Not in schema yet
    }));

    return new Response(JSON.stringify(formattedChats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// POST handler to save chat
export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const method = request.method;

  try {
    if (method === 'POST') {
      // Save chat
      const body = await request.json();
      const { id, urlId, description, messages } = body as {
        id: string;
        urlId?: string;
        description?: string;
        messages: Message[];
      };

      await prisma.chat.upsert({
        where: { id },
        update: {
          urlId,
          description,
          messages,
          updatedAt: new Date(),
        },
        create: {
          id,
          urlId,
          description,
          messages,
          userId,
        },
      });

      return new Response('Chat saved successfully', { status: 200 });
    } else if (method === 'DELETE') {
      // Delete chat
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) return new Response('Chat ID required', { status: 400 });

      await prisma.chat.deleteMany({
        where: {
          id: id,
          userId: userId,
        },
      });

      return new Response('Chat deleted successfully', { status: 200 });
    } else if (method === 'PUT') {
      // Update chat description
      const body = await request.json();
      const { id, description } = body as {
        id: string;
        description: string;
      };

      await prisma.chat.updateMany({
        where: {
          id: id,
          userId: userId,
        },
        data: {
          description: description,
          updatedAt: new Date(),
        },
      });

      return new Response('Chat description updated successfully', { status: 200 });
    } else {
      return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Error in chat history action:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
