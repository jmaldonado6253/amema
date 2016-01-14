//
//  amema_memes
//  Bot control, image acquisition, selection
//
var fs = require('fs');
var shortid = require('shortid');
var async = require('async');
var schedule = require('node-schedule');

var Twit = require('twit');
var config = require('./config');
var T = new Twit(config);

var redis = require('redis');
var client = redis.createClient('6379', 'redis');

var Tlsh = require('./tlsh');
var filenames = fs.readdirSync('/data/');

client.on('connect', function() {
      console.log('connected');
});

client.on("error", function (err) {
      console.log("Error " + err);
});

function select(cb) {
  client.lrange('images', 0, 55, function(err, imgs) {
    console.log("got images");
    client.hgetall('user:images', function(err, obj) {
      var i = 0;
      var comparisons = [];
      var images = [];
      var history = new Tlsh();
      var keys = Object.keys(obj);
      for(i = 0; i < keys.length; i++) {
        var key = JSON.parse(obj[keys[i]]);
        keys[i] = JSON.stringify(key.history) + " " + key.id;
        console.log(keys[i]);
      }
      history.update(keys.toString(), keys.toString().length);
      history.finale();
      for(i = 0; i < imgs.length; i++) {
        var tmp = new Tlsh();
        tmp.update(imgs[i], imgs[i].length);
        tmp.finale();
        comparisons[i] = history.totalDiff(tmp);
      }
      console.log(comparisons);
      var lowest = [[0, 2000], [0, 2000], [0, 2000], [0, 2000], [0, 2000]];
      console.log("huh");
      for(i = 0; i < comparisons.length; i++) {
        console.log(lowest);
        if(comparisons[i] < lowest[0][1]) {
          lowest[0][0] = i;
          lowest[0][1] = comparisons[i];
        } else if(comparisons[i] < lowest[1][1]) {
          lowest[1][0] = i;
          lowest[1][1] = comparisons[i];
        } else if(comparisons[i] < lowest[2][1]) {
          lowest[2][0] = i;
          lowest[2][1] = comparisons[i];
        } else if(comparisons[i] < lowest[3][1]) {
          lowest[3][0] = i;
          lowest[3][1] = comparisons[i];
        } else if(comparisons[i] < lowest[4][1]) {
          lowest[4][0] = i;
          lowest[4][1] = comparisons[i];
        }
      }
      var result = [JSON.parse(imgs[lowest[0][0]]).id,
                    JSON.parse(imgs[lowest[1][0]]).id,
                    JSON.parse(imgs[lowest[2][0]]).id,
                    JSON.parse(imgs[lowest[3][0]]).id,
                    JSON.parse(imgs[lowest[4][0]]).id];
      cb(null, result);
    });
  });
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

function processControl(cont) {
  for(var i = 0; i < cont.length; i++) {
    for(var p = 0; p < cont[i].length-1; p++) {
      cont[i][p] = cont[i][p] + "->" + cont[i][p+1];
    }
  }
  return cont;
}

function pullFromFile(cb) {
  img = {};
  img.id = shortid.generate();
  img.author = 'external';
  img.origin = Date.now();
  img.history = [{date: Date.now(), author: 'external'}];
  img.data = fs.readFileSync('/data/'+filenames.pop()).toString('base64');
  client.hset('user:images', img.id, JSON.stringify(img), function(err, res) {
    client.lpush('images', JSON.stringify(img), function(err, res) {
      console.log("pulled image: " + img.id);
      cb(null, img.id);
    });
  });
}

function initiate() {
  //generate control
  async.series([
      function(callback) {pullFromFile(callback);},
      function(callback) {pullFromFile(callback);},
      function(callback) {pullFromFile(callback);},
      function(callback) {pullFromFile(callback);},
      function(callback) {select(callback);}
  ], function(err, res) {
    var lastarr = [];
    lastarr[0] = res[0];
    lastarr[1] = res[1];
    lastarr[2] = res[2];
    lastarr[3] = res[3];
    lastarr = lastarr.concat(res[4]);
    cont = processControl(order());
    for(var i = 0; i < cont.length; i++) {
      client.publish(cont[i][0], JSON.stringify([lastarr[i], cont[i].slice(1)]));
  });
}

var j = schedule.scheduleJob('0 * * * *', function(){
initiate();
});
