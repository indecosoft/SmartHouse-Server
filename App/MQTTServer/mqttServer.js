"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../../config");
var net = require('net');
// import { port } from '../config';
var aedes = require('aedes')();
var MqttServer = /** @class */ (function () {
    function MqttServer(server) {
        var _this = this;
        this.server = server;
        // listen on port 1883
        server = net.createServer(aedes.handle);
        server.listen(config_1.MQTTport, function () {
            console.log('MQTT Server listening on port', config_1.MQTTport);
        });
        aedes.authorizeSubscribe = function (client, packet, callback) {
            // console.log(client); 
            if (!_this.isJson(client.id)) {
                return callback(new Error("Invalid device -> " + client.id));
            }
            else {
                console.log('\x1b[33m%s', "Client " + client.id + " subscribed to channel " + packet.topic);
                switch (packet.topic) {
                    case 'response':
                        return callback(null, packet);
                    case 'SensorsDataChannel':
                        return callback(null, packet);
                    case 'SensorsStatusChannel':
                        return callback(null, packet);
                    case 'SensorsConfigChannel':
                        return callback(null, packet);
                    case 'SensorsSettingsChannel': // only sensors 
                        var data = { client: client ? client.id : client, status: 'online' };
                        var payload = {
                            cmd: 'publish',
                            topic: 'SensorsStatusChannel',
                            payload: Buffer.from(JSON.stringify(data)),
                        };
                        aedes.publish(payload);
                        return callback(null, packet);
                    default:
                        console.log('\x1b[31m%s', "Client " + client.id + " subscribed rej to channel " + packet.topic);
                        return callback(new Error('Wrong topic'));
                }
            }
        };
        aedes.on('unsubscribe', function (subscriptions, client) {
            console.log('unsubscribe', subscriptions);
            console.log('unsubscribe', client.id);
            if (_this.isJson(client.id) && JSON.parse(client.id).account) {
                console.log('MQTT device \x1b[32m' + (client ? client.id : client) +
                    '\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id);
                if (subscriptions[0] == 'SensorsSettingsChannel') {
                    console.log('status changed');
                    var data = { client: client ? client.id : client, status: 'offline' };
                    var payload = {
                        cmd: 'publish',
                        topic: 'SensorsStatusChannel',
                        payload: Buffer.from(JSON.stringify(data)),
                    };
                    aedes.publish(payload);
                }
            }
            else {
                console.log('MQTT hub/user \x1b[32m' + (client ? client.id : client) +
                    '\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id);
            }
        });
        aedes.authorizePublish = function (client, packet, callback) {
            // if (!this.isJson(packet.payload.toString())){
            //     console.error(`Invalid packet was sent from client -> ${client.id}`);
            //     callback(new Error('Invalid packet'));
            // } else {
            switch (packet.topic) {
                case 'response':
                case 'SensorsConfigChannel':
                case 'SensorsDataChannel':
                case 'SensorsStatusChannel':
                case 'SensorsSettingsChannel':
                    return callback(null);
                default:
                    return callback(new Error('Wrong topic'));
            }
            // }
        };
        aedes.authorizeForward = function (client, packet) {
            console.log('authorizeForward ' + client.id);
            console.log('authorizeForward topic ' + packet.topic);
            switch (packet.topic) {
                case 'response':
                case 'SensorsConfigChannel':
                case 'SensorsDataChannel':
                    if (_this.isJson(client.id)) {
                        console.log('SensorsDataChannel ' + client.id.toString());
                        if (JSON.parse(client.id.toString()).name === JSON.parse(packet.payload.toString()).account || JSON.parse(client.id.toString()).name === 'Hub')
                            return packet;
                    }
                    return null;
                case 'SensorsStatusChannel':
                    // return client.id === "Hub" ? packet : null;
                    if (_this.isJson(client.id)) {
                        console.log('SensorsStatusChannel ' + client.id.toString());
                        console.log('SensorsStatusChannel payload ' + packet.payload.toString());
                        var obj = JSON.parse(packet.payload.toString());
                        if (JSON.parse(client.id.toString()).name === JSON.parse(obj.client).account || JSON.parse(client.id.toString()).name === 'Hub')
                            return packet;
                    }
                    return null;
                case 'SensorsSettingsChannel':
                    if (_this.isJson(packet.payload.toString())) {
                        var obj = JSON.parse(packet.payload.toString());
                        console.log('objjjj', obj);
                        console.log('client iddddd', JSON.parse(client.id.toString()));
                        return JSON.parse(client.id.toString()).name === obj.macAddress.toUpperCase() ? packet : null;
                    }
                    return null;
                default:
                    return null;
            }
        };
        aedes.authenticate = function (_client, _username, _password, callback) {
            callback(null, true, true);
        };
    }
    MqttServer.prototype.isJson = function (str) {
        try {
            JSON.parse(str);
        }
        catch (e) {
            console.error(e);
            return false;
        }
        return true;
    };
    return MqttServer;
}());
exports.MqttServer = MqttServer;
