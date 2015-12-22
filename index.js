var hwrestart = require('hwrestart');
var rpj=require('request-promise-json');

// var noOffline=require('./modules/offlinecount');
var fs=require('fs');
var Promise=require('promise');
var bodyParser = require('body-parser');
var iologin=require('./modules/socket/iologin');
var ioevents=require('./modules/socket/ioevents');
var tasker=require('./modules/tasker');
var cors = require('cors');
var mkdirp = require('mkdir-p');
var pathExists = require('path-exists');
var systemId = require('system-id');
var conf=require('./conf.json');
var execSync = require('exec-sync');
var ioClient = require('socket.io-client');
if(!pathExists.sync(__dirname+'/db')){
  mkdirp.sync(__dirname+'/db')
} else{
  execSync('rm -rf /db/status/*')
}
var express = require('express'),
app     = express(),
PouchDB = require('pouchdb').defaults({prefix: './db/',auto_compaction: true});
app.use(cors());
var http = require('http');

var server = http.createServer(app);


var ioServer  = require('socket.io').listen(server);





app.use('/db', require('express-pouchdb')(PouchDB));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


var Tasker=new tasker('http://127.0.0.1:'+conf.app.port);

Tasker.setsockethost(ioServer)


var settingsdb=new PouchDB('settings');
var offlinedb=new PouchDB('offline');
var statusdb=new PouchDB('status');

Tasker.setdb("http://127.0.0.1:"+conf.app.port)

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



    console.log('configuring app '+appconf.name)


    if(pathExists.sync(__dirname+'/apps/configs/'+apps[m]+'.json')){
      var appopts=require(__dirname+'/apps/configs/'+apps[m]+'.json')

      app.use('/'+appopts.route, require(__dirname+'/apps/modules/'+apps[m]+'/'+appconf.main)(appopts.options));

    } else{
      app.use('/'+appopts.route, require(__dirname+'/apps/modules/'+apps[m]+'/'+appconf.main));

    }

    if(appopts.boot){

      if (appopts.boot.object){
        rpj.post("http://127.0.0.1:"+conf.app.port+'/'+appopts.route+'/'+appopts.boot.path,appopts.boot.object).then(function(){
          console.log('boot app '+apps[m])
        }).catch(function(err){
          console.log(err)
                  console.log('error on boot app '+apps[m])

        })
      } else {
        rpj.post("http://127.0.0.1:"+conf.app.port+'/'+appopts.route+appopts.boot.path).then(function(){
          console.log('boot app '+apps[m])
        }).catch(function(err){
          console.log(err)
                  console.log('error on boot app '+apps[m])

        })
      }

    }



  }
}


function onlinestatus(url,auth){

  bool=true

  if(!connection){
    bool=false
    setTimeout(function(){
      reconnect(url,auth)
    },3000)

  }


  return new Promise(function(resolve, reject) {



    var timenow=new Date().getTime();

    var obj={
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

function reconnect(url,auth){


  console.log('trying to connect')
  iologin(url,auth).then(function(token){

    var socket = ioClient.connect(url, {
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

      onlinestatus(url,auth).then(function(d){
        console.log(d)
      }).catch(function(err){
        console.log('online set on db error')
        console.log(err)
      })

      Tasker.removesocketclient()

    });
    socket.on('error', function (err) {
      Tasker.removesocketclient()

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
