var mongojs = require('mongojs');
var moment = require('moment');
var async = require('async');

var data = require('./loopd.js');
// var db = mongojs('mongodb://128.199.223.114:27017/loopd');
var db = mongojs('mongodb://localhost:27017/loopd');

// console.log(data);

async.eachLimit(data, 10, function (item, callback){
    item.time = new Date(item.time);
    item.createdAt = new Date(item.createdAt);
    item.updatedAt = new Date(item.updatedAt);
    db.collection('test').insert(item, function (err, doc){
        if(err){
            console.log(err);
        }
        callback();
    });
}, 
function (err){
    if(err){
        console.log(err);
        process.exit();
    }

    console.log('done!');
    process.exit();
});