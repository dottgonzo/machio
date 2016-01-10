import * as Promise from "bluebird";
let rpj = require('request-promise-json');



export=function(url:string,credentials:{}){
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
