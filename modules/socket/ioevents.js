
var GPIOsw=require('gpio-switcher');
if(conf.gpioswitch){
  var G=new GPIOsw()

}
console.log(G.pins)

module.exports=function(socket){
  console.log('reinit')
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
    if(task.label=='switch'){
      console.log(data);

      for(var t=0;t<conf.gpioswitch.length;t++){
        if(task.pin==conf.gpioswitch[t].pin){
          G.set(conf.gpioswitch[t]).then(function(a){
            console.log('set')
            G.switch(task.pin,task.val).then(function(a){
              console.log('switch')
              G.unset(task.pin).then(function(a){
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




      console.log(data);

    }

  })
  socket.on('exec', function (data) {
    console.log(data);

  })
}
