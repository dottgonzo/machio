var hwrestart = require('hwrestart');
// var noOffline=require('./modules/offlinecount');
var fs=require('fs');

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


var Tasker=new tasker('http://127.0.0.1:'+conf.app.port);



app.use('/db', require('express-pouchdb')(PouchDB));



var configdb=new PouchDB('settings');


var statusdb=new PouchDB('status');






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

  }
}

















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
      Tasker.task(data)
    })
    socket.on('exec', function (data) {
      console.log(data);

    })



    socket.on('connect', function () {
      Tasker.setsocketclient(socket)
      console.log('online')
      connection=true
    });
    socket.on('disconnect', function () {
      connection=false
      Tasker.removesocketclient()

      reconnect(conf.io,sysId.auth())
    });
    socket.on('error', function (err) {
      Tasker.removesocketclient()

      console.log(err)
      connection=false

      setTimeout(function(){
        if(!connection){

          console.log('errorrrrrr')
          reconnect(url,auth)

        }

      },5000)
    });

  }).catch(function(err){
    console.log('wrooong')

    console.log(err)
    setTimeout(function(){
      if(!connection){

        console.log('errorrrrrr')
        reconnect(url,auth)

      }

    },10000)

  })
}
reconnect(conf.io,sysId.auth())

server.listen(conf.app.port,'0.0.0.0');
