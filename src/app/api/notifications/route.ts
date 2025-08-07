import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    });

    return NextResponse.json(notifications);

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get user to verify admin/trainer role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuário não encontrado ou inativo' }, { status: 401 });
    }

    if (user.role !== 'TRAINER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, message, type, metadata } = body;

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, title, message, type' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['appointment', 'message', 'payment', 'reminder'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de notificação inválido' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata: metadata || {},
        isRead: false
      }
    });

    // TODO: Send real-time notification via Socket.io
    // socketManager.emitToUser(userId, 'notification:new', notification);

    return NextResponse.json(notification, { status: 201 });

  } catch (error: any) {
    console.error('Error creating notification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}