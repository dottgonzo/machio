
var rpj=require('request-promise-json');




function sendtoserver(socket){

}
function broadtoclients(socket){

}


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
Tasker.prototype.save=function(obj){


}
Tasker.prototype.send=function(obj){

sendtoserver(this.socketclient,obj)

}
Tasker.prototype.broadcast=function(obj){
broadtoclients(this.socketclient,obj)


}
Tasker.prototype.setstatus=function(obj){


}
Tasker.prototype.executed=function(obj){

sendtoserver(this.socketclient,obj)
broadtoclients(this.socketclient,obj)

}
Tasker.prototype.setdb=function(db){

this.db=db

}
Tasker.prototype.run=function(task){
// return new Promise(function(resolve, reject) {


  var taskId=task.taskId;

var socketclient=this.socketclient;
var sockethost=this.sockethost;

rpj.post(this.apphost,task).then(function(a){
a.taskId=taskId;

sendtoserver(socketclient,a)

broadtoclients(sockethost,a)


resolve(a)
}).catch(function(err){

reject(err)

})

// })
}



module.exports=Tasker
