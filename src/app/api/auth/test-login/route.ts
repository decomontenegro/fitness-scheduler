import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('📝 Test login attempt for:', email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        trainerProfile: true,
        clientProfile: true,
      },
    });
    
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    console.log('✅ User found:', user.name, '- Role:', user.role);
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      console.log('❌ Invalid password');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 401 });
    }
    
    console.log('✅ Password valid!');
    
    // Create simple JWT token (for testing)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 3600000, // 1 hour
    })).toString('base64');
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      message: 'Test login successful!'
    });
    
  } catch (error) {
    console.error('❌ Test login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    }, { status: 500 });
  }
}