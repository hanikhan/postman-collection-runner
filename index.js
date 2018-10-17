const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const path = require('path');
const envFiles = require('./getEnvFiles')
const testFiles = require('./getTestFiles')
const Newman = require('newman');
var request = require('unirest');
var fs = require('fs');

app.use(express.static('node_modules'));
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

var server = require('http').Server(app);
var io = require('socket.io')(server);

var clients = [];
io.on('connection', function (client) {
    if (clients.length == 0) {
        clients.push(client);
    }
    clients.forEach(function (cli) {
        if (!client.id === cli.id) {
            clients.push(client);
        }
    })
    client.on('connection', function (data) {
    });
});
var sendDataToClient = function (data) {
    clients.forEach(function (client) {
        client.broadcast.emit("message", data);
    })
}

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
}
);

app.get('', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
}
);

app.get('/result/htmlResults.html', (req, res) => {
    res.sendFile(path.join(__dirname + '/result/htmlResults.html'));
}
);

app.get('/tests', (req, res) => {
    res.send(testFiles.getTests());
});

app.get('/env', (req, res) => {
    res.send(envFiles.getenv());
});

app.post('/runTests', (req, res) => {
    //call newman script
    console.log(req.body[0].test);
    console.log(req.body[1].environment);
    newmanOptions = {
        iterationCount: 1,
        reporters: 'html',
        environment: './env/' + req.body[1].environment + '.json',
        collection: './tests/' + req.body[0].test + '.json',
        reporter: { html: { export: './result/htmlResults.html', template: './templates/htmlreqres.hbs' } },
        suppressExitCode: true,
        timeoutRequest: 30000 //timeout the request if response not received in 30 seconds
    }

    Newman.run(newmanOptions).on('start', function (err, args) {
        // on start of run, log to console
        sendDataToClient('running a collection...');

    }).on('done', function (err, summary) {
        if (err || summary.error) {
            sendDataToClient('collection run encountered an error.' + err);
        }
        else {
            sendDataToClient('collection run completed. Results published under results folder');
        }
        res.end();
    }).on('script', function (err, summary) {
        sendDataToClient('Starting new request :' + summary.item.name)
    }).on('request', function(err, args) {
        if (!err)
        sendDataToClient(args.response.stream.toString());
      });
});

app.post('/runTestsUsingPostman', (req, res) => {
    //call newman script
    console.log(req.body[0].postmanLink);
    console.log(req.body[1].environment);
    
    request.get(req.body[0].postmanLink).type('json').end(function(data) {
        if (data.error) {
            Errors.terminateWithError('Unable to fetch a valid response. Error: ' + data.code);
        }
        newmanOptions = {
            iterationCount: 1,
            reporters: 'html',
            environment: './env/' + req.body[1].environment + '.json',
            collection: data.body,
            reporter: { html: { export: './result/htmlResults.html', template: './templates/htmlreqres.hbs' } },
            suppressExitCode: true,
            timeoutRequest: 30000 //timeout the request if response not received in 30 seconds
        }
        Newman.run(newmanOptions).on('start', function (err, args) {
            // on start of run, log to console
            sendDataToClient('running a collection...');
    
        }).on('done', function (err, summary) {
            if (err || summary.error) {
                sendDataToClient('collection run encountered an error.' + err);
            }
            else {
                sendDataToClient('collection run completed. Results published under results folder');
            }
            res.end();
        }).on('script', function (err, summary) {
            sendDataToClient('Starting new request :' + summary.item.name)
        }).on('request', function(err, args) {
            if (!err)
            sendDataToClient(args.response.stream.toString());
          });
    })
});

server.listen(8000, () => console.log('Started application on port 8000'))


