var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://test.mosquitto.org');
 
client.on('connect', function () {
console.log('oo')
})


