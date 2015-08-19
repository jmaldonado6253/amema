//
//  AmemaBot
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var Twit = require('twit');
var async = require('async');
var shortid = require('shortid');
var cv = require('opencv');
var config = require('./config');
var T = new Twit(config);

var dbpath = './amemadb.json';

var db = JSON.parse(fs.readFileSync(dbpath, 'utf8'));

//compareImages takes two filenames as strings and returns an integer from 1 to 100 based on the similarity of the histograms
function compareImages(base, test) {
	cv.readImage(base, function(err, imbase) {
		if (err) throw err;
		cv.readImage(base, function(err, imtest) {
			if (err) throw err;
			cv.ImageSimilarity(imbase, imtest, function(err, dissim){
				if (err) throw err;
				console.log('SCORE::: ', dissim);
			});
		});
	});
}


//TODO get and modify images

var curimgid = shortid.generate();
function createnewimg(curimgid) {
  db[curimgid] = {};
  db[curimgid].author = 'testbot';
  db[curimgid].origin = Date.now();
  db[curimgid].history = [{date: Date.now(), author: 'testbot'}];
}



fs.writeFile(dbpath, JSON.stringify(db, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + dbpath);
      }
});



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

postTweet = function (status, callback) {
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
};


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
