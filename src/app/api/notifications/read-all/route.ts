import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get user to verify existence and status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuário não encontrado ou inativo' }, { status: 401 });
    }

    // Mark all user's notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({
      message: 'Todas as notificações foram marcadas como lidas',
      updatedCount: result.count
    });

  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}