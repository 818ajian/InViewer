import autobind from 'autobind-decorator'
import BaseSvc from './BaseSvc'
import io from 'socket.io'

export default class SocketSvc extends BaseSvc {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (config) {

    super (config)

    this.io = io(config.server)

    this.connections = {}

    this.handleConnection = this.handleConnection.bind(this);
    this.handleDisconnection = this.handleDisconnection.bind(this);

    this.io.sockets.on(
      'connection',
      this.handleConnection)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  name() {

    return 'SocketSvc'
  }

  /////////////////////////////////////////////////////////
  // Socket Connection handler
  //
  /////////////////////////////////////////////////////////
  handleConnection (socket) {

    this.connections[socket.id] = socket

    socket.on('disconnect', () => {

      this.handleDisconnection(socket.id)
    })

    socket.on('broadcast', (data) => {

      const socketIds = Object.keys(this.connections)

      const filter = socketIds.filter((socketId) => {

        return socketId !== socket.id
      })

      this.broadcast(data.msgId, data.msg, filter)
    })

    this.emit('socket.connected', {
      id: socket.id
    })

    console.log('Socket connected: ' + socket.id)
  }

  /////////////////////////////////////////////////////////
  // Socket Disconnection handler
  //
  /////////////////////////////////////////////////////////
  handleDisconnection (id) {

    this.emit('socket.disconnected', {
      id: id
    })

    if (this.connections[id]) {

      delete this.connections[id]

      console.log('Socket disconnected: ' + id)
    }
  }

  /////////////////////////////////////////////////////////
  // filter: array of socketIds to broadcast
  // If null, broadcast to every connected socket
  //
  /////////////////////////////////////////////////////////
  broadcast (msgId, msg, filter = null) {

    if (filter) {

      filter = Array.isArray(filter) ? filter : [filter]

      filter.forEach((socketId) => {

        if (this.connections[socketId]){

          var socket = this.connections[socketId]

          socket.emit(msgId, msg)
        }
      })

    } else {

      for (var socketId in this.connections) {

        var socket = this.connections[socketId]

        socket.emit(msgId, msg)
      }
    }
  }
}
