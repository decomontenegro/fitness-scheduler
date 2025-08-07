import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pushNotificationService } from '@/services/push';

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

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Dados de inscrição inválidos' },
        { status: 400 }
      );
    }

    // Get user agent for logging
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Save subscription
    const success = await pushNotificationService.saveSubscription(
      decoded.userId,
      subscription,
      userAgent
    );

    if (success) {
      return NextResponse.json({ 
        message: 'Inscrição salva com sucesso',
        subscription: true 
      });
    } else {
      return NextResponse.json(
        { error: 'Erro ao salvar inscrição' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error subscribing to push notifications:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}