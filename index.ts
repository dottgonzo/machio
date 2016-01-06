import * as fs from "fs";
import * as http from "http" ;

import * as Promise from "bluebird";
import * as  bodyParser from "body-parser";

import * as express from "express";

import * as cors from "cors";
import * as pathExists from "path-exists";

import * as ioClient from "socket.io-client";
import * as Io from "socket.io";

let hwrestart = require('hwrestart');
let systemId = require('system-id');

let rpj=require('request-promise-json');

// var noOffline=require('./modules/offlinecount');



let iologin=require('./modules/socket/iologin');
let ioevents=require('./modules/socket/ioevents');
let tasker=require('./modules/tasker');

let mkdirp = require('mkdir-p');


let conf=require('./conf.json');
let execSync = require('exec-sync');

if(!pathExists.sync(__dirname+'/db')){
  mkdirp.sync(__dirname+'/db')
} else{
  execSync('rm -rf /db/status/*')
}

let app     = express();
let PouchDB = require('pouchdb').defaults({prefix: './db/',auto_compaction: true});
app.use(cors());


let server = http.createServer(app);


let ioServer  = Io.listen(server);





app.use('/db', require('express-pouchdb')(PouchDB));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


var Tasker=new tasker('http://127.0.0.1:'+conf.app.port);

Tasker.setsockethost(ioServer)


var configdb=new PouchDB('config');
var offlinedb=false;
var statusdb=new PouchDB('status');

Tasker.setdb("http://127.0.0.1:"+conf.app.port,PouchDB)

//execSync('rm -rf systemid/*')  // to be removed

var sysId=new systemId({path:__dirname+'/systemid',tracker:true});

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
  Tasker.broadcast('test',{tt:'rr'})


  res.json({t:'test'})
})

app.post('/send', function(req, res) { // invia gli oggetti o li salva se non c'è connessione e li invia dopo

Tasker.send(req.body.task,req.body.data)
res.json({t:'test'})
})
app.post('/push', function(req, res) { // invia gli oggetti

  Tasker.push(req.body)


  res.json({t:'test'})
})
app.post('/broadcast', function(req, res) { // invia gli oggetti

  Tasker.broadcast(req.body.task,req.body.data)


  res.json({t:'test'})
})
app.post('/save', function(req, res) { // memorizza in locale
  res.json({t:'test'})
})
app.post('/set', function(req, res) { // salva lo status sul db e lo invia



})

if(pathExists.sync(__dirname+'/systemid/.tracker')){

} else{
  throw Error('provide tracker first')
}


if(!pathExists.sync(__dirname+'/apps')){
  mkdirp.sync(__dirname+'/apps')
  mkdirp.sync(__dirname+'/apps/configs')
  mkdirp.sync(__dirname+'/apps/modules')

} else {

  if(!pathExists.sync(__dirname+'/apps/configs')){
    mkdirp.sync(__dirname+'/apps/configs')

  }
  if(!pathExists.sync(__dirname+'/apps/modules')){
    mkdirp.sync(__dirname+'/apps/modules')

  }
}

var apps=fs.readdirSync('./apps/modules/')
for(var m=0;m<apps.length;m++){
  if(pathExists.sync(__dirname+'/apps/modules/'+apps[m]+'/package.json')){
    var appconf=require(__dirname+'/apps/modules/'+apps[m]+'/package.json')
    var appname=appconf.name


    console.log('configuring app '+appconf.name)


    if(pathExists.sync(__dirname+'/apps/configs/'+apps[m]+'.json')){
      var appopts=require(__dirname+'/apps/configs/'+apps[m]+'.json')

      app.use('/'+appopts.route, require(__dirname+'/apps/modules/'+apps[m]+'/'+appconf.main)(appopts.options));

    } else{
      app.use('/'+appopts.route, require(__dirname+'/apps/modules/'+apps[m]+'/'+appconf.main));

    }

    if(appopts.boot){
      setTimeout(function(){

        if (appopts.boot.object){
          rpj.post("http://127.0.0.1:"+conf.app.port+'/'+appopts.route+'/'+appopts.boot.path,appopts.boot.object).then(function(){
            console.log('boot app '+apps[m])
          }).catch(function(err){
            console.log(err)
            console.log('error on boot app '+appname)

          })
        } else {
          rpj.post("http://127.0.0.1:"+conf.app.port+'/'+appopts.route+appopts.boot.path).then(function(){
            console.log('boot app '+apps[m])
          }).catch(function(err){
            console.log(err)
            console.log('error on boot app '+appname)

          })
        }
      },2000)

    }



  }
}


function onlinestatus(url,auth){
    

        let bool;

  if(!connection){
     bool=false;
    setTimeout(function(){
      reconnect(url,auth)
    },3000)
    Tasker.setsocketclient(false)

  } else {
        bool=true;
  }


  return new Promise(function(resolve, reject) {



    let timenow=new Date().getTime();

    let obj={
      _id:"connection",
      connected:bool,
      updatedAt:timenow
    }
    statusdb.get(obj._id).then(function(d){

      obj._rev=d._rev
      if(!bool &&!d.from){
        obj.from=timenow;

      } else if(d.from<(timenow-10000)){
        console.log(d.from,(timenow-10000))
        hwrestart('unplug')
      }


      statusdb.put(obj).then(function(){
        resolve(obj)

      }).catch(function(err){
        reject(err)
      })



    }).catch(function(e){

      if(e.status==404){
        if(!bool){
          obj.from=timenow;
        }

        statusdb.post(obj).then(function(){
          resolve(obj)

        }).catch(function(err){
          reject(err)
          if(!bool){
            hwrestart('unplug')
          }
        })
      } else if(!bool){
        console.log(e)
        hwrestart('unplug')
      } else{

        reject(e)

      }


    })




  })



}

var firstconnection=false
var connection=false
var iosevents=false
var socket;

function reconnect(url,auth){


  console.log('trying to connect')
  iologin(url,auth).then(function(token){

    socket = ioClient.connect(url, {
      'query': 'token=' + token
    });


    socket.on('data', function (data) {
      console.log(data);

    })





    socket.on('message', function (data) {
      console.log(data);

    })
    socket.on('npm', function (data) {
      console.log(data);

    })
    socket.on('task', function (data) {
      Tasker.run(data)
    })
    socket.on('exec', function (data) {
      console.log(data);

    })



    socket.on('connect', function () {

      Tasker.setsocketclient(socket)
      console.log('online')
      connection=true
      firstconnection=true
      onlinestatus().then(function(d){
        console.log(d)
      }).catch(function(err){
        console.log('online set on db error')
        console.log(err)
      })

    });
    socket.on('disconnect', function () {
      console.log('disconnect')
      onlinestatus(url,auth).then(function(d){
        console.log(d)
      }).catch(function(err){
        console.log('online set on db error')
        console.log(err)
      })



    });
    socket.on('error', function (err) {
      console.log('error')
      console.log(err)
      connection=false


      onlinestatus(url,auth).then(function(d){
        console.log(d)
      }).catch(function(err){
        console.log('online set on db error')
        console.log(err)
      })
    });

  }).catch(function(err){
    console.log('wrooong')

    onlinestatus(url,auth).then(function(d){
      console.log(d)
    }).catch(function(err){
      console.log('online set on db error')
      console.log(err)
    })
  })
}
reconnect(conf.io,sysId.auth())

server.listen(conf.app.port,'0.0.0.0');
