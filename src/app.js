// Added References of Nodemailer and Steemjs and fs
const fs = require("fs");
let nodemailer = require('nodemailer');
let steem = require('steem');

config = JSON.parse(fs.readFileSync("config.json"));

let transporter = nodemailer.createTransport({
    service: config.Service,
    auth: {
      user: config.Sender_Email,
      pass: config.Password
    }
  });


//GetCurrentTransaction();

function GetCurrentTransaction() {
    steem.api.getAccountHistory(config.Steem_account, -1, 100, (err, result) => {
        let received = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].to === config.Steem_account);
        let sended = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].from === config.Steem_account);
    });
}

function SendNotification(mail, to, title, body){
    let mailOptions = {
        from: mail,
        to: to,
        subject: title,
        text: body
    };
    
    transporter.sendMail(mailOptions, function(err, res){
        if(err) {
            console.log('Mail Sending failed for '+err.message);
        }else{
            console.log('Notification Email Sent Successfully!');
        }
    });
}

