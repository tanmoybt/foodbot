const Restaurant = require('../../model/Restaurants');
const Food = require('../../model/Foods');

module.exports.genFoodByFoodName = function (food_name, callback) {
    let perPage = 10;
    let page = 0;
    Food.find({food_name: food_name})
        .limit(perPage)
        .skip(perPage * page)
        .exec(function (err, foods) {
            callback(err, makeTemplate(foods));
        })
};

module.exports.genFoodByRestaurant = function (res_name, callback) {
    let perPage = 10;
    let page = 0;
    Restaurant.findOne({name: res_name}, function (err, restaurant) {
        if (err) return err;
        if (restaurant) {
            // Food.find({res_id: restaurant._id}, function (err, foods) {
            //     if (err) return err;
            //     callback(err, makeTemplate(foods));
            // });

            Food.aggregate([{$match: {res_id: restaurant._id}},
                { $group : { _id : "$category", foods: { $push: "$$ROOT" } } }], 
                function(err, foods){
                
                    if(err) return err;
                    // console.log(foods);
                    let tt= makeTemplateCategory(restaurant.name, foods);
                    // console.log(tt);
                    callback(err, tt);
                }
            );
        }
        else {
            callback(err, makeTemplate([]));
        }
    })
};

module.exports.genFoodByFood = function (food_name, callback) {
    let perPage = 10;
    let page = 0;
    console.log(food_name);
    Food.find({food_name: new RegExp(food_name, "i")}, function (err, foods) {
        if (err) return err;
        console.log(foods.size);
        callback(err, makeTemplate(foods));
    })

};

module.exports.genFoodByCuisine = function (cuisine, callback) {
    let perPage = 10;
    let page = 0;
    Food.find({cuisine: cuisine})
        .limit(perPage)
        .skip(perPage * page)
        .exec(function (err, foods) {
            callback(err, makeTemplate(foods));
        })
};

module.exports.findFoodByID = function (food_id, callback) {
    Food.findOne({_id: food_id}, function (err, result) {
        let food = {
            food_id: result._id,
            food_name: result.food_name,
            quantity: 0,
            price: result.price,
            image_url: "https://media-cdn.tripadvisor.com/media/photo-s/0a/56/44/5a/restaurant.jpg"
        };
        callback(err, food);
    });
};

module.exports.findFoodSizeByID = function (food_id, size_id, callback) {
    Food.findOne({_id: food_id, food_size: {$elemMatch: {_id: size_id}}}, function(err, result){
    // Food.findOne({_id: food_id}, function (err, result) {
        console.log(result);
        let food, res;
        Restaurant.findOne(result.res_id, function(err, doc){
            let res = {
                    name: doc.name,
                    url: doc.image,
                    res_id: doc._id
                };
            console.log("res in template");
            console.log(res);
            
            result.food_size.forEach(function(size){
                if(size._id.equals(size_id)){
                    food = {
                        food_id: result._id,
                        food_name: result.food_name,
                        size_id: size._id,
                        size: size.size,
                        quantity: 0,
                        price: size.price,
                        image_url: "https://media-cdn.tripadvisor.com/media/photo-s/0a/56/44/5a/restaurant.jpg"
                    };
                }
            })
            
            callback(err, {res: res, food: food});
        });
        
    });
};


function makeTemplate(foods) {
    if (!foods.size) {
        let messageElements = foods.map(category => {
            return (
                {
                    "title": food.food_name,
                    "subtitle": food.cuisine + ', Rating :' + food.rating + ', ' + food.price + 'Tk',
                    "image_url": "https://media-cdn.tripadvisor.com/media/photo-s/0a/56/44/5a/restaurant.jpg",
                    "default_action": {
                        "type": "web_url",
                        "url": "fb.com/anjantb",
                        "messenger_extensions": false,
                        "webview_height_ratio": "tall"
                    },
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Add to cart",
                            "payload": food._id
                        }
                    ]
                }
            )
        });
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": messageElements
                }
            }
        }
    }
    else {
        return [];
    }
}

function makeTemplateCategory(restaurant, categories) {
    if (categories.length) {
        let templates = [];
        categories.forEach(function(category){
            let bodies = [];
            category.foods.forEach(function(food){
                let buttons = [];
                let sub = "";
                if(food.desc){
                    sub = food.desc ; 
                }
                else {
                    sub = food.cuisine;
                }
                if(food.food_size.length){
                    food.food_size.forEach(function(size){
                        sub += "\n" + size.size + "-" + size.price + " tk";
                        let tem = {
                            "type": "postback",
                            "title": size.size,
                            "payload": "FOOD_" + food._id + "_" + size._id
                        };   
                        buttons.push(tem);
                    });
                    // console.log(buttons);

                    let body = {
                        "title": food.food_name + " - " + food.category,
                        "subtitle": sub,
                        "image_url": "https://www.w3schools.com/w3css/img_lights.jpg",
                        "default_action": {
                            "type": "web_url",
                            "url": "https://www.sigmindai.net/bbb/",
                            "messenger_extensions": false,
                            "webview_height_ratio": "tall"
                        },
                        "buttons": buttons
                    };
                    // console.log(" a body");
                    // console.log(body);
                    bodies.push(body);
                } 
                else {
                    console.log("no sizes");
                    return [];
                }
            });
            // console.log(bodies);
            let catTem = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": bodies
                    }
                }
            }
            let data = {
                cat: category._id,
                data: catTem
            }
            templates.push(data);

        })
        return templates;
    }
    else {
        console.log("found nth");
        return [];
    }
}

