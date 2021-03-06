const cool = require('cool-ascii-faces')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const bodyParser = require('body-parser')
const request = require("request");
/*
{{authEndpoint}}/v1/requestToken
*/
const auth_options = {
    method: 'POST',
    url: 'https://auth.exacttargetapis.com/v1/requestToken',
    headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
    },
    body: {
        clientId: '#',
        clientSecret: '#'
    },
    json: true
};

/**


request({
	url: 'https://yourInstance.salesforce.com/services/data/v20.0/sobjects/Account/ ',
	headers: {
		Authorization: 'Bearer token'
	},
	json: true,
	body: {
		/// body here
	}
})

*/

express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .get('/thanks', (req, res) => res.render('pages/thanks'))
    .get('/cool', (req, res) => res.send(cool()))
    .get('/helloworld', (req, res) => res.send('hello world'))
    .get('/form', (req, res) => res.render('pages/form'))
    .post('/form', function(req, res) {
        console.log(req.body);
        let phoneDigits = req.body.phone;
        // logic to ping MC here
        request(auth_options, function(error, response, body) {
            if (error) throw new Error(error);
            console.trace(body);
            let token = "Bearer " + body.accessToken;

            const de_insert = {
                method: 'POST',
                //url: 'https://www.exacttargetapis.com/hub/v1/dataevents/key:de_adventurers/rowset',
                url: 'https://www.exacttargetapis.com/hub/v1/dataevents/key:D8A8D9FF-CDC5-401C-9CBE-781DF1559D8A/rowset',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: [{
                    keys: {
                        SubKey: req.body.SubKey
                    },
                    values: {
                        Email: req.body.email,
                        FirstName: req.body.firstname,
                        LastName: req.body.lastname,
                        Phone: phoneDigits,
                        Zip: req.body.zip
                    }
                }],
                json: true
            };

            const email_options = {
                method: 'POST',
                url: 'https://www.exacttargetapis.com/messaging/v1/messageDefinitionSends/key:73700/send',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: {
                    From: {
                        Address: 'junior@indianajones.com',
                        Name: 'Indiana Jones'
                    },
                    To: {
                        Address: req.body.email,
                        SubscriberKey: req.body.SubKey,
                        ContactAttributes: {
                            SubscriberAttributes: {
                                FirstName: req.body.firstname,
                                Zip: req.body.zip
                            }
                        }
                    },
                    OPTIONS: {
                        RequestType: 'SYNC'
                    }
                },
                json: true
            };

            const sms_options = {
                method: 'POST',
                url: 'https://www.exacttargetapis.com/sms/v1/messageContact/MTc6Nzg6MA/send',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: {
                    Subscribe: true,
                    Resubscribe: true,
                    mobileNumbers: [phoneDigits],
                    keyword: 'LUCKYCAT',
                    Override: true,
                    messageText: "You can haz blessings"
                },
                json: true
            };
            // next call
            request(sms_options, function(err, r, b) {
                if (err) throw new Error(err);

                console.trace(b);
            });
            // next call
            request(de_insert, function(err, r, b) {
                if (err) throw new Error(err);

                console.trace(b);
            });
            // next call
            request(email_options, function(err, r, b) {
                if (err) throw new Error(err);

                console.trace(JSON.stringify(b));
            });

        });
        res.redirect('/thanks');
    })
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
