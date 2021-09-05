const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const path = require('path');
const cors = require('cors');
const socketio = require('socket.io')
const PORT = process.env.PORT || 3001;

// Initalizes the app server
const app = express()

//establish connection to mongoose (get db working)
const mongoose = require('mongoose');
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost/eridium',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  }
);

//get apollo server running
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware } = require('./utils/auth');
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});
server.applyMiddleware({ app });

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
} else {
  app.use(express.static(path.join(__dirname, '../client/public')));
}

app.get('*', (req, res) => {
  console.log("[server]", 'user getting index route');
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: path.join(__dirname, '../client/build/') });
  } else {
    res.sendFile('index.html', { root: path.join(__dirname, '../client/public/') });
  }
});

//middleware settings
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())

// Listen to port PORT, save on const to attach io to it
const http = app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}` + server.graphqlPath)
)

// Attach socket.io to the server instance
const io = socketio(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.sockets.on('connection', function (socket) {
  socket.on('room', function (room) {
    console.log(socket.id, 'joined', room)
    socket.rooms.forEach(element => socket.leave(element));
    socket.join(room);
  });

  socket.on('message', (payload) => {
    console.log(socket.id, 'sent', payload, 'in', socket.rooms.values().next().value)
    io.in(socket.rooms.values().next().value).emit('message',  {...payload});
  });
});

// io.sockets.in(room).emit('message', 'what is going on, party people?');

// io.on('connection', (socket) => {
//   console.log("[socket]", socket.conn.id, 'connected');

//   socket.on("connect_error", (err) => {
//     console.log("[socket]", socket.conn.id, err);
//   });

//   socket.on('disconnect', () => {
//     console.log("[socket]", socket.conn.id, 'disconnected');
//   });

//   socket.on('message', (msg) => {
//     console.log("[socket]", socket.conn.id, 'sent:', msg);
//     io.emit('message', {message: msg, id: socket.conn.id, username: 'REPLACE THIS'});
//   });
// });