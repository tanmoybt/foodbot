'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;


const FoodsSchema = new Schema({
    res_id: Schema.Types.ObjectId,
    category: String,
    food_name: String,
    food_tags: [String],
    ingredient_tags: [String],
    food_size: [{
        size: String,
        price: Number
    }],
    rating: Number,
    price: Number,
    index: Number,
    desc: String,
    image: String,
    cuisine: [String]
});

FoodsSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Foods', FoodsSchema);