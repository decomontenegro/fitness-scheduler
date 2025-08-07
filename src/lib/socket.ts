import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export class SocketManager {
  private io: SocketIOServer | null = null;
  private static instance: SocketManager | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!this.instance) {
      this.instance = new SocketManager();
    }
    return this.instance;
  }

  initialize(server: HTTPServer) {
    if (this.io) return this.io;

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            trainerProfile: true,
            clientProfile: true
          }
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`User ${user.name} connected`);

      // Join user to their personal room
      socket.join(`user:${user.id}`);

      // Join trainers to their trainer room
      if (user.role === 'TRAINER' && user.trainerProfile) {
        socket.join(`trainer:${user.trainerProfile.id}`);
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${user.name} disconnected`);
      });

      // Handle joining appointment rooms
      socket.on('join:appointment', (appointmentId: string) => {
        socket.join(`appointment:${appointmentId}`);
      });

      // Handle leaving appointment rooms
      socket.on('leave:appointment', (appointmentId: string) => {
        socket.leave(`appointment:${appointmentId}`);
      });

      // Handle real-time message events
      socket.on('message:send', (data) => {
        // Emit to receiver
        this.io?.to(`user:${data.receiverId}`).emit('message:received', data);
      });

      // Handle typing indicators
      socket.on('typing:start', (data) => {
        socket.to(`user:${data.receiverId}`).emit('typing:start', {
          senderId: user.id,
          senderName: user.name
        });
      });

      socket.on('typing:stop', (data) => {
        socket.to(`user:${data.receiverId}`).emit('typing:stop', {
          senderId: user.id
        });
      });
    });

    return this.io;
  }

  // Emit notification to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit notification to all trainers
  emitToTrainers(event: string, data: any) {
    if (!this.io) return;
    this.io.to('trainers').emit(event, data);
  }

  // Emit to appointment participants
  emitToAppointment(appointmentId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`appointment:${appointmentId}`).emit(event, data);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketManager = SocketManager.getInstance();