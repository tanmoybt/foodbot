const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Router = express.Router();
const request = require('request');

const postback = require('./postbacks');
const messages = require('./messages');

/* For Facebook Validation */
Router.get('/', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'quijinnbot') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});


let data = [];

/* Handling all messenges */
Router.post('/', (req, res) => {
    // console.log(JSON.stringify(req, null, 2));
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                console.log('full event : ' + JSON.stringify(event, null, 2));
                if(event.postback){
                    postback.postbackProcessor(event.sender.id, event.postback);
                }
                if(event.message) {
                    messages.messagesProcessor(event.sender.id, event.message);
                }
            });
        });
        res.status(200).end();
    }
});


module.exports = Router;