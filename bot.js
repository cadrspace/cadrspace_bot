var env = process.env.NODE_ENV || 'development';
var cfg = require('./config.'+env);

var TelegramBot = require('node-telegram-bot-api');
var Winston = require('winston');
var fs = require('fs');
var https = require('https');
var token = cfg.telegramToken;
var bot = new TelegramBot(token, { polling: true });

var logger = new (Winston.Logger)({
    transports: [
	new (Winston.transports.File)({ filename: 'bot.log' })
    ]
});

//
// Space API Response example
//

// { api: '0.13',
//   space: 'CADR',
//   logo: 'http://cadrspace.ru/w/skins/common/images/cadr.png',
//   url: 'http://cadrspace.ru',
//   location:
//    { address: 'Nizhniy Novgorod, Russian Federation, Studentcheskaya st. 6, aud. 054',
//      lon: 43.988235,
//      lat: 56.302663 },
//   spacefed: { spacenet: false, spacesaml: false, spacephone: false },
//   contact:
//    { twitter: '@cadrspace',
//      irc: 'irc://chat.freenode.net/##cadr',
//      ml: 'cadr-hackerspace@googlegroups.com',
//      issue_mail: 'poptsov.artyom@gmail.com' },
//   cam: [ 'http://nntc.nnov.ru:58080/?action=stream' ],
//   issue_report_channels: [ 'issue_mail', 'ml' ],
//   state: { open: false },
//   projects: [ 'https://github.com/cadrspace' ],
//   cache: { schedule: 'm.05' } }

function callSpaceApi(cb) {
    var options = {
	host: 'cadrspace.ru',
	path: '/status/json'
    };

    var callback = function(response) {
	var str = '';
	response.on('data', function (chunk) {
	    str += chunk;
	});

	response.on('end', function () {
	    var json = JSON.parse(str);
	    cb(json);
	});
    };

    https.request(options, callback).end();
}

function getCameraShot(url, cb) {

    var download = function(url, dest, callback) {
	var file = fs.createWriteStream(dest);
	https.get(url, function(response) {
	    response.pipe(file);
	    file.on('finish', function() {
		file.close(callback);  // close() is async, call cb after close completes.
	    });
	}).on('error', function(err) { // Handle errors
	    fs.unlink(dest); // Delete the file async. (But we don't check the result)
	    if (callback) callback(err.message);
	});
    };

    //var url = 'http://nntc.nnov.ru:58080/?action=stream';
    //var url = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/1999_Subaru_Impreza_(MY99)_WRX_STI_Version_5_coupe_(23295614974).jpg'
    download(url, 'image.jpg', cb);
}

bot.onText(/\/echo (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    bot.sendMessage(fromId, resp);
});


bot.onText(/\/start/, function (msg) {
    bot.sendMessage(msg.from.id, 'Бот показывает статус хакспейса CadrSpace (https://cadrspace.ru)');
});


bot.onText(/\/status/, function (msg) {

    var message;

    callSpaceApi(function(data) {
	if (!data.state.open) {
	    message = '[ЗАКРЫТ] Сейчас хакспейс закрыт';
	} else {
	    message = '[ОТКРЫТ] Сейчас хакспейс открыт';
	}
	bot.sendMessage(msg.from.id, message);
    });
});


bot.onText(/\/help/, function (msg) {
    var chatId = msg.chat.id;
    var message = '';
    bot.sendMessage(chatId, '/status - Посмотреть статус хакспейса' + '\n\n');
    callSpaceApi(function(data) {
	message += data.space + '- это проект по созданию творческого пространства для реализации технических идей, исследований, обмена опытом, обучения и саморазвития, а также для простого человеческого общения на технические темы.\n\n'
	    + 'Address: ' + data.location.address + '\n\n'
	    + ''
	    + 'Twitter: ' + data.contact.twitter + '\n'
	    + 'IRC: ' + data.contact.irc + '\n'
	    + 'ML: ' + data.contact.ml + '\n';

	bot.sendMessage(msg.from.id, message);
    });
});


bot.onText(/\/camera/, function (msg) {
    var chatId = msg.chat.id;
    var message;

    callSpaceApi(function(data) {
	if (!data.state.open) {
	    message = '[ЗАКРЫТ] Сейчас хакспейс закрыт, изображение с камеры недоступно';
	    var kittenUrl = 'https://thecatapi.com/api/images/get?format=src&type=jpg';
	    getCameraShot(kittenUrl, function() {
		bot.sendPhoto(chatId, 'image.jpg', {caption: 'Изображение с камеры недоступно'});
	    });
	} else {
	    message = '[ОТКРЫТ] Сейчас хакспейс открыт';
	    getCameraShot(data.cam[0], function() {
		bot.sendPhoto(chatId, 'image.jpg', {caption: message});
	    });
	}
    });
});


bot.on('message', function (msg) {
    logger.log('info', 'Message %s', msg.text);
});
