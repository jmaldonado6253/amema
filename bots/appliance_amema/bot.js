//
//  appliance_amema
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var shortid = require('shortid');
var async = require('async');
var child = require('child_process');
var pyshell = require('python-shell');
var gm = require('gm');

var Twit = require('twit');
var config = require('./config');
var T = new Twit(config);

var redis = require('redis');
var sub = redis.createClient('32768', '52.91.195.111');
var client = redis.createClient('32768', '52.91.195.111');
var control =  null;

client.on('connect', function() {
      console.log('connected');
});

client.on("error", function (err) {
      console.log("Error " + err);
});

sub.on('connect', function() {
    sub.subscribe('control');
    sub.subscribe('M->A',
                  'I->A',
                  'L->A',
                  'N->A');
});

sub.on('message', function(channel, message) {
  if(message === 'control') {
    control = message;
  } else {
    newid = modify(message);
    sendNextImage(newid);
  }
});

function sendNextImage(image_id) {
  client.publish(control.pop(), image_id);
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
        var options = {
          mode: 'text',
	  pythonPath: '/usr/bin/python',
	  pythonOptions: ['-u'],
	  scriptPath: '/opt/deepdreamer/',
	  args: ['--zoom=false', '--dreams=1']
	};
        pyshell.run('deepdreamer.py', options, function(err, results) {
          if(err) throw err;
          console.log('results %j', results);
          callback(null, img);
        });
      },
      function(img, callback) {
        child.execFileSync('rm', ['in.png']);
        gm('in.png_0.jpg').write('out.png', function (err) {
          if (!err) callback(null, img);
        });
      },
      function(img, callback) {
        newimg = {};
        newimg.id = shortid.generate();
        newimg.author = 'appliance_amema';
        newimg.origin = Date.now();
        newimg.history = [{date: Date.now(), author: 'appliance_amema'}].concat(img.history);
        newimg.data = fs.readFileSync('out.png').toString('base64');
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
         return result;
       }
  });
}
