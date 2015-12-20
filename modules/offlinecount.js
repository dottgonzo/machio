var rpj = require('request-promise-json');
var timerdaemon = require('timerdaemon');
var offline=0;

module.exports=function(db,retry,timeout){

  if(!retry){
    retry=10
  } else if (!timeout) {
    timeout=40
  }

  timerdaemon.post(function(){
    rpj.get(db).then(function(doc){
      if(doc.internet){
        offline=0
      } else {
        if(offline>timeout){
          hwrestart('unplug')
        } else {
          offline=offline+retry
        }
      }
    }).catch(function(err){
      console.log(err)
    })

  },retry*1000)

}
