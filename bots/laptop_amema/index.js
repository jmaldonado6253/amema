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
};

//create a random floating point function

function random (low, high) {
    return Math.random() * (high - low) + low;
	
};

//generate a random floating point variable

var dice1 = random(0,1);

/*this function is an if/else statement that allows a regular mask to be generated
50% of the time, a blurred mask 20% of the time, and an inverted mask
the remaining 30% of the time.*/

function diceroll(dice, inputimage) {
	if (dice < .5 ){
Jimp.read(inputimage, function (err, input) {
	input.greyscale()
		.brightness(random(-.5,1))
		.contrast(random(.5,1))
		.posterize(randomInt(2,20))
		.write("poutput.png"); // save
		
})
	
	
} else if (dice > .5 && dice < .7) {
	
Jimp.read(inputimage, function (err, input) {
	input.greyscale()
		.contrast(random(0,1))
		.posterize(randomInt(2,20))
		.blur(randomInt(1,15))
		.write("poutput.png"); // save
		
})
	
} else {
	Jimp.read(inputimage, function (err, input) {
	input.greyscale()
		.contrast(random(0,1))
		.posterize(randomInt(2,20))
		.invert()
		.write("poutput.png"); // save
	})
		}
};

function createmask(maskguide, maskimage) {

Jimp.read(maskguide, function (err, poutput) {
Jimp.read(maskimage, function (err, newimage) {
    if (err) throw err;
	newimage.mask(poutput, 0, 0 )
         .write("mask.png"); // save 
	});
})
}

function applymask(inputimage, maskfinal) {
	Jimp.read(inputimage, function (err, input) {
	Jimp.read(maskfinal, function (err, mask) {
    if (err) throw err;
	input.composite(mask, 0, 0)
         .write("finaloutput.png"); // save 
	});
})
}

//beginning of async series

async.series([

//call diceroll function
diceroll(dice1, "input.png"),

//create mask
createmask("poutput.png", "newimage.png"),

//apply mask to image
	
applymask("input.png", "mask.png")

	
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
