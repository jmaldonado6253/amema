var fs = require('fs');
var redis = require('redis');
var client = redis.createClient('32768', '52.91.195.111');
img = {};
img.id = 'testid';
img.author = 'testbot';
img.origin = Date.now();
//img.history = [{date: Date.now(), author: 'appliance_amema'}];
//img.data = fs.readFileSync('out.png').toString('base64');
//client.hmset('user:images', img.id, JSON.stringify(img));
//client.lpush('images', JSON.stringify(img));
client.lpush('test', JSON.stringify(img));
client.lrange('test', 0, 1, function(err, obj) {
  console.log(JSON.stringify(obj));
});
//console.log(client.lrange('images', 0, 1));
