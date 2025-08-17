import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/store/auth';

let socket: Socket | null = null;

export function getSocket() {
  const base = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
  const token = useAuth.getState().token;
  if (!socket) {
    socket = io(`${base}/ws`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: false,
      reconnectionAttempts: 5,
    });
  } else {
    socket.auth = { token };
    if (socket.disconnected) socket.connect();
  }
  return socket;
}
