var http = require('http');
var fs = require('fs');
var shortid = require('shortid');
var chan = require('4chanjs');
var ezimg = require('easyimage');

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
                width: 500,
                height: 500,
                ignoreAspectRatio: true
        }).then(function(image){
                fs.unlinkSync(tempfile);
                console.log("successfully modified and saved "+image.name);
        }, function(err) {
                console.log(err);
        });

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
                        console.log("attempting to save "+rpost.tim+rpost.ext);
                });
        });
}

dlchan();
