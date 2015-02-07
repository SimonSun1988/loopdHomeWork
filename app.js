var express = require('express');
var app = express();
var mongojs = require('mongojs');
var moment = require('moment');
var async = require('async');

var db = mongojs('mongodb://localhost:27017/loopd');

// http://0.0.0.0:3000/receives/1/visitTime?from=2015-01-06T14:05&to=2015-01-07T14:05&byMins=15

app.get('/receives/:receiver_id/visitTime', function(req, res) {
    var receiver_id = req.params.receiver_id;
    var from = req.query.from;
    var to = req.query.to;
    var byMins = req.query.byMins;

    async.waterfall([

        function(cb) {

            var query = {};

            if (receiver_id) {
                query.receiver_id = receiver_id;
            }

            if (from) {
                if (!query.createdAt) {
                    query.createdAt = {};
                }
                query.createdAt.$gte = new Date(from);
            }

            if (to) {
                if (!query.createdAt) {
                    query.createdAt = {};
                }
                query.createdAt.$lte = new Date(to);
            }

            cb(null, query);
        },

        function (query, cb) {
            console.log(query);
            db.collection('test').aggregate([
                {
                    $match : query
                },
                {
                    $group: {
                        _id: {
                            year: {
                                $year: '$createdAt'
                            },
                            month: {
                                $month: '$createdAt'
                            },
                            day: {
                                $dayOfMonth: '$createdAt'
                            },
                            hour: {
                                $hour: '$createdAt'
                            },
                            minutes: {
                                $minute: '$createdAt'
                            }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                },
                { 
                    $sort: { 
                        _id : 1
                    }
                }
            ], cb);
        },

        function (docs, cb){
            console.log(docs);
            var allAggregate = [];
            docs.forEach(function (item){
                var year = item._id.year;
                var month = item._id.month;
                var day = item._id.day;
                var hour = item._id.hour;
                var minutes = item._id.minutes;
                var count = item.count;
                var timeFormat = moment({ y: year, M: month, d: day, h :hour, m: minutes});
                allAggregate.push({
                    atTime: timeFormat,
                    results: count
                });
            });

            cb(null, allAggregate);
        },

        function (allAggregate, cb){
            var startTime = moment(req.query.from);
            var endTime = moment(req.query.to);

            var records = [];
            if(startTime.add(parseInt(byMins), 'minutes') >= endTime){
                var count = 0;
                allAggregate.forEach(function (item){
                    count += item.results;
                    console.log(count);
                });

                records.push({
                    atTime: startTime, 
                    results: count
                });

                return cb(null, records);
            }

            var obj = {
                go: moment(req.query.from),
                counter: 0
            };

            var begin = obj.go;

            allAggregate.forEach(function (item){

                var itemTime = item.atTime.add(-1, 'month');
                if(obj.go > itemTime){
                    obj.counter += item.results;
                }else{
                    records.push({
                        atTime: obj.go.format('YYYY/MM/DD hh:mm'),
                        results: obj.counter
                    });

                    begin = obj.go.add(parseInt(byMins, 10), 'minutes');
                    obj.counter = 0;
                    obj.counter += item.results;
                }
            });

            return cb(null, records);
        }
    ], function(err, docs) {
        if (err) {
            return res.json({
                err: err
            });
        }

        return res.json(docs);
    });
});

app.listen(3000);