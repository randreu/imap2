var util = require('util'),
      ImapConnection = require('imap').ImapConnection;

var fs = require('fs');
var config = JSON.parse(fs.readFileSync(process.cwd()+"/config.json", "utf-8"));

  var imap = new ImapConnection({
        username: config.username,
        password: config.password,
        host: config.imap.host,
        port: config.imap.port,
        secure: config.imap.secure
      }); 

  function show(obj) {
    return util.inspect(obj, false, Infinity);
  }

  function die(err) {
    console.log('Uh oh: ' + err);
    process.exit(1);
  }

  function openInbox(cb) {
    imap.connect(function(err) {
      if (err) die(err);
      imap.openBox('INBOX', false, cb);
    });
  }

openInbox(function(err, mailbox) {
    if (err) die(err);
    var fetch = imap.seq.fetch(mailbox.messages.total + ':*',
                               { request: {
                                   headers: ['from'],
                                   body: true,
                                   struct: false } });
    fetch.on('message', function(msg) {
      console.log('Got a message with sequence number ' + msg.seqno);
      var body = '';
      msg.on('data', function(chunk) {
        body += chunk.toString('utf8');
      });
      msg.on('end', function() {
        // msg.headers is now an object containing the requested header(s) ...
        console.log('Finished message.');
        console.log('UID: ' + msg.uid);
        console.log('Flags: ' + msg.flags);
        console.log('Date: ' + msg.date);
        console.log('From: ' + msg.headers.from[0]);
        console.log('Body: ' + body);
      });
    });
    fetch.on('end', function() {
      console.log('Done fetching all messages!');
      imap.logout();
    });
  });
