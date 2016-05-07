#!/usr/bin/env /usr/local/bin/node

// <bitbar.title>iTunes Connect Stats</bitbar.title>
// <bitbar.version>v0.1.0</bitbar.version>
// <bitbar.author>Ayan Yenbekbay</bitbar.author>
// <bitbar.author.github>yenbekbay</bitbar.author.github>
// <bitbar.desc>Get statistics for your iOS and OS X apps</bitbar.desc>
// <bitbar.image>https://raw.githubusercontent.com/yenbekbay/itc-stats/master/demo.png</bitbar.image>
// <bitbar.dependencies>node.js</bitbar.dependencies>
// <bitbar.abouturl>https://github.com/yenbekbay/itc-stats</bitbar.abouturl>

'use strict';

const _ = require('lodash');
const bitbar = require('bitbar');
const itc = require('itunesconnect');
const keychain = require('keychain');
const moment = require('moment');
const request = require('request');
const runApplescript = require('run-applescript');
const Rx = require('rx-lite');

const config = require('./config');
const pkg = require('./package');

const parseSinceDate = () => {
  let sinceDate;

  if (!config.sinceDate.match(/([0-9]{4})-([0-9]{2})-([0-9]{2})/)) {
    const descMatch = config.sinceDate.match(/([0-9]+)([a-zA-Z]+)/);

    if (descMatch && descMatch.length > 2) {
      sinceDate = moment().subtract(descMatch[1], descMatch[2]);
    }
  } else {
    sinceDate = moment(config.sinceDate);
  }

  const yesterday = moment().subtract(1, 'day');

  if (!sinceDate || !sinceDate.isValid || sinceDate.isAfter(yesterday)) {
    // If given value is in the future or is invalid, return yesterday
    sinceDate = yesterday;
  }

  return sinceDate;
};

const appleId = config.appleId;
const sinceDate = parseSinceDate();
const colors = {
  red: '#c91b00',
  green: '#00c200',
  yellow: '#c7c400'
};

const getPassword = () => {
  return Rx.Observable
    .fromNodeCallback(keychain.getPassword, keychain)({
      account: appleId,
      service: pkg.name
    })
    .catch(() => Rx.Observable.return(null))
    .flatMap(savedPassword => {
      if (savedPassword) {
        return Rx.Observable.return(savedPassword);
      }

      const command = `
display dialog "What is the password for your Apple  ID?" default answer ""
set result to text returned of result
return result`;
      return Rx.Observable
        .fromPromise(runApplescript(command))
        .flatMap(password => Rx.Observable
          .create(observer => {
            const itunesConnect = new itc.Connect(appleId, password, {
              loginCallback: cookies => {
                observer.onNext(password);
                observer.onCompleted();
              }
            });

            itunesConnect.request(itc.Report.ranked(), () => {});
          })
          .timeout(8000)
        )
        .flatMap(password => Rx.Observable
          .fromNodeCallback(keychain.setPassword, keychain)({
            account: appleId,
            service: pkg.name,
            password: password
          })
          .concat(Rx.Observable.return(password))
        );
    });
};

const getStats = itunesConnect => {
  return Rx.Observable
    .fromNodeCallback(itunesConnect.request, itunesConnect)(
      itc.Report.ranked({ start: sinceDate.format('YYYY-MM-DD') })
    )
    .map(([results]) => results.map(item => ({
      type: item.contentSpecificTypeName,
      title: item.title,
      id: parseInt(item.key, 10),
      units: item.units
    })))
    .flatMap(stats => Rx.Observable.merge(stats.map(stat => Rx.Observable
      .fromNodeCallback(request)({
        url: `http://itunes.apple.com/lookup?id=${stat.id}`,
        headers: { 'User-Agent': 'itc-stats' },
        gzip: true,
        encoding: null
      })
      .map(([response, body]) => {
        if (response.statusCode === 200) {
          const result = JSON.parse(body).results[0];

          if (result) {
            return {
              average: result.averageUserRating,
              votersCount: result.userRatingCount
            };
          }

          throw new Error('Na rating found with lookup');
        } else {
          throw new Error(`Status code ${response.statusCode}`);
        }
      })
      .catch(() => Rx.Observable.return({
        average: 0.0,
        votersCount: 0
      }))
      .map(rating => _.set(stat, 'rating', rating))
    )))
    .toArray()
    .map(stats => _(stats).sortBy('units').reverse().value());
};

getPassword()
  .flatMap(password => getStats(new itc.Connect(appleId, password)))
  .subscribe(
    stats => {
      const relativeSinceDate = sinceDate.fromNow(true);
      const intervalSinceDate = [sinceDate, moment()]
        .map(moment => moment.format('YYYY-MM-DD'))
        .slice(0, sinceDate.isSame(moment(), 'day') ? 1 : 2)
        .join(' - ');

      const lines = stats.map(stat => `${stat.title}: ${stat.units}`);

      let output = [
        {
          text: _.sumBy(stats, 'units'),
          dropdown: false
        },
        bitbar.sep,
        `Stats for ${relativeSinceDate} (${intervalSinceDate})`,
        bitbar.sep,
        ...lines,
        bitbar.sep,
        {
          text: 'Refresh',
          refresh: true
        }
      ];

      bitbar(output);
    },
    err => {
      bitbar([
        {
          text: '?',
          color: colors.red,
          dropdown: false
        },
        bitbar.sep,
        {
          text: err.message
        },
        bitbar.sep,
        {
          text: 'Refresh',
          refresh: true
        }
      ]);
    }
  );
