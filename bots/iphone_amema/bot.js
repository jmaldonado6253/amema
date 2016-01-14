//
//  iphone_amema
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var shortid = require('shortid');
var async = require('async');
var child = require('child_process');

var Twit = require('twit');
var config = require('./config');
var T = new Twit(config);

var redis = require('redis');
var sub = redis.createClient('6379', 'redis');
var client = redis.createClient('6379', 'redis');
var control =  null;

client.on('connect', function() {
      console.log('connected');
});

client.on("error", function (err) {
      console.log("Error " + err);
});

sub.on('connect', function() {
    sub.subscribe('M->I',
                  'A->I',
                  'L->I',
                  'N->I');
});

sub.on('message', function(channel, message) {
    msg = JSON.parse(message);
    control = msg[0];
    modify(msg[1]);
});

function sendNextImage(image_id) {
  client.publish(control[0], JSON.stringify([image_id, control.slice(1)]));
}

function modify(image_id) {
  async.waterfall([
      function(callback) {
        client.get(image_id, function(err, reply) {
          callback(null, JSON.parse(reply));
        });
      },
      function(img, callback) {
        //modify images
        var imageBuffer = new Buffer(img.data, 'base64');
        fs.writeFileSync('in.png', imageBuffer, function(err) {console.log(err);});
        child.execFileSync('/usr/src/app/badpng/badpng', ['in.png', 'out.png']);
        child.execFileSync('rm', ['in.png']);
        newimg = {};
        newimg.id = shortid.generate();
        newimg.author = 'iphone_amema';
        newimg.origin = Date.now();
        newimg.history = [{date: Date.now(), author: 'iphone_amema'}].concat(img.history);
        newimg.data = fs.readFileSync('out.png').toString('base64');
        child.execFileSync('rm', ['out.png']);
        callback(null, newimg);
      },
      function(img, callback) {
        //post to twitter
        T.post(
          'media/upload',
          { media_data: img.data },
          function (err, data, response) {
            var mediaIdStr = data.media_id_string;
            var params = { status: '#amema', media_ids: [mediaIdStr] };

            T.post('statuses/update', params, function (err, data, response) {
              console.log(data);
            });
            console.log("something should have happened by now");
          }
        );
        callback(null, img);
      },
      function(img, callback) {
        //save to db
        client.hmset('user:images', img.id, JSON.stringify(img));
        client.lpush('images', JSON.stringify(img));
        callback(null, img.id);
      }
  ], function(err, result) {
       if(err) {
         console.log("Err: " + err);
       } else {
         sendNextImage(result);
       }
  });
}
