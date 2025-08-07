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
    
    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        emailNotifications: true,
        smsNotifications: true,
        whatsappNotifications: true,
        pushNotifications: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      whatsappNotifications: user.whatsappNotifications,
      pushNotifications: user.pushNotifications
    });

  } catch (error: any) {
    console.error('Error fetching user preferences:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { 
      emailNotifications, 
      smsNotifications, 
      whatsappNotifications, 
      pushNotifications 
    } = body;

    // Validate boolean values
    const booleanFields = {
      emailNotifications,
      smsNotifications,
      whatsappNotifications,
      pushNotifications
    };

    const updateData: any = {};
    Object.entries(booleanFields).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado válido fornecido' },
        { status: 400 }
      );
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        emailNotifications: true,
        smsNotifications: true,
        whatsappNotifications: true,
        pushNotifications: true
      }
    });

    // Log the preference change
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'notification_preferences_update',
        entityType: 'user',
        entityId: decoded.userId,
        newValues: updateData,
        success: true
      }
    });

    return NextResponse.json({
      message: 'Preferências atualizadas com sucesso',
      preferences: {
        emailNotifications: updatedUser.emailNotifications,
        smsNotifications: updatedUser.smsNotifications,
        whatsappNotifications: updatedUser.whatsappNotifications,
        pushNotifications: updatedUser.pushNotifications
      }
    });

  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}