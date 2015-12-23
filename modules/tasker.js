
var rpj=require('request-promise-json');




function sendtoserver(socket){
  if(socket){
    socket.emit(obj._id, obj);
  }
}
function broadtoclients(socket,task,obj){
if(socket){
  socket.emit(task, obj);
}
}


function Tasker(apphost){

  this.apphost=apphost;

}


Tasker.prototype.save=function(obj){


}
Tasker.prototype.send=function(obj){

sendtoserver(this.socketclient,obj)

}
Tasker.prototype.broadcast=function(task,obj){
broadtoclients(this.sockethost,task,obj)


}
Tasker.prototype.setstatus=function(obj){


}
Tasker.prototype.executed=function(task,obj){

sendtoserver(this.socketclient,task,obj)
broadtoclients(this.socketclient,task,obj)

}
Tasker.prototype.setdb=function(db){

this.db=db

}
Tasker.prototype.run=function(task,obj){
// return new Promise(function(resolve, reject) {




var socketclient=this.socketclient;
var sockethost=this.sockethost;

rpj.post(this.apphost+'/'+task,obj).then(function(a){


sendtoserver(socketclient,task,a)

broadtoclients(sockethost,task,a)


resolve(a)
}).catch(function(err){

reject(err)

})

// })
}

Tasker.prototype.setsockethost=function(socket){

  this.sockethost=socket

}
Tasker.prototype.removesockethost=function(){

  this.sockethost=false

}
Tasker.prototype.removesocketclient=function(){

  this.socketclient=false

}
Tasker.prototype.setsocketclient=function(socket){
  this.socketclient=socket;


}

module.exports=Tasker
