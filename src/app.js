// Added References of Nodemailer and Steemjs and fs
const fs = require("fs");
let nodemailer = require('nodemailer');
let steem = require('steem');

config = JSON.parse(fs.readFileSync("config.json"));

var tempTransId = [];

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
    var preEmailList = GetExistiongEmail();
    var mailbody = "";
    transferlist.forEach(function (atransfer) {
        if (preEmailList.filter(tx => tx === atransfer[1].trx_id).length === 0) {
            if (mailbody === "") {
                mailbody = "\n============================\n" + transferType + " \n============================\n";
            }
            if (transferType === "Received") {
                mailbody += atransfer[1].op[1].amount + " " + transferType + " from " + atransfer[1].op[1].from + " at " + new Date(atransfer[1].timestamp).toString() + " \n";
            }
            else {
                mailbody += atransfer[1].op[1].amount + " " + transferType + " to " + atransfer[1].op[1].to + " at " + new Date(atransfer[1].timestamp).toString() + " \n";
            }

            tempTransId.push(atransfer[1].trx_id)
        }
    });

    return mailbody;
}

function SendNotification(mail, to, title, body) {
    if (tempTransId.length > 0) {
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
                SaveMailLog();
            }
        });
    }
    else{
        console.log('No Transaction Found !!!');
    }
}

function GetExistiongEmail() {
    var preEmailList = [];
    if (fs.existsSync('MailLog.json')) {
        const preEmail = JSON.parse(fs.readFileSync("MailLog.json"));
        if (preEmail.length) {
            preEmailList = preEmail;
        }
    }

    return preEmailList;
}

function SaveMailLog() {
    var NewMailLog = GetExistiongEmail().concat(tempTransId);
    fs.writeFile('MailLog.json', JSON.stringify(NewMailLog), function (err) {
        if (err) {
            console.log(err);
        }
        else {
            tempTransId = [];
        }
    });
}