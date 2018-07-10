const NodeGeocoder = require('node-geocoder');
const resTem = require('../templates/genRestaurantTemplate');
const foodTem = require('../templates/genFoodTemplate');
const genWhat = require('../templates/genWhatToDo');
const genLoc = require('../templates/genGetLocation');
const genCart = require('../templates/genCartTemplate');
const pipeline = require('./pipeline');
const postback = require('./postbacks');
const request = require('./requests');
const actions= require('./actions');


module.exports.messagesProcessor = function (sender, message) {
    if (message.attachments && message.attachments[0].type === 'location') {
        let options = {
            provider: 'google',
            apiKey: 'AIzaSyBeMeLnG6dPdAmOnhNeIyBZhYgsY9HGGbw'
        };
        const geocoder = NodeGeocoder(options);
        let lat = message.attachments[0].payload.coordinates.lat;
        let lng = message.attachments[0].payload.coordinates.long;

        if (!pipeline.data[sender].location.address && pipeline.data[sender].foods.length===0) {

            console.log(lat + ' ' + lng);

            geocoder.reverse({lat: lat, lon: lng},
                function (err, res) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(res);
                    console.log(res[0].formattedAddress);
                    console.log(res[0].zipcode);
                    locationProcessor(sender, res[0].formattedAddress, res[0].zipcode, res[0].extra.neighborhood);
                });
        }
        else if(!pipeline.data[sender].location.address && pipeline.data[sender].foods.length>0){
            console.log(lat + ' ' + lng);

            geocoder.reverse({lat: lat, lon: lng},
                function (err, res) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(res);
                    console.log(res[0].formattedAddress);
                    console.log(res[0].zipcode);
                    pipeline.data[sender].location.address = res[0].formattedAddress;
                    let messageData= {text: 'The location is traced from get location ' + res[0].formattedAddress + ', full confirmation, no action'};
                    messageData= {text: 'Your address is ' + res[0].formattedAddress};
                    request.sendRequestcall(sender, messageData, function () {
                        request.sendRequest(sender, {text: "Give me a phone number to find you and we'll be done"});
                    });

                });
        }
    }

    else if (message.quick_reply) {
        console.log('quick reply :' + message.quick_reply.payload);
        if (message.quick_reply.payload === 'ORDER_FOOD') {
        }
        else if(message.quick_reply.payload === 'GET_ORDER'){
            request.sendRequest(sender, {text: 'done'});
        }
        else {
            let res = message.quick_reply.payload.split("_");
            if(res[0]=== 'REGION'){
                locationProcessor(sender, null, res[2], res[1]);
            }
        }
    }

    else if (message.text) {
        //getProfile(sender);
        console.log('text : ' + message.text);
    }
};

function locationProcessor(sender, address, zipcode, region) {
    if(!address && region && zipcode){
        let messageData = {text: "I'm loading restaurants from "+ region + " for you..."};
        request.sendRequestcall(sender, messageData, function () {
            resTem.genRestaurantByRegion(region, 0, function (err, results) {
                if (err) throw err;
                else {
                    if (results.attachment.payload.elements.length > 1) {
                        pipeline.data[sender].location = {
                            zip: zipcode,
                            region: region,
                            confirmed: false,
                            value: true
                        };
                        pipeline.data[sender].restaurant.index+=1;
                        request.sendRequest(sender, results);
                        actions.setLastAction(sender, 'restaurantsShowing', null, []);
                    }
                    else {
                        messageData = {text: "Sorry, delivery in this area is currently off."};
                        request.sendRequestcall(sender, messageData, function () {
                            genLoc.genGetRegion(function(err, messageData){
                                if(!err){
                                    request.sendRequest(sender, messageData);
                                }
                            });
                        });
                    }
                }
            });
        })
    }
    else if(address && zipcode && region){
        let messageData = {text: 'your location is ' + address};
        request.sendRequestcall(sender, messageData, function () {
            messageData = {text: "I'm loading restaurants for you..."};
            request.sendRequestcall(sender, messageData, function () {
                resTem.genRestaurantByZip('1111',0, function (err, results) {
                    if (err) throw err;
                    else {
                        if (results.attachment.payload.elements.length > 1) {
                            pipeline.data[sender].location = {
                                address: address,
                                zip: zipcode,
                                region: region,
                                confirmed: false,
                                value: true
                            };
                            pipeline.data[sender].restaurant.index+=1;
                            request.sendRequest(sender, results);
                            actions.setLastAction(sender, 'restaurantsShowing', null, []);
                        }
                        else {
                            messageData = {text: "Sorry, I could not find restaurants in this area. You could choose a region"};
                            request.sendRequestcall(sender, messageData, function () {
                                genLoc.genGetRegion(function(err, messageData){
                                if(!err){
                                    request.sendRequest(sender, messageData);
                                }
                            });
                            });
                        }
                    }
                });
            })
        })
    }
    else if(address && region){
        let messageData = {text: 'your location is ' + address};
        request.sendRequestcall(sender, messageData, function () {
            messageData = {text: "I'm loading restaurants for you..."};
            request.sendRequestcall(sender, messageData, function () {
                resTem.genRestaurantByRegion(region,0, function (err, results) {
                    if (err) throw err;
                    else {
                        if (results.attachment.payload.elements.length > 1) {
                            pipeline.data[sender].location = {
                                address: address,
                                region: region,
                                confirmed: false,
                                value: true
                            };
                            pipeline.data[sender].restaurant.index+=1;
                            request.sendRequest(sender, results);
                            actions.setLastAction(sender, 'restaurantsShowing', null, []);
                        }
                        else {
                            messageData = {text: "Sorry, I could not find restaurants in this area. You could choose a region"};
                            request.sendRequestcall(sender, messageData, function () {
                                genLoc.genGetRegion(function(err, messageData){
                                    if(!err){
                                        request.sendRequest(sender, messageData);
                                    }
                                });
                            });
                        }
                    }
                });
            })
        })
    }
    else if(address){
        pipeline.data[sender].location = {
            address: address,
            confirmed: true,
            value: true
        };
        let messageData = {text: "Sorry, I could not find restaurants in this area. You could choose a region"};
        request.sendRequestcall(sender, messageData, function () {
            request.sendRequest(sender, genLoc.genGetRegion());
        });
    }
}
