
const rpj = require('request-promise-json');
import Couchjson=require('couchjsonconf');


const couchjsonconf=new Couchjson({hostname:"test"});



function sendtoserver(socket,task,obj):void{
  if(socket){
    socket.emit(obj._id, obj);
  }
}
function broadtoclients(socket,task,obj):void{
if(socket){
  socket.emit(task, obj);
}
}


function Tasker(apphost){

  this.apphost=apphost;

}


Tasker.prototype.save=function(task,obj){




}
Tasker.prototype.send=function(task,obj){

sendtoserver(this.socketclient,task,obj)

}
Tasker.prototype.broadcast=function(task,obj){
broadtoclients(this.sockethost,task,obj)


}
Tasker.prototype.setstatus=function(task,obj){


}
Tasker.prototype.executed=function(task,obj){

sendtoserver(this.socketclient,task,obj)
broadtoclients(this.socketclient,task,obj)

}
Tasker.prototype.setdb=function(pouchdb,db){

// this.db={
//  db:couchjsonconf(db),
//  memo:pouchdb('memo'),
//  config:pouchdb('config'),
//  status:pouchdb(db+'status')
// }

}
Tasker.prototype.run=function(task,obj){
 return new Promise(function(resolve, reject) {




var socketclient=this.socketclient;
var sockethost=this.sockethost;

rpj.post(this.apphost+'/'+task,obj).then(function(a){


sendtoserver(socketclient,task,a)

broadtoclients(sockethost,task,a)


resolve(a)
}).catch(function(err){

reject(err)

})

 })
}

Tasker.prototype.setsockethost=function(socket){

  this.sockethost=socket

}
Tasker.prototype.setsocketclient=function(socket){
  this.socketclient=socket;


}

module.exports=Tasker
