const request = require('request');

const PAGE_ACCESS_TOKEN = 'EAAcaq8rzMQoBAFaLy5VCQY12ETE7Yg1DKlXotx9vYvS4vZBzcx5KZCCnIwevuQB65Pb4ZBBpq6mcQUAtA7TfpbZAxo4w8ELQLQt7PftwjkZBBKd4D4FJz3ZAaBQAx7tYjDVLmXZADQZBoVgyZCAgvPCe2IX6aaFyvVjAEYi5VXuurZCgZDZD';

module.exports.sendRequest = function(sender, messageData) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function (err, response, body) {
        if (err) {
            console.log("sending error");
            console.log(err);
        } else if (response.body.error) {
            console.log("response body error");
            console.log(response.body.error);
        }
    })
}

module.exports.sendRequestcall = function (sender, messageData, callback) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function (err, response, body) {
        if (err) {
            console.log("sending error");
            console.log(err);
        } else if (response.body.error) {
            console.log("response body error");
            console.log(response.body.error);
        }
        else {
            callback();
        }
    })
}

module.exports.sendRequestasync = function (sender, messageData) {
	return new Promise(function(resolve, reject) {
	    request({
	        url: "https://graph.facebook.com/v2.6/me/messages",
	        qs: {access_token: PAGE_ACCESS_TOKEN},
	        method: "POST",
	        json: {
	            recipient: {id: sender},
	            message: messageData
	        }
	    }, function(err, resp, body){
	    	if (err) { reject(err); }
      		else { resolve({resp: resp, body: body}); }
	    });
    });
}

module.exports.getProfile = function (PSID, callback){
    let link = "https://graph.facebook.com/v2.6/" + PSID + "?fields=first_name,last_name,profile_pic&access_token=" +PAGE_ACCESS_TOKEN;
    //console.log(link);
    let name;
    request(link, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log(JSON.parse(body, null, 2));
        let info = JSON.parse(body, null, 2);
        //console.log(JSON.parse(response, null, 2));// Print the HTML for the Google homepage.
        console.log(info.first_name);
        console.log(info.last_name);

        console.log(info);
        if(body){
            name= {
                first_name: info.first_name,
                last_name: info.last_name
            };
        }
        callback(name);
    });
}