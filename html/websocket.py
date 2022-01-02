#!/usr/bin/python3
# -*- coding: utf-8 -*-

### pip3 install websocket-server

import sys
import time
import json
import base64
import threading

from websocket_server import WebsocketServer

PORT = 3000

clientList = {}
dcaseList = {}
   
def wssNewClient(client, server):
    global clientList
    id = client['id']
    clientList[id] = {
        "client" : client,
        "dcaseID" : "",
    }
    # print("New client connected and was given id {0}".format( client['id'] ) )
    
def wssClientLeft(client, server):
    global clientList
    id = client['id']
    if clientList[id]["dcaseID"] != "":
        dcaseID = clientList[id]["dcaseID"]
        del dcaseList[dcaseID][id]
    
    del clientList[id]
    # print("Client({0}) disconnected".format( client['id'] ) )
    

def wssMessageReceived(client, server, message):
    data = json.loads(message)
    id = client['id']
    # print(data, flush=True)
    mode = data["mode"]

    dcaseID = data["dcaseID"]
    if mode=='ping':
        pass
    if mode=='connected':
        if dcaseID not in dcaseList:
            dcaseList[dcaseID] = {}
        clientList[id]["dcaseID"] = dcaseID
        dcaseList[dcaseID][ client['id'] ] = client
    else:
        for clientID, clientSocket in dcaseList[dcaseID].items():
            if clientID != id:
                server.send_message( clientSocket, message )
    # server.send_message( client, '{"mode":"ack"}' )
    

if __name__ == '__main__':
    wss = WebsocketServer(host='127.0.0.1', port=PORT )
    wss.set_fn_new_client( wssNewClient )
    wss.set_fn_client_left( wssClientLeft )
    wss.set_fn_message_received( wssMessageReceived )
    
    wss.run_forever()
    