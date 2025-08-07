import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de acesso requerido' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    // Add user to request
    (request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Call the handler with authenticated request
    return handler(request as AuthenticatedRequest);
    
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Token inválido ou expirado', details: error.message },
      { status: 401 }
    );
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest) => {
    if (req.user?.role !== role) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }
    return null;
  };
}