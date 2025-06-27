import { io, Socket } from 'socket.io-client';
import { Message } from './api';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(userId: string): void {
    if (this.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
      this.socket?.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Send message
  sendMessage(messageData: {
    sender: string;
    recipient: string;
    content: string;
    messageType?: string;
  }): void {
    if (this.socket && this.connected) {
      this.socket.emit('sendMessage', messageData);
    }
  }

  // Listen for incoming messages
  onReceiveMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('receiveMessage', callback);
    }
  }

  // Listen for message delivery confirmation
  onMessageDelivered(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('messageDelivered', callback);
    }
  }

  // Send typing indicator
  sendTyping(data: { sender: string; recipient: string; isTyping: boolean }): void {
    if (this.socket && this.connected) {
      this.socket.emit('typing', data);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback: (data: { sender: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  // Listen for online users
  onUserOnline(callback: (users: string[]) => void): void {
    if (this.socket) {
      this.socket.on('userOnline', callback);
    }
  }

  // Remove event listeners
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export default new SocketService();