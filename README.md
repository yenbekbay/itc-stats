# itc-stats
**A BitBar plugin that shows statistics for your iOS and OS X apps**

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Dependency Status][daviddm-image]][daviddm-url]

[![NodeICO][nodeico-image]][nodeico-url]

<img width="500" alt="itc-stats demo" src="demo.png"/>

## Installation

1\. Clone the repo somewhere on your computer:

```bash
git clone https://github.com/yenbekbay/itc-stats.git <path-to-itc-stats>
```

2\. Copy `config.json-example` to `config.json` and edit the values to your own. For the start date, you can use [Moment.js shorthands](http://momentjs.com/docs/#/manipulating/) (e.g. 1day, 3months, 5weeks, 2years, ...).

3\. Install all dependencies by running:

```bash
npm install
```

4\. Finally link the plugin to your BitBar plugin directory and set the refresh rate:

```bash
ln -s <path-to-itc-stats>/index.js <path-to-bitbar-plugins>/itc-stats.1d.js
```

5\. Refresh the plugins with BitBar and enjoy your stats. :)

## The MIT License

MIT © [Ayan Yenbekbay](http://yenbekbay.me)


[downloads-image]: https://img.shields.io/npm/dm/itc-stats.svg
[npm-url]: https://www.npmjs.com/package/itc-stats
[npm-image]: https://img.shields.io/npm/v/itc-stats.svg

[travis-url]: https://travis-ci.org/yenbekbay/itc-stats
[travis-image]: https://img.shields.io/travis/yenbekbay/itc-stats.svg

[daviddm-image]: https://david-dm.org/yenbekbay/itc-stats.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/yenbekbay/itc-stats

[nodeico-url]: https://nodei.co/npm/itc-stats
[nodeico-image]: https://nodei.co/npm/itc-stats.png?downloads=true&downloadRank=true
