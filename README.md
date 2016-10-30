
CADRSPACE_BOT
-------------
Telegram bot that shows [CADR](https://cadrspace.ru) hackspace status

Telegram handle: [@cadrspace_bot](telegram.me/cadrspace_bot)

Usage
=====

* /help - Show help text
* /status - Show current status OPEN/CLOSED


Setup
=====

Move config.example.js to config.$NODE_ENV.js.
Paste valid Telegram token into config then launch.

```
$ export NODE_ENV=production
$ npm start
```


Roadmap
=======
* ~~Camera image~~ Added 29-Oct-2016
* Subscription on status changes
* Schedule command
* Request presense command
* Integration with [hackdepot](https://github.com/cadrspace/hackdepot)

# Change Log
## [0.0.1] - 2016-10-29
### Added
- /camera command shows camera image from hackspace. If image is unavailable show kittens
