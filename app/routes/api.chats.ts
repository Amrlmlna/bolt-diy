import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getUserIdFromRequest } from '~/lib/auth/getUserId';
import { prisma } from '~/lib/.server/prisma';

// GET handler to fetch all chat histories for the authenticated user
export async function loader({ request }: ActionFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        urlId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new Response(JSON.stringify(chats), {
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

// POST handler to create a new chat
export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const { description, messages } = await request.json();

    const chat = await prisma.chat.create({
      data: {
        userId,
        description: description || 'New Chat',
        messages: messages || [],
        urlId: Math.random().toString(36).substring(2, 10),
      },
    });

    return new Response(JSON.stringify(chat), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
