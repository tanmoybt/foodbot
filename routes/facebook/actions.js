const pipeline = require('./pipeline');
const request = require('./requests');

const resTem = require('../templates/genRestaurantTemplate');
const foodTem = require('../templates/genFoodTemplate');
const genWhat = require('../templates/genWhatToDo');
const genLoc = require('../templates/genGetLocation');
const genCart = require('../templates/genCartTemplate');


module.exports.actionsProcessor= function (sender, action, speech, parameters, resolvedQuery) {
    pipeline.setSenderData(sender);

    if(action.includes('smalltalk') || action === 'input.unknown' || action === 'input.welcome'){
        let messageData = {text: speech};
        request.sendRequestcall(sender, messageData, function () {
            sendPrevAction(sender);
        })
    }

    else if(action === 'restartBotConfirm'){
        pipeline.resetSenderData(sender);
        let messageData = {text : 'Bot has restarted, your order information is removed'};
        request.sendRequestcall(sender, messageData, function () {
            request.sendRequest(sender, genWhat.genWhatToDo())
        });
    }

    else if(action === 'restartBot'){
        if(pipeline.data[sender]){
            let messageData= {text: speech};
            request.sendRequest(sender, messageData);
        }
        else {
            let messageData= {text : 'Bot has restarted, your order information is removed'};
            request.sendRequestcall(sender, messageData, function () {
                request.sendRequest(sender, genWhat.genWhatToDo());
            })
        }
    }

    else if(action === 'setOrderGetLocation'){
        pipeline.setSenderData(sender);
        pipeline.data[sender].whattodo= 'ORDER';
        setLastAction(sender, action, speech, parameters);
        genLoc.genGetLocation(function(err, messageData){
            if(!err){
                request.sendRequest(sender, messageData);
            }
        });

    }

    else if(action === 'setOrderShowOnRegionRestaurants'){
        let messageData = {text: "I'm loading restaurants in "+ parameters.region + " for you..."};
        request.sendRequestcall(sender, messageData, function () {
            resTem.genRestaurantByRegion(parameters.region, 0, function (err, results) {
                if (err) throw err;
                else {
                    if (results.attachment.payload.elements.length > 1) {
                        pipeline.data[sender].location = {
                            region: parameters.region,
                            confirmed: false,
                            value: true
                        };
                        pipeline.data[sender].restaurant.index+=1;
                        request.sendRequest(sender, results);
                        setLastAction(sender, 'none', null, []);
                    }
                    else {
                        messageData = {text: "Sorry, I could not find"+ parameters.cuisine+ "restaurants"};
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

    else if(action === 'showMenuOnRestaurant'){
        setLastAction(sender, 'none', '', []);
        console.log(parameters.restaurant_name);

        foodTem.genFoodByRestaurant(parameters.restaurant_name, function (err, results) {
            console.log('full result : ' + JSON.stringify(results, null, 2));
            if(result[0].data.attachment.payload.elements.length > 0) {
                let messageData = {text: "food menu for restaurant " + parameters.restaurant_name + ". Pick other restaurants and see their menu. "};
            
                request.sendRequestcall(sender, messageData, function(){
                    results.forEach(function(result){
                        request.sendRequestcall(sender, {text: result.cat}, function(){
                            request.sendRequest(sender, result.data);
                        })
                    });
                });
            }
            else {
                let messageData = {text: "Sorry, " + parameters.restaurant_name + " is not in our list yet, You could checkout other restaurants"};
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

    else if(action === 'showRestaurantsOnCuisine'){
        let messageData = {text: "I'm loading " + parameters.cuisine + " restaurants for you..."};
        request.sendRequestcall(sender, messageData, function () {
            resTem.genRestaurantByCuisine(parameters.cuisine,0, function (err, results) {
                if (err) throw err;
                else {
                    if (results.attachment.payload.elements.length > 1) {
                        pipeline.data[sender].restaurant.index+=1;
                        request.sendRequest(sender, results);
                        setLastAction(sender, 'none', null, []);
                    }
                    else {
                        messageData = {text: "Sorry, I could not find "+ parameters.cuisine+ " restaurants"};
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

    else if(action === 'getFoodOnFood'){
        const input = parameters.food_name;  // the input from your auto-complete box

        foodTem.genFoodByFood(input, function (err, result) {
            request.sendRequest(sender, result);
        })
    }

    else if(action === 'addFoodGetQuantity'){
        let speech = 'You were about to tell me how many ' + pipeline.data[sender].foodattending.food_name + ' you would like';
        setLastAction(sender, 'addFoodGetQuantity', speech, []);
    }

    else if(action === 'addToCart.addToCart-selectnumber'){
        let qu = parameters.number[0];
        console.log(qu);
        let food = pipeline.data[sender].foodattending;
        food.quantity= qu;
        pipeline.data[sender].foods.push(food);
        pipeline.data[sender].foodattending= {};
        setLastAction(sender, 'none', '', []);
        let messageData= {text: qu +' '+ food.food_name + ' in your cart. You can view your cart for checkout or continue shopping.'};
        request.sendRequest(sender, messageData);
    }

    else if(action === 'addToCart.addToCart-cancel'){
        setLastAction(sender, 'none', '', []);
        let food = pipeline.data[sender].foodattending;
        pipeline.data[sender].foodattending= {};
        let messageData= {text: food.food_name + ' cancelled from order. You can view your cart for checkout or continue shopping.'};
        request.sendRequest(sender, messageData);
    }

    else if(action === 'changeAmountInCart.changeAmountInCart-selectnumber'){
        let qu = parameters.number[0];
        console.log(qu);
        let food = pipeline.data[sender].foodattending;
        pipeline.data[sender].foods.forEach(function (foodItem) {
            if(foodItem.food_id.equals(food.food_id)){
                foodItem.quantity = qu;
            }
        });
        pipeline.data[sender].foodattending= {};
        setLastAction(sender, 'none', '', []);
        let messageData= {text: qu +' '+ food.food_name + ' in your cart. You can view your cart for checkout or continue shopping.'};
        request.sendRequest(sender, messageData);
    }

    else if(action === 'changeAmountInCart.changeAmountInCart-cancel'){
        setLastAction(sender, 'none', '', []);
        let food = pipeline.data[sender].foodattending;
        pipeline.data[sender].foodattending= {};
        let messageData= {text: food.food_name + ' kept in order. You can view your cart for checkout or continue shopping.'};
        request.sendRequest(sender, messageData);
    }

    else if(action === 'changeRestaurant.changeRestaurant-yes'){
        pipeline.data[sender].foodattending= foodinline;
        pipeline.data[sender].restaurantinline= food;


        let messageData= {text: 'How many of '+ pipeline.data[sender].foodattending.food_name + "(" + pipeline.data[sender].foodattending.size + ") would you order?"};
        request.sendRequest(sender, messageData);
    }

    else if(action === 'deliverylocationConfirm.deliverylocationConfirm-yes'){
        setLastAction(sender, 'none', '', []);
        pipeline.data[sender].location.confirmed = true;
        let messageData= {text: 'The order will be delivered at ' + pipeline.data[sender].location.address};
        request.sendRequestcall(sender, genCart.genCart(pipeline.data[sender].foods), function () {
            request.sendRequest(sender, genCart.genConfirmOrder());
        });
    }

    else if(action === 'deliverylocationConfirm.deliverylocationConfirm-no'){
        setLastAction(sender, 'none', '', []);
        pipeline.data[sender].location.confirmed = false;
        request.sendRequest(sender, genLoc.genGetAddress());
    }

    else if(action === 'deliveryLocationNoGetAddress'){
        if(parameters.address){
            pipeline.data[sender].location.address = parameters.address;
            pipeline.data[sender].location.confirmed = true;
            let messageData = {text: 'What is the best phone number to reach you? '};
            request.sendRequest(sender, messageData);
            // request.sendRequestcall(sender, genCart.genCart(pipeline.data[sender].foods), function () {
            //     request.sendRequest(sender, genCart.genConfirmOrder());
            // });

        }
    }

    else if(action === 'onCheckoutGotAddress'){
        pipeline.data[sender].location.address = resolvedQuery;
        pipeline.data[sender].location.confirmed = true;
        let messageData = {text: 'What is the best phone number to reach you? '};
        setLastAction(sender, 'getPhoneNumber', 'Sorry, could you repeat the phone number?', []);
        request.sendRequest(sender, messageData);
    }

    else if(action === 'deliverySetPhoneNumber'){
        pipeline.data[sender].phone = parameters.phonenumber;
        request.sendRequestcall(sender, genCart.genCart(sender), function () {
            request.sendRequest(sender, genCart.genConfirmOrder());
        });
    }
};

function setLastAction(sender, action, speech, parameters) {
    pipeline.data[sender].lastactiontaken = {
        action: action,
        parameters: parameters,
        speech: speech
    };
}

module.exports.setLastAction = setLastAction;

function sendPrevAction(sender){
    if(pipeline.data[sender]){
        if (pipeline.data[sender].lastactiontaken.action){
            let action = pipeline.data[sender].lastactiontaken.action;
            let speech = pipeline.data[sender].lastactiontaken.speech;
            let parameters = pipeline.data[sender].lastactiontaken.parameters;

            if(action === 'setOrderGetLocation'){
                genLoc.genGetLocation(function(err, messageData){
                    if(!err){
                        request.sendRequest(sender, messageData);
                    }
                });
            }
            else if(action === 'addFoodGetQuantity'){
                request.sendRequest(sender, {text: speech});
            }
            else if(action === 'getPhoneNumber'){
                request.sendRequest(sender, {text: speech});
            }
        }
        else {
            request.sendRequest(sender,genWhat.genWhatToDo());
        }
    }
    else{
        request.sendRequest(sender,genWhat.genWhatToDo());
    }
}
