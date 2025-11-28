'use strict';


const ttContainer = {
	projectCode : null,
    mqttInfo :{
        clientId : "Web_Client_" + parseInt(Math.random() * 100 * 100, 10),
        host : "mqtt.bytechtree.com",
        port : location.protocol == "https:" ? 15676 : 15675,
        useSSL: location.protocol == "https:" ? true : false,
        userName : "goldstar-web",
		password: "n,E9TbDPYR5",
        keepAliveInterval: 30,
		isReconnect: true,
    },
    mqttClient : null,
    mqttConnected : false,
    mqttConnect(projectCode, onConnected = function() {}) {
		this.onConnected = onConnected;

		this.projectCode = projectCode;

        this.mqttClient = new Paho.MQTT.Client(this.mqttInfo.host, this.mqttInfo.port, "/ws", this.mqttInfo.clientId);

        this.mqttClient.onConnectionLost = function (responseObject) {
            console.log("onConnectionLost", responseObject.errorMessage)

            ttContainer.mqttClient == null
            ttContainer.mqttConnected = false;

			if (ttContainer.mqttInfo.isReconnect) {
				setTimeout(function() {
					ttContainer.mqttConnect(projectCode, onConnected);
				}, 1000 * 5);
			}
        };

        this.mqttClient.onMessageArrived = async function (message) {
            setTimeout(function() {
                ttContainer.recvMessage(message.destinationName, message.payloadString)
            });
        }

        this.mqttClient.connect({
            useSSL: this.mqttInfo.useSSL,
            keepAliveInterval: this.mqttInfo.keepAliveInterval,
            userName: this.mqttInfo.userName,
            password: this.mqttInfo.password,

            onSuccess: function () {
				ttContainer.mqttConnected = true;
				console.log("MQTT is Connected");

				ttContainer.subscribe(ttContainer.projectCode);

				ttContainer.onConnected();
            },
			
            onFailure: function (message) {
                ttContainer.mqttConnected = false;
                console.log("MQTT Connect Failed :: " + message.errorMessage);

				if (ttContainer.mqttInfo.isReconnect) {
					setTimeout(function() {
						ttContainer.mqttConnect(projectCode, ttContainer.onConnected);
					}, 1000 * 5);
				}
            }
        });
    },
	subscribe(topic) {
		if(this.mqttClient == null || !this.mqttConnected) {
			return console.error("MQTT Client is not connected.");
		}

		this.mqttClient.subscribe(topic, {qos: 0});
	},
	publish(topic, message, qos = 0) {
		if(this.mqttClient == null || !this.mqttConnected) {
			return console.error("MQTT Client is not connected.");
		}

		this.mqttClient.send(topic, JSON.stringify({
			clientId: this.mqttInfo.clientId,
			message: message
		}), qos)
	},
	recvMessage(topic, message) {
		// console.log("recvMessage", topic, message);

		try {
			if(this.mqttClient == null || !this.mqttConnected) {
				return console.error("MQTT Client is not connected.");
			}
			
			var recvJson = JSON.parse(message);

			if(recvJson.clientId == this.mqttInfo.clientId) return;

			this.onMessage(recvJson.message);

		} catch (error) {
			console.log("recvMessage Err", error)
		}
	},
	sendMessage(message) {
		// console.log(`Message send :: ${message}`);

		this.publish(this.projectCode, message);
	},

	onConnected : function() {},
	onMessage : function() {}
}

