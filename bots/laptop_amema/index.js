//
//  AmemaBot
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var Jimp = require("jimp");
var Twit = require('twit');
var async = require('async');
var shortid = require('shortid');
//var config = require('./config');
//var T = new Twit(config);

//var dbpath = './amemadb.json';

//var db = JSON.parse(fs.readFileSync(dbpath, 'utf8'));

//TODO get and modify images

/*
var curimgid = shortid.generate();
function createnewimg(curimgid) {
db[curimgid] = {};
db[curimgid].author = 'testbot';
db[curimgid].origin = Date.now();
db[curimgid].history = [{date: Date.now(), author: 'testbot'}];
}
*/

/*
fs.writeFile(dbpath, JSON.stringify(db, null, 4), function(err) {
if(err) {
console.log(err);
} else {
console.log("JSON saved to " + dbpath);
}
});

*/

//create a randomInt function

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

//create a random floating point function

function random (low, high) {
  return Math.random() * (high - low) + low;
}

//generate a random floating point variable


/*this function is an if/else statement that allows a regular mask to be generated
50% of the time, a blurred mask 20% of the time, and an inverted mask
the remaining 30% of the time.*/

function diceroll(callback) {
  var dice = random(0,1);
  var inputimage = 'input.png';
  if (dice < 0.5 ){
    Jimp.read(inputimage, function (err, input) {
      input.greyscale()
      .brightness(random(-.25,.5))
      .contrast(random(0.5,1))
      .posterize(randomInt(2,20))
      .write("poutput.png"); // save
      callback(null, "poutput.png", "newimage.png");
    });
  } else if (dice > 0.5 && dice < 0.7) {

    Jimp.read(inputimage, function (err, input) {
      input.greyscale()
      .contrast(random(0,.5))
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

//beginning of async series

async.waterfall([

  //call diceroll function
  diceroll,

  //create mask
  createmask,

  //apply mask to image
  applymask
]);

//  var exec = require('child_process').exec;
//  var cmd = "/home/javier/badpng/badpng \
//  /home/javier/amema/images/used/#{img} \==
//  /home/javier/amema/images/used/#{outputname}.png";

// exec(cmd, function(error, stdout, stderr) {
// command output is in stdout
// });
// }

//
//  post a tweet
//

/*postTweet = function (status, callback) {
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
console.log("something should have happened by now");    });
};
*/

//function randIndex (arr) {
//  var index = Math.floor(arr.length*Math.random());
//  return arr[index];
//}


////the big daddy function, which contains in its waterfall all the lil functions

// run = function() {
//  async.waterfall([
//    getImage
//    modifyImage
//  ],
//  function(err, botData) {
//    if (err) {
//      console.log('There was an error posting to Twitter: ', err);
//    } else {
//      console.log('Tweet successful!');
//      console.log('Tweet: ', botData.tweetBlock);
//    }
//    console.log('Base tweet: ', botData.baseTweet);
//  });
// }


// setInterval(function() {
//  try {
//    run();
//  }
//  catch (e) {
//    console.log(e);
//  }
// }, 60000 * 60);
