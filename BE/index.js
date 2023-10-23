    const express = require('express');
    const ws = require('ws');
    const crypto = require('crypto');

    const app = express();
    const port = 5000;
    const clients = new Map();

    const MessageType = {
        Message: 0,
        UserList: 1,
        UserId: 2
    }

    const server = app.listen(port, () => {
            console.log(`Listening at http://localhost:${port}`)
     });

    const wsServer = new ws.Server({ noServer: true });

    // setting the connection
    server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, socket => {
            wsServer.emit('connection', socket, request);
        });
    });

    wsServer.on('connection', (socket, request) => {
        const clientId = generateClientId();
        const clientName = getClientNameFromURL(request.url);
        clients.set(clientId, { name: clientName, socket: socket });
        console.log('client: ', clientId, clientName);

        socket.send(
            JSON.stringify({
                type: MessageType.UserId,
                source: "server",
                content: clientId.toString()
            }));

        sendClientsToAll();

        socket.on('message', message => {
            console.log('userId', clientId);

            if (message) {
                const msg = JSON.parse(message.toString());
                console.log('message', msg.type)
                // requesting clients list
                if (msg.type === MessageType.UserList) {
                    setTimeout(function () {
                        const clientsList = new Array();

                        for (const entry of clients.entries()) {
                            clientsList.push({ id: entry[0], name: entry[1].name });
                        }

                        sendClients(clients.get(clientId).socket, clientsList);
                        console.log('user List sent');
                    }, 100);
                } else if (msg.type == MessageType.Message) {
                    const jsonData = JSON.parse(message);
                    let clientsWs = [];

                    if (jsonData.toAll) {
                        clientsWs = wsServer.clients;
                    } else if (jsonData.recipients.length) {
                        clientsWs.push(clients.get(clientId).socket);
                        jsonData.recipients.forEach(function each(clientId) {
                            console.log('clientId->', clientId);
                            clientsWs.push(clients.get(clientId).socket);
                        });
                    }

                    clientsWs.forEach(function each(client) {
                        if (client.readyState === ws.OPEN) {
                            setTimeout(function () {
                                client.send(
                                    JSON.stringify({
                                        type: MessageType.Message,
                                        source: jsonData.source,
                                        content: jsonData.content,
                                        toAll: jsonData.toAll,
                                        recipients: jsonData.recipients
                                    }));
                            }, 100);
                        }
                    });
                }
            }
            console.log(message.toString());
        });

        // Handle client disconnect
        socket.on('close', () => {
            clients.delete(clientId);
            sendClientsToAll();
            console.log(`Client ${clientId} disconnected`);
        });
    });

    function getClientNameFromURL(url) {
        const currentUrl = `http://localhost:${port}${url.substring(1)}`;
        const parsedUrl = new URL(currentUrl);
        console.log(parsedUrl.searchParams.get('clientName'));
        return parsedUrl.searchParams.get('clientName');
    }

    function generateClientId() {
        return crypto.createHash('md5').update(Date.now().toString()).digest("hex");
    }

    function sendClients(client, clientList) {
        client.send(
            JSON.stringify(
                {
                    "type": MessageType.UserList,
                    "source": "server",
                    "content": clientList
                }
            )
        );
    }
    function sendClientsToAll() {
        const clientsList = new Array();

        for (const entry of clients.entries()) {
            clientsList.push({ id: entry[0], name: entry[1].name });
        }

        wsServer.clients.forEach(function each(client) {
            if (client.readyState === ws.OPEN) {

                setTimeout(function () {
                    sendClients(client, clientsList)
                }, 100)
            }
        })
    }

