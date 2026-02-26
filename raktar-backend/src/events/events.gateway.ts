//raktar-backend/src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Kliens csatlakozott: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Kliens lecsatlakozott: ${client.id}`);
  }

  @SubscribeMessage('join_user_room')
  handleJoinRoom(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.userId) return;
    const roomName = `user_${data.userId}`;
    client.join(roomName);
    console.log(`Socket ${client.id} csatlakozott a szobához: ${roomName}`);
    return { event: 'joined', room: roomName };
  }

  emitToUser(userId: number, event: string, data: any) {
    if (this.server) {
      const roomName = `user_${userId}`;
      this.server.to(roomName).emit(event, data);
      console.log(`Célzott üzenet küldve: ${roomName} -> ${event}`);
    }
  }

  emitUpdate(event: string, data: any) {
    if (!this.server) return;

    const targetId = data.id || data.userId;

    if (targetId) {
      this.server.to(`user_${targetId}`).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }
}
