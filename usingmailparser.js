var util = require('util'),
      ImapConnection = require('imap').ImapConnection;
var MailParser = require("mailparser").MailParser

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
          headers: ['from'],
					body : true,
					struct : false
        }
      });
      fetch.on('message', function(msg) {
        console.log('Got a message with sequence number ' + msg.seqno);
				var mailparser = new MailParser();

				mailparser.on("end", function(mail_object){
				    console.log("From:", mail_object.from); //[{address:'sender@example.com',name:'Sender Name'}]
  				  console.log("Subject:", mail_object.subject); // Hello world!
				    console.log("Text body:", mail_object.text); // How are you today?
				});

        msg.on('data', function(chunk) {
					mailparser.write(chunk);
        });
        msg.on('end', function() {
					mailparser.end();
        });
      });
      fetch.on('end', function() {
        console.log('Done fetching all messages!');
        imap.logout();
      });
    });
  });