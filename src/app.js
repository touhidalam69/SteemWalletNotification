// Added References of Nodemailer and Steemjs and fs
const fs = require("fs");
let nodemailer = require('nodemailer');
let steem = require('steem');

config = JSON.parse(fs.readFileSync("config.json"));

var tempTransId=[];


let transporter = nodemailer.createTransport({
    service: config.Service,
    auth: {
        user: config.Sender_Email,
        pass: config.Password
    }
});


GetCurrentTransaction();

function GetCurrentTransaction() {
    steem.api.getAccountHistory(config.Steem_account, -1, 500, (err, result) => {
        if (err) {
            console.log('Failed to retrive transection Data for ' + err.message);
        }
        else {
            let received = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].to === config.Steem_account);
            let sended = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].from === config.Steem_account);

            mailbody = mailbodymaker(received, "Received");
            mailbody += mailbodymaker(sended, "Sent");
            SendNotification(config.Sender_Email, config.Notification_Email, "Wallet Notification", mailbody);
        }
    });
}

function mailbodymaker(transferlist, transferType) {
    tempTransId=[];
    var mailbody = "\n============================\n" + transferType + " \n============================\n";
    transferlist.forEach(function (atransfer) {
        if (transferType === "Received") {
            mailbody += atransfer[1].op[1].amount + " " + transferType + " from " + atransfer[1].op[1].from + " at " + new Date(atransfer[1].timestamp).toString() + " \n";
        }
        else {
            mailbody += atransfer[1].op[1].amount + " " + transferType + " to " + atransfer[1].op[1].to + " at " + new Date(atransfer[1].timestamp).toString() + " \n";
        }

        tempTransId.push(atransfer[1].trx_id)

    });

    return mailbody;
}

function SendNotification(mail, to, title, body) {
    let mailOptions = {
        from: mail,
        to: to,
        subject: title,
        text: body
    };

    transporter.sendMail(mailOptions, function (err, res) {
        if (err) {
            console.log('Mail Sending failed for ' + err.message);
        } else {
            console.log('Notification Email Sent Successfully!');
        }
    });
}