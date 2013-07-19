var util = require('util'),
      ImapConnection = require('imap').ImapConnection;
var MailParser = require("mailparser").MailParser;

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
    imap.search([ 'UNSEEN', ['SINCE', 'May 20, 2013'] ], function(err, results) {
      if (err) die(err);
      var fetch = imap.fetch(results, {
        request: {
          headers: ['from', 'to', 'subject', 'date'],
                    body : true,
                    struct : true 
        }
      });
      fetch.on('message', function(msg) {
        console.log('Got a message with sequence number ' + msg.seqno);
                var mailparser = new MailParser();
                mailparser.on("end", function(mail_object){
                    //console.log(mail_object.text);
                        console.log('UID: ' + msg.uid);
                console.log('Flags: ' + msg.flags);
                console.log('Date: ' + msg.date);
                console.log('From: ' + msg.headers.from[0]);
                //console.log('Body: ' + body);
                        fs.writeFileSync(msg.uid + '_text.txt', mail_object.text );
                });

        msg.on('data', function(chunk) {
                    mailparser.write(chunk);
        });
        msg.on('end', function() {
                    mailparser.end();
        });
      });
      fetch.on('end', function() {
        imap.logout();
      });
    });
  });
