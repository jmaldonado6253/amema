//
//  iphone_amema
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var shortid = require('shortid');
var async = require('async');
var schedule = require('node-schedule');
var child = require('child_process');
var gm = require('gm');

var Twit = require('twit');
var config = require('./config');
var T = new Twit(config);

var redis = require('redis');
//var client = redis.createClient('6379', 'redis');
//
//client.on('connect', function() {
//      console.log('connected');
//});
//
//client.on("error", function (err) {
//      console.log("Error " + err);
//});

async.waterfall([
    function(callback) {
      //get image
      //client.get
    },
    function(img, callback) {
      //modify images
      gm('/usr/src/app/in.jpg')
        .write('/usr/src/app/in.png', function (err) {
          if (err) console.log(err);
      });
      child.execFile('/usr/src/app/badpng/badpng', ['in.png', 'out.png']);
      child.execFile('rm', ['in.png']);
      gm('/usr/src/app/out.png')
        .write('/usr/src/app/out.jpg', function (err) {
          if (err) console.log(err);
      });
    },
    function(img, callback) {
      //post to twitter
      var b64content = fs.readFileSync('/usr/src/app/out.jpg', { encoding: 'base64' });
      T.post(
        'media/upload',
        { media_data: b64content },
        function (err, data, response) {
          var mediaIdStr = data.media_id_string;
          var params = { status: '#', media_ids: [mediaIdStr] };

          T.post('statuses/update', params, function (err, data, response) {
            console.log(data);
          });
          console.log("something should have happened by now");
        }
      );
    },
    function(img, callback) {
      //save to db
      client.incr('id:images');
      client.hmset('user:' + client.get('id:images'),
      client.lpush('images', JSON.stringify(img), callback);
    }
], function(err, result) {
     if(err) {
       console.log("Err: " + err);
     } else {
       console.log("Result: " + err);
     }
});

var curimgid = shortid.generate();

function createnewimg(curimgid) {
  db[curimgid] = {};
  db[curimgid].author = 'testbot';
  db[curimgid].origin = Date.now();
  db[curimgid].history = [{date: Date.now(), author: 'testbot'}];
}

function postTweet(status, callback) {
  var b64content = fs.readFileSync('/Users/Zak/Documents/amema\ node/node_modules/twit/test.jpeg', { encoding: 'base64' });
  console.log("file read in");
  T.post(
    'media/upload',
    { media_data: b64content },
    function (err, data, response) {
      var mediaIdStr = data.media_id_string;
      var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] };

      T.post('statuses/update', params, function (err, data, response) {
        console.log(data);
      });
      console.log("something should have happened by now");
    });
}

var job = schedule.scheduleJob('30 * * * * *', function(){
  console.log("still alive!");
});
