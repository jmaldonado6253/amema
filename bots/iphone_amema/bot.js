//
//  iphone_amema
//  Service to periodically get, modify and post images
//
var fs = require('fs');
var Twit = require('twit');
var async = require('async');
var shortid = require('shortid');
var config = require('./config');
var T = new Twit(config);

var dbpath = './amemadb.json';

var db = JSON.parse(fs.readFileSync(dbpath, 'utf8'));

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