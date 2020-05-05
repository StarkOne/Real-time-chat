const express = require('express');
const http = require('http');
const socketio = require('socket.io')
const cors = require('cors');

//router
const router = require('./router');
//helpers
const usersHelpers = require('./users')

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(router);

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join', ({name, room}, callback) => {
        const {error, user} = usersHelpers.addUser({
            id: socket.id,
            name,
            room
        });
        console.log({error, user});

        if(error) callback(error);
        socket.emit('message', {
            user: 'admin',
            text: `${user.name}, welcome to the room ${user.room}`
        });
        socket.broadcast.to(user.room).emit('message', {
            user: 'admin',
            text: `${user.name}, has joined!`
        })
        socket.join(user.room);

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: usersHelpers.getUsersInRoom(user.room)
        },)

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = usersHelpers.getUser(socket.id);
        console.log(user);
        io.to(user.room).emit('message', {
            user: user.name,
            text: message
        });

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: usersHelpers.getUsersInRoom(user.room)
        })
        callback();
    });

    socket.on('disconnect', () => {
        const user = usersHelpers.removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message', {
                user: 'admin',
                text: `${user.name}, has left!`
            });
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: usersHelpers.getUsersInRoom(user.room)
            })
        }
        console.log('user disconnected');
    });
});
server.listen(PORT, () => console.log(`server start on PORT ${PORT}`))
