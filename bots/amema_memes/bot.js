//
//  amema_memes
//  Bot control, image acquisition, selection
//
var http = require('http');
var fs = require('fs');
var shortid = require('shortid');
var async = require('async');
var child = require('child_process');

var Twit = require('twit');
var config = require('./config');
var T = new Twit(config);

var chan = require('4chanjs');
var ezimg = require('easyimage');
var FeedParser = require('feedparser');
var request = require('request');

var redis = require('redis');
var client = redis.createClient('32768', '52.91.195.111');

var tlsh = require('./tlsh');

//client.on('connect', function() {
//      console.log('connected');
//});
//
//client.on("error", function (err) {
//      console.log("Error " + err);
//});

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
	  args: ['--zoom=false', '--dreams=1', '--itern=10']
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

function select() {
  var comparisons = [];
  var images = [];
  client.lrange('images', 0, 55, function(err, imgs) {
    var history = new Tlsh();
    var images = imgs;
    client.hgetall('user:images', function(err, obj) {
      history.update(obj.tostring, obj.length - 1);
      history.finale();
      for(var i = 0; i < images.length; i++) {
        var tmp = new Tlsh();
        tmp.update(imgs[i]);
        tmp.finale();
        comparisons[i] = history.totalDiff(tmp);
      }
    });
  });
  var lowest = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
  for(var i = 0; i > comparisons.length; i++) {
    if(5 < comparisons[i] < lowest[0][1]) {
      lowest[0][0] = i;
      lowest[0][1] = comparisons[i];
      break;
    } else if(5 < comparisons[i] < lowest[1][1]) {
      lowest[1][0] = i;
      lowest[1][1] = comparisons[i];
      break;
    } else if(5 < comparisons[i] < lowest[2][1]) {
      lowest[2][0] = i;
      lowest[2][1] = comparisons[i];
      break;
    } else if(5 < comparisons[i] < lowest[3][1]) {
      lowest[3][0] = i;
      lowest[3][1] = comparisons[i];
      break;
    } else if(5 < comparisons[i] < lowest[4][1]) {
      lowest[4][0] = i;
      lowest[4][1] = comparisons[i];
      break;
    }
  };
  return [JSON.parse(images[lowest[0][0]]),
          JSON.parse(images[lowest[1][0]]),
          JSON.parse(images[lowest[2][0]]),
          JSON.parse(images[lowest[3][0]]),
          JSON.parse(images[lowest[4][0]])];
}

function order() {
  var obj = {arr: [['M'],['M'],['M'],['M'],['M'],['N'],['N'],['N'],['N']], count: {I: 11, A: 22, L: 22,}};
  var counter = 0;
  var err = false;
  while(!(obj.count.I === 0 && obj.count.A === 0 && obj.count.L === 0)) {
    for(i = 0; i < 9; i++){
      counter++;
      if(obj.count.I === 0 && obj.count.A === 0 && obj.count.L === 0) {
        break;
      }
      var nod = ['I', 'A', 'L'][Math.floor(Math.random() * 3)];
      var last = obj.arr[i][obj.arr[i].length -1];
      if((last === 'A' && obj.count.I === 0 && obj.count.L === 0) ||
         (last === 'I' && obj.count.A === 0 && obj.count.L === 0) ||
         (last === 'L' && obj.count.I === 0 && obj.count.A === 0)) {
      } else {
        while(true) {
          counter++;
          if(obj.count[nod] > 0 && nod !== last) {
            break;
          } else {
            nod = ['I', 'A', 'L'][Math.floor(Math.random() * 3)];
          }
        }
        obj.arr[i].push(nod);
        obj.count[nod] = obj.count[nod] - 1;
      }
      if(counter > 10000) {
        err = true;
        break;
      }
    }
  }
  if(err) order();
  return obj.arr;
}

function randind(arr) {
        var index = Math.floor(arr.length * Math.random());
        return arr[index];
}

function download(url, dest, cb) {
    console.log("download function entered, url is "+url);
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
    });
}

//save image at specified url to ./images as a 500x500 png
function saveimg(url, ext) {
    var tempfile = "temp" + ext;
    download(url, tempfile, function(err) {
        console.log("recieved "+url+" now attempting to save as "+tempfile);
        var filename = shortid.generate() + ".png";
        console.log("file downloaded, attempting to process and save as "+filename);
        ezimg.resize({
                src: tempfile,
                dst: "images/"+shortid.generate()+".png",
                width: 400,
                height: 400,
                ignoreAspectRatio: true
        }).then(function(image){
                fs.unlinkSync(tempfile);
                console.log("successfully modified and saved "+image.name);
        }, function(err) {
                console.log(err);
        });

    });
}

//process an oublio stream
function oublio() {
    var req = request('http://feeds.feedburner.com/oublio_twitter?format=xml'),
        feedparser = new FeedParser([]);

    req.on('error', function (error) {
        console.log(error);
    });

    req.on('response', function (res) {
        var stream = this;
        if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
        stream.pipe(feedparser);
    });

    feedparser.on('error', function(error) {
        console.log(error);
    });

    feedparser.on('readable', function() {
        // This is where the action is!
        var stream = this,
            meta = this.meta, // **NOTE** the "meta" is always available in the context of the feedparser instance
            item;
        do {
            item = stream.read();
            var separator = '"';
            console.log(item.description.split(separator)[1]);
        } while (item);
    });
}

// download the first five images from s4s
function dlchan() {
        var s4s = chan.board('s4s');
        s4s.threads(function(err, threads){
                threadno = threads[1].threads[0].no;
                console.log(threadno);
                s4s.thread(threadno, function(err, posts) {
                        rpost = randind(posts);
                        while(!rpost.tim && !rpost.ext){
                            rpost = randind(posts);
                        }
                        saveimg("http://i.4cdn.org/s4s/"+rpost.tim+rpost.ext, rpost.ext);
                });
        });
}

oublio();
