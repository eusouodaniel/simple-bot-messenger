require('dotenv/config');
const express = require("express");
var bodyParser = require('body-parser');
var request = require('request');
const server = express();

const projectId = 'translate-lusmcc';
const sessionId = '123456';
const languageCode = 'pt-BR';

const dialogflow = require('dialogflow');

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(express.json());
server.listen(3000);

const key = process.env.DIALOGFLOW_PRIVATE_KEY.replace(new RegExp("\\\\n", "\g"), "\n")

const config = {
  credentials: {
    private_key: key,
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
  }
};

const sessionClient = new dialogflow.SessionsClient(config);
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

server.get('/webhook', (req, res) => {
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] == process.env.VERIFY_TOKEN) {
		return res.status(200).send(req.query['hub.challenge']);
	} else {
		return res.status(403);
	}
});

server.post('/webhook', (req, res) => {
	let data = req.body;
	if (data && data.object === 'page') {
		data.entry.forEach( function (entry) {
			entry.messaging.forEach( function (event) {
				if (event.message) {
				    dialogFlow(event);
				// 	treatMessage(event);
				} 
			})
		})
	}
	
	return res.sendStatus(200);
});


// function treatMessage(event) {
// 	let senderID = event.sender.id;
// 	let messageText = event.message.text;

// 	if (messageText) {
// 		switch (messageText) {
// 			case 'Oi':
// 				sendMessage(senderID, "Oi, eu sou um robô! :)");
// 				break;

// 			case 'Tchau':
// 				sendMessage(senderID, "Que pena que você já vai :(");
// 				break;

// 			default:
// 				sendMessage(senderID, "Oi, ainda estou em desenvolvimento, portanto só entendo 'Oi' e 'Tchau' :')");
// 		}
// 	} 
// }

function dialogFlow(event) {
      const userId = event.sender.id;
      const message = event.message.text;

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message,
            languageCode: languageCode,
          },
        },
      };
      
      sessionClient
        .detectIntent(request)
        .then(responses => {
          console.log(responses);
          const result = responses[0].queryResult;
          return sendMessage(userId, result.fulfillmentText);
        })
        .catch(err => {
          console.error('ERROR:', err);
        });
}


function sendMessage(recipientID, messageText) {
    console.log(messageText);
	let messageData = {
		recipient: {
			id: recipientID
		},
		message: {
			text: messageText
		}
	};

	connectAPI(messageData);
}

function connectAPI(messageData) {
	request({
		uri: process.env.URI_BASE,
		qs: { access_token: process.env.ACCESS_TOKEN },
		method: 'POST',
		json: messageData
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log('Mensagem enviada com sucesso');
		} else {
			console.log('Erro ao enviar mensagem');
		}
	});
}
