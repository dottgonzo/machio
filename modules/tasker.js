
var rpj=require('request-promise-json');
// var Promise=require('promise');





function Tasker(apphost){

  this.apphost=apphost;

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

Tasker.prototype.task=function(task){
// return new Promise(function(resolve, reject) {

function sendtoserver(socket){

}
function broadtoclient(socket){

}

  var taskId=task.taskId;

var socketclient=this.socketclient;
var sockethost=this.setsockethost;

rpj.post(this.apphost,task).then(function(a){
a.taskId=taskId;
if(sockethost){
sendtoserver(sockethost)
}
if(socketclient){
sendtoserver(socketclient)
}

resolve(a)
}).catch(function(err){

reject(err)

})

// })
}



module.exports=Tasker
