const request = require('./requests');
const pipeline = require('./pipeline');
const actions = require('./actions');
const Profile = require('../../model/Profiles');
const generator = require('./generator');

const resTem = require('../templates/genRestaurantTemplate');
const foodTem = require('../templates/genFoodTemplate');
const genWhat = require('../templates/genWhatToDo');
const genLoc = require('../templates/genGetLocation');
const genCart = require('../templates/genCartTemplate');

module.exports.postbackProcessor = function (sender, postback) {
    if(postback.payload === 'GET_STARTED_PAYLOAD'){
        request.getProfile(sender, function (name) {
            pipeline.setSenderData(sender);
            let nameFormatted= name.first_name + ' '+ name.last_name;
            pipeline.data[sender].name = nameFormatted;


            request.sendRequestcall(sender, genWhat.genGetStarted(nameFormatted), function () {
                const profile = new Profile();
                profile.first_name = name.first_name;
                profile.last_name = name.last_name;
                profile.sender_id= sender;

                
                addProfile(profile, function(err, user) {});
                console.log(profile);
            });
        });
    }

    else if (postback.payload.includes('FOOD')) {
        pipeline.setSenderData(sender);
        console.log('Food : ' + postback.payload);
        let items = postback.payload.split('_');

        foodTem.findFoodSizeByID(items[1], items[2], function (err, items) {
            let food = items.food;
            let res = items.res;
            console.log(food);
            console.log();
            console.log("res found ");
            console.log(res);

            if(pipeline.data[sender].restaurant.name){
                if(pipeline.data[sender].restaurant.name === res.name){
                    // attending
                    generator.foodAttending(err, sender,  res, food);
                }
                else{
                    //in line
                    generator.foodInLine(err, sender,  res, food);
                }
            }
            else{
                //attending and restaurant
                generator.foodAttendingRes(err, sender, res, food);
            }
        });
    }

    else if (postback.title === 'Pick') {
        console.log('Restaurant : ' + postback.payload);
        
        foodTem.genFoodByRestaurant(postback.payload, function (err, results) {
            console.log('full result : ' + JSON.stringify(results, null, 2));
            if(results[0].data.attachment.payload.elements.length > 0) {
                let messageData = {text: "food menu for restaurant " + postback.payload + ". Pick other restaurants and see their menu. "};
            
                request.sendRequestcall(sender, messageData, function(){
                    sendFoods(sender, results);
                });
            }
            else {
                let messageData = {text: "Sorry, " + postback.payload + " is not in our list yet, You could checkout other restaurants"};
                request.sendRequestcall(sender, messageData, function () {
                    genLoc.genGetLocation(function(err, messageData){
                        if(!err){
                            request.sendRequest(sender, messageData);
                        }
                    });
                });
            }
        });
    }

    else if (postback.title === 'View cart') {
        console.log('cart : ' + postback.payload);
        if (pipeline.data[sender] && pipeline.data[sender].foods) {
            request.sendRequest(sender, genCart.genCartCarousel(pipeline.data[sender].restaurant.name, pipeline.data[sender].foods));
        }
        else {
            let messageData = {text: 'Nothing on your cart'};
            request.sendRequest(sender, messageData);
        }
    }

    else if (postback.payload === 'CANCEL_CART'){
        pipeline.clearSenderData(sender);
        let messageData = {text: 'Cart is cleared'};
        request.sendRequest(sender, messageData);
        
    }

    else if (postback.title === 'Restart bot') {
        if (pipeline.data[sender]) {
            
        }
        else {
            actions.actionsProcessor(sender, 'restartBotConfirm', 'Bot Restarted');
        }
    }

    else if (postback.title === 'View More') {
        if (pipeline.data[sender]) {
            viewMoreProcessor(sender, pipeline.data[sender].location.address,
                pipeline.data[sender].location.zip, pipeline.data[sender].location.region);
        }
        else {
            actions.actionsProcessor(sender, 'restartBotConfirm', 'Bot Restarted');
        }
    }

    else if (postback.payload.includes('CHANGE')){
        let res =postback.payload.split('_');
        let flag = false;
        let food;
        pipeline.data[sender].foods.forEach(function (foodItem) {
            if(foodItem.food_id.equals(res[1])){
                console.log('falsify');
                food= foodItem;
                flag= true;
            }
        });
        if(flag){
            pipeline.data[sender].foodattending= food;


            let messageData= {text: 'You currently have '+food.quantity+' '+ food.food_name+ " in your cart now, How many would you order?"};
            request.sendRequest(sender, messageData);

        }
        else {
            let messageData= {text: food.food_name+ " not found in Cart"};
            request.sendRequest(sender, messageData);
        }
    }

    else if (postback.payload.includes('REMOVE')){
        let res =postback.payload.split('_');
        let flag = false;
        let food;
        let foodIndex=0;
        let index=0;
        pipeline.data[sender].foods.forEach(function (foodItem) {
            if(foodItem.food_id.equals(res[1])){
                food= foodItem;
                flag=true;
                foodIndex = index;
            }
            index++;
        });
        if(flag){
            pipeline.data[sender].foods.splice(foodIndex, 1);
            let messageData= {text: food.food_name+ " removed from cart."};
            request.sendRequestcall(sender, messageData, function () {
                request.sendRequest(sender, genCart.genCartCarousel(pipeline.data[sender].restaurant.name, pipeline.data[sender].foods));
            });
        }
        else {
            let messageData= {text: food.food_name+ " not found in Cart"};
            request.sendRequest(sender, messageData);
        }
    }

    else if (postback.payload ==='CHECKOUT'){
        if(pipeline.data[sender].foods.length>0){
            if(pipeline.data[sender].location.address && !pipeline.data[sender].location.confirmed){
                let messageData = {text: 'Great! Would you like delivery at this address : '+ pipeline.data[sender].location.address};
                request.sendRequest(sender, messageData);
            }
            else {
                request.sendRequest(sender, genLoc.genGetAddress());
            }
        }
        else {
            let messageData = {text: "Please add items to cart for checkout"};
            request.sendRequest(sender, messageData);
        }
    }

    else if (postback.payload === 'GET_ORDER'){
        request.sendRequest(sender, {text: ':D'});
    }
};

function viewMoreProcessor(sender, address, zipcode, region) {
    if (!address && region && zipcode) {
        resTem.genRestaurantByRegion(region, pipeline.data[sender].restaurant.index, function (err, results) {
            if (err) throw err;
            else {
                if (results.attachment.payload.elements.length > 1) {
                    pipeline.data[sender].restaurant.index += 1;
                    request.sendRequest(sender, results);
                }
                else {
                    let messageData = {text: "Sorry, No more restaurants, select from the previous list"};
                    request.sendRequest(sender, messageData);
                }
            }
        });
    }
    else if (address && zipcode && region) {
        resTem.genRestaurantByZip('1111', pipeline.data[sender].restaurant.index, function (err, results) {
            if (err) throw err;
            else {
                if (results.attachment.payload.elements.length > 1) {
                    pipeline.data[sender].restaurant.index++;
                    request.sendRequest(sender, results);
                }
                else {
                    let messageData = {text: "Sorry, No more restaurants, select from the previous list"};
                    request.sendRequest(sender, messageData);
                }
            }
        });
    }
    else if (address && region) {
        resTem.genRestaurantByRegion(region, pipeline.data[sender].restaurant.index, function (err, results) {
            if (err) throw err;
            else {
                if (results.attachment.payload.elements.length > 1) {

                    pipeline.data[sender].restaurant.index++;
                    request.sendRequest(sender, results);
                }
                else {
                    let messageData = {text: "Sorry, No more restaurants, select from the previous list"};
                    request.sendRequest(sender, messageData);
                }
            }
        });
    }
}



function addProfile (profile,cb){
    Profile.find({sender_id : profile.sender_id}, function (err, docs) {
        if (docs.length){
            cb('Name exists already',null);
        }else{
            profile.save(function(err, user){
                cb(err,user);
            });
        }
    });
}

async function sendFoods (sender, results) {
  for (let i = 0; i < results.length; i++) {
    let res = await request.sendRequestasync(sender, {text: results[i].cat});
    res = await request.sendRequestasync(sender, results[i].data);
    // console.log(result);
  };
}

// async function sendFoods(sender, results) {
//   for (let i = 0; i < 5; i++) {
//     let result = await req('http://google.com');
//     console.log(result.resp.statusCode, i);
//   };
// };