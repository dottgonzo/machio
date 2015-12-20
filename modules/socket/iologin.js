var Promise=require('promise');
var rpj = require('request-promise-json');




module.exports=function(url,credentials){
return new Promise(function(resolve,reject){
  rpj.post(url+'/login',credentials).then(function(a){

if(a.token){
  resolve(a.token)
} else{
  reject(a)
}
    }).catch(function(err){
      reject(err)
    })
})
}
