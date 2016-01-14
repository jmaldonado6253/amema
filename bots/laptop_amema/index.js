//
//  AmemaBot
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var Jimp = require("jimp");
var Twit = require('twit');
var async = require('async');
var shortid = require('shortid');
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
    sub.subscribe('M->L',
                  'A->L',
                  'I->L',
                  'N->L');
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
        client.hget('user:images', image_id, function(err, reply) {
          callback(null, JSON.parse(reply));
        });
      },
      function(img, callback) {
        //modify images
        var imageBuffer = new Buffer(img.data, 'base64');
        fs.writeFileSync('input.png', imageBuffer, function(err) {console.log(err);});
        client.lindex('images', 5, function(err, reply) {
          var newimagepng = JSON.parse(reply);
          var newimageBuffer = new Buffer(newimagepng.data, 'base64');
          fs.writeFileSync('newimage.png', newimageBuffer, function(err) {console.log(err);});
          callback(null, img);
        }
      },
      function(img, callback) {
        async.waterfall([

          //call diceroll function
          diceroll,

          //create mask
          createmask,

          //apply mask to image
          applymask
        ], function(err) {
             callback(null, img);
        });
      },
      function(img, callback) {
        child.execFileSync('rm', ['input.png']);
        child.execFileSync('rm', ['mask.png']);
        child.execFileSync('rm', ['newimage.png']);
        child.execFileSync('rm', ['poutput.png']);
        newimg = {};
        newimg.id = shortid.generate();
        newimg.author = 'laptop_amema';
        newimg.origin = Date.now();
        newimg.history = [{date: Date.now(), author: 'laptop_amema'}].concat(img.history);
        newimg.data = fs.readFileSync('finaloutput.png').toString('base64');
        child.execFileSync('rm', ['finaloutput.png']);
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

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function random (low, high) {
  return Math.random() * (high - low) + low;
}

/*this function is an if/else statement that allows a regular mask to be generated
50% of the time, a blurred mask 20% of the time, and an inverted mask
the remaining 30% of the time.*/

function diceroll(callback) {
  var dice = random(0,1);
  var inputimage = 'input.png';
  if (dice < 0.5 ){
    Jimp.read(inputimage, function (err, input) {
      input.greyscale()
      .brightness(random(-0.25,0.5))
      .contrast(random(0.5,1))
      .posterize(randomInt(2,20))
      .write("poutput.png"); // save
      callback(null, "poutput.png", "newimage.png");
    });
  } else if (dice > 0.5 && dice < 0.7) {

    Jimp.read(inputimage, function (err, input) {
      input.greyscale()
      .contrast(random(0,0.5))
      .posterize(randomInt(2,20))
      .blur(randomInt(1,15))
      .write("poutput.png"); // save
      callback(null, "poutput.png", "newimage.png");
    });

  } else {
    Jimp.read(inputimage, function (err, input) {
      input.greyscale()
      .contrast(random(0,1))
      .posterize(randomInt(2,20))
      .invert()
      .write("poutput.png"); // save
      callback(null, "poutput.png", "newimage.png");
    });
  }
}

function createmask(maskguide, maskimage, callback) {
  Jimp.read(maskguide, function (err, poutput) {
    if(err) console.log(err);
    Jimp.read(maskimage, function (err, newimage) {
      if (err) console.log(err);
      newimage.mask(poutput, 0, 0 )
      .write("mask.png"); // save
      callback(null, "input.png", "mask.png");
    });
  });
}

function applymask(inputimage, maskfinal, callback) {
  Jimp.read(inputimage, function (err, input) {
    Jimp.read(maskfinal, function (err, mask) {
      if (err) throw err;
      input.composite(mask, 0, 0)
      .write("finaloutput.png"); // save
      callback(null);
    });
  });
}
