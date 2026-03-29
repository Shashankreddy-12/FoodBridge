import jwt from 'jsonwebtoken';

export default function setupSocket(io) {
  // Authenticate every socket connection with JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = user.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join personal room for targeted events
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.userId} connected`);

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}
