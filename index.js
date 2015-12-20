var hwrestart = require('hwrestart');
var noOffline=require('./modules/offlinecount');
var iologin=require('./modules/socket/iologin');
var ioevents=require('./modules/socket/ioevents');
var mkdirp = require('mkdir-p');
var pathExists = require('path-exists');
var systemId = require('system-id');
var conf=require('./conf.json');
var execSync = require('exec-sync');
var io = require('socket.io-client');
if(!pathExists.sync(__dirname+'/db')){
  mkdirp.sync(__dirname+'/db')
} else{
  execSync('rm -rf /db/status/*')
}
var express = require('express'),
app     = express(),
PouchDB = require('pouchdb').defaults({prefix: './db/',auto_compaction: true});

app.use('/db', require('express-pouchdb')(PouchDB));
var configdb=new PouchDB('settings');


var statusdb=new PouchDB('status');


//execSync('rm -rf systemid/*')  // to be removed

var sysId=new systemId({path:__dirname+'/systemid',tracker:true});

//sysId.validate(sysId.serial,{
//  user:'slmach_ingcarusoa_4iy5tg',
//  password:'2esgh27eu1bb',
//  db:'mach_sufjt5_energytrack'
// }) // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!to be removed



app.get('/switch/', function (req, res) {
res.json(req.params)
console.log(data);
G.set({
  pin:17,
  direction:'out',
  normal:true,
  group:'gpio'
}).then(function(a){
  console.log('set')
  G.switch(data).then(function(a){
    console.log('switch')
    G.unset(17).then(function(a){
      console.log('ok')
    }).catch(function(err){
      console.log(err)
    })
  }).catch(function(err){
    console.log(err)
  })
}).catch(function(err){
  console.log(err)

})

});

app.get('/switch/:pin/:val', function (req, res) {
res.json(req.params)

    console.log(data);

    for(var t=0;t<conf.gpioswitch.length;t++){
      if(req.params.pin==conf.gpioswitch[t].pin){
        G.set(conf.gpioswitch[t]).then(function(a){
          console.log('set')
          G.switch(req.params.pin,req.params.val).then(function(a){
            console.log('switch')
            G.unset(req.params.pin).then(function(a){
              console.log('ok')
            }).catch(function(err){
              console.log(err)
            })
          }).catch(function(err){
            console.log(err)
          })
        }).catch(function(err){
          console.log(err)

        })

      }
    }





});




var connection=false
var iosevents=false

  function reconnect(url,auth){
    console.log('trying to connect')
    iologin(url,auth).then(function(token){

    var socket = io.connect(url, {
      'query': 'token=' + token
    });


    socket.on('connect', function () {
      console.log('online')
      connection=true
      if(!iosevents){
        iosevents=true
        ioevents(socket)
      }
    });
    socket.on('disconnect', function () {
      connection=false
      reconnect(conf.io,sysId.auth())
    });
    socket.on('error', function (err) {
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
app.listen(conf.app.port);
