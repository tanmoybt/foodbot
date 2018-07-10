const request = require('./requests');
const pipeline = require('./pipeline');

module.exports.foodAttending = function(err, sender, res, food){
	if (err || !food) return;

    console.log(food);
    console.log('more: ' + JSON.stringify(pipeline.data[sender], null,2));
    let flag = true;

    pipeline.data[sender].foods.forEach(function (foodItem) {

        if(foodItem.food_id.equals(food.food_id) && foodItem.size_id.equals(food.size_id)){
            console.log('falsify');
            flag= false;
        }
    });
    if(flag){
        pipeline.data[sender].foodattending= food;


        let messageData= {text: 'How many of '+ food.food_name + "(" + food.size + ") would you order?"};
        request.sendRequest(sender, messageData);

    }
    else {
        let messageData= {text: food.food_name+ " is already in your cart. To modify visit cart"};
        request.sendRequest(sender, messageData);
    }
}

module.exports.foodAttendingRes = function(err, sender, res, food){
	if (err || !food ) return;


	pipeline.data[sender].restaurant = { index: 0,
                res_id: res.res_id, name: res.name, image_url: res.url, confirmed: false
            };

    console.log(food);
    console.log('more: ' + JSON.stringify(pipeline.data[sender], null,2));
    let flag = true;

    pipeline.data[sender].foods.forEach(function (foodItem) {

        if(foodItem.food_id.equals(food.food_id) && foodItem.size_id.equals(food.size_id)){
            console.log('falsify');
            flag= false;
        }
    });
    if(flag){
        pipeline.data[sender].foodattending= food;

        let messageData= {text: 'How many of '+ food.food_name + "(" + food.size + ") would you order?"};
        request.sendRequest(sender, messageData);

    }
    else {
        let messageData= {text: food.food_name+ " is already in your cart. To modify visit cart"};
        request.sendRequest(sender, messageData);
    }
}

module.exports.foodInLine = function(err, sender, res, food){
	console.log('foodin line: ' + JSON.stringify(pipeline.data[sender], null, 2));
	// console.log("foodinline ", pipeline.data[sender]);
	pipeline.data[sender].foodInLine = food;
	pipeline.data[sender].restaurantinline = { index: 0,
                res_id: res.res_id, name: res.name, image_url: res.url, confirmed: false
            };
	let messageData= {text: "There are items in your cart from " + res.name + ", would you clear cart and add this item?"};
	request.sendRequest(sender, messageData);
}