import * as fs from "fs";
import * as http from "http";

import * as Promise from "bluebird";
import * as bodyParser from "body-parser";

import * as express from "express";
import * as timerdaemon from "timerdaemon";
import * as cors from "cors";
import * as pathExists from "path-exists";

import * as ioClient from "socket.io-client";
import * as Io from "socket.io";

const hwrestart = require('hwrestart');
const systemId = require('system-id');

const mkdirp = require('mkdir-p');
const rpj = require('request-promise-json');
const execSync = require('exec-sync');
const PDB = require('pouchdb');
const mqtt = require('mqtt');

import linetw =require("linetwork");

// var noOffline=require('./modules/offlinecount');



import iologin = require('./modules/socket/iologin');

import tasker = require('./modules/tasker');




const conf = require('./conf.json');


if (!pathExists.sync(__dirname + '/db')) {
    mkdirp.sync(__dirname + '/db')
} else {
    execSync('rm -rf '+__dirname +'/db/status/*')
}

const app = express();
const PouchDB = PDB.defaults({ prefix: './db/', auto_compaction: true });
app.use(cors());


const server = http.createServer(app);


const ioServer = Io.listen(server);

const Internet = new linetw(conf.network);




app.use('/db', require('express-pouchdb')(PouchDB));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


const Tasker = new tasker('http://127.0.0.1:' + conf.app.port);

Tasker.setsockethost(ioServer)

const statusdb = new PouchDB('status');
const configdb = new PouchDB('config');

let offlinedb = false;


Tasker.setdb("http://127.0.0.1:" + conf.app.port, PouchDB)

//execSync('rm -rf systemid/*')  // to be removed

const sysId = new systemId({ path: __dirname + '/systemid', tracker: true });

// sysId.validate(sysId.serial,{
//  user:'slmach_ingcarusoa_4iy5tg',
//  password:'2esgh27eu1bb',
//  db:'mach_sufjt5_energytrack'
// }) // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!to be removed


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/html/index.html')
})


app.get('/test', function(req, res) {
    console.log('test')
    Tasker.broadcast('test', { tt: 'rr' })


    res.json({ t: 'test' })
})

app.post('/send', function(req, res) { // invia gli oggetti o li salva se non c'è connessione e li invia dopo

    Tasker.send(req.body.task, req.body.data)
    res.json({ t: 'test' })
})
app.post('/push', function(req, res) { // invia gli oggetti

    Tasker.push(req.body)


    res.json({ t: 'test' })
})
app.post('/broadcast', function(req, res) { // invia gli oggetti

    Tasker.broadcast(req.body.task, req.body.data)


    res.json({ t: 'test' })
})
app.post('/save', function(req, res) { // memorizza in locale
    res.json({ t: 'test' })
})
app.post('/set', function(req, res) { // salva lo status sul db e lo invia



})

if (pathExists.sync(__dirname + '/systemid/.tracker')) {

} else {
    throw Error('provide tracker first')
}


if (!pathExists.sync(__dirname + '/apps')) {
    mkdirp.sync(__dirname + '/apps')
    mkdirp.sync(__dirname + '/apps/configs')
    mkdirp.sync(__dirname + '/apps/modules')

} else {

    if (!pathExists.sync(__dirname + '/apps/configs')) {
        mkdirp.sync(__dirname + '/apps/configs')

    }
    if (!pathExists.sync(__dirname + '/apps/modules')) {
        mkdirp.sync(__dirname + '/apps/modules')

    }
}

let apps = fs.readdirSync('./apps/modules/')
for (var m = 0; m < apps.length; m++) {
    if (pathExists.sync(__dirname + '/apps/modules/' + apps[m] + '/package.json')) {
        var appconf = require(__dirname + '/apps/modules/' + apps[m] + '/package.json')
        var appname = appconf.name


        console.log('configuring app ' + appconf.name)


        if (pathExists.sync(__dirname + '/apps/configs/' + apps[m] + '.json')) {
            var appopts = require(__dirname + '/apps/configs/' + apps[m] + '.json')

            app.use('/' + appopts.route, require(__dirname + '/apps/modules/' + apps[m] + '/' + appconf.main)(appopts.options));

        } else {
            app.use('/' + appopts.route, require(__dirname + '/apps/modules/' + apps[m] + '/' + appconf.main));

        }

        if (appopts.boot) {
            setTimeout(function() {

                if (appopts.boot.object) {
                    rpj.post("http://127.0.0.1:" + conf.app.port + '/' + appopts.route + '/' + appopts.boot.path, appopts.boot.object).then(function() {
                        console.log('boot app ' + apps[m])
                    }).catch(function(err) {
                        console.log(err)
                        console.log('error on boot app ' + appname)

                    })
                } else {
                    rpj.post("http://127.0.0.1:" + conf.app.port + '/' + appopts.route + appopts.boot.path).then(function() {
                        console.log('boot app ' + apps[m])
                    }).catch(function(err) {
                        console.log(err)
                        console.log('error on boot app ' + appname)

                    })
                }
            }, 2000)

        }



    }
}



interface onlinestatus {
    _id: string;
    connected: boolean;
    updatedAt: number;
    _rev?: string;
    from?: number;
}

function onlinestatus() {


    let timenow = new Date().getTime();

    let obj: onlinestatus = {
        _id: "connection",
        connected: connection,
        updatedAt: timenow
    }
    return new Promise(function(resolve, reject) {




        statusdb.get(obj._id).then(function(d) {

            obj._rev = d._rev;

            if (!connection && !d.from) {
                obj.from = timenow;

            } else if (!connection && d.from && d.from < (timenow - 10000)) {
                console.log(d.from, (timenow - 10000))
                hwrestart('unplug')
            }


            statusdb.put(obj).then(function() {
                resolve(obj)

            }).catch(function(err) {
                reject(err)
            })



        }).catch(function(e) {

            if (e.status == 404) {
                if (!connection) {
                    obj.from = timenow;
                }

                statusdb.post(obj).then(function() {
                    resolve(obj)

                }).catch(function(err) {
                    reject(err)
                    if (!connection) {
                        hwrestart('unplug')
                    }
                })
            } else if (!connection) {
                console.log(e)
                hwrestart('unplug')
            } else {

                reject(e)

            }


        })




    })



}




let firstconnection = false
let connection = false
let iosevents = false
let socket;
let authorized = false;

function Connect(url: string, auth: string) {




    if (!authorized) {


        console.log('trying to connect')
        iologin(url, auth).then(function(token) {






            // to try first
            const mqttclient = mqtt.connect('mqtt://kernel.online', { port: 9883, username: sysId.auth().user, password: new Buffer(JSON.stringify(token), 'utf8') });



            mqttclient.on('message', function(topic, message, packet) {
                console.log(topic);
                switch (topic) {
                    case "npm":
                        break;

                    case "task":
                        Tasker.run(message)
                        break;

                    case "exec":
                        break;
                }





            })





            mqttclient.on('connect', function() {
                console.log("MQTT connected")


                Tasker.setsocketclient(socket)
                console.log('online')
                connection = true
   
                
                if (!firstconnection) {
                    firstconnection = true
                }

                             if (!connection) {
                    connection = true
                    onlinestatus()
                }




            });

            mqttclient.on('reconnect', function(err) {
                console.log("MQTT connected")


                Tasker.setsocketclient(socket)
                console.log('online')
                connection = true
   
                             if (!connection) {
                    connection = true
                    onlinestatus()
                }


            });




            mqttclient.on('error', function(err) {
                console.log('error')
                console.log(err)
                connection = false

                          if (connection) {
                    connection = false
                    onlinestatus()
                }


            });


            mqttclient.on('close', function(err) {
                console.log('error')
                console.log(err)
                connection = false


                          if (connection) {
                    connection = false
                    onlinestatus()
                }


            });

            mqttclient.on('offline', function(err) {
                console.log('error')
                console.log(err)
                connection = false


                          if (connection) {
                    connection = false
                    onlinestatus()
                }


            });

        }).catch(function(err) {
            console.log('wrooong')
            console.log(err)
            setTimeout(function() {
                Connect(url, auth)
            }, 3000)



        })

    }
}


console.log(Internet);
Internet.init().then(function (status) {
    console.log("CONNECTED")
        console.log(status)


}).catch(function (err) {
        console.log("err CONNECTED")
            console.log(err)
    
                hwrestart('unplug')

});




Connect(conf.io, sysId.auth())

timerdaemon.post(5000, function() {

    onlinestatus()

})



server.listen(conf.app.port, '0.0.0.0');
