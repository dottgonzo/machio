




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


  })
  socket.on('exec', function (data) {
    console.log(data);

  })
}
