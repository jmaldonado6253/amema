//
//  Bot
//  class for performing various twitter actions
//
var Twit = require('../lib/twitter');
var async = require('async');
var Bot = require('./bot')
  , config1 = require('../config1');

var Bot = module.exports = function(config) {
  this.twit = new Twit(config);
};


//
//  get image
//
getImage = function




//
// modify image
//
modifyImage = function (in, out) {

  var exec = require('child_process').exec;
  var cmd = "/home/javier/badpng/badpng \
  /home/javier/amema/images/used/#{img} \==
  /home/javier/amema/images/used/#{outputname}.png";

exec(cmd, function(error, stdout, stderr) {
  // command output is in stdout
});


}





//
//  post a tweet
//

postTweet = function (status, callback) {
  var b64content = fs.readFileSync('/path/to/img', { encoding: 'base64' })
  if(typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'));
  } else if(status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    var mediaIdStr = data.media_id_string
    var params = { status: media_ids: [mediaIdStr] }

    T.post('statuses/update', params, function (err, data, response) {
      console.log(data)
    })
  })
  })



function randIndex (arr) {
  var index = Math.floor(arr.length*Math.random());
  return arr[index];
}


////the big daddy function, which contains in its waterfall all the lil functions

run = function() {
  async.waterfall([
    getImage
    modifyImage
    postTweet
  ],
  function(err, botData) {
    if (err) {
      console.log('There was an error posting to Twitter: ', err);
    } else {
      console.log('Tweet successful!');
      console.log('Tweet: ', botData.tweetBlock);
    }
    console.log('Base tweet: ', botData.baseTweet);
  });
}


setInterval(function() {
  try {
    run();
  }
  catch (e) {
    console.log(e);
  }
}, 60000 * 60);
