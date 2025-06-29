import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getUserIdFromRequest } from '~/lib/auth/getUserId';
import { prisma } from '~/lib/.server/prisma';

// POST handler to create user in database
export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const body = await request.json();
    const { email } = body as { email: string };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return new Response(JSON.stringify(existingUser), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email || '',
      },
    });

    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
