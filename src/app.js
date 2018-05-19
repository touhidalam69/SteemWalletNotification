// Added References of Nodemailer and Steemjs and fs
const fs = require("fs");
let nodemailer = require('nodemailer');
let steem = require('steem');

// Geting Data from config.json
config = JSON.parse(fs.readFileSync("config.json"));

// Declaring a viriable, which will use later
var tempTransId = [];

// Configuring transporter for Sent mail
let transporter = nodemailer.createTransport({
    service: config.Service,
    auth: {
        user: config.Sender_Email,
        pass: config.Password
    }
});

console.log("Application Starting...");

//Calling for Latest Transaction
GetCurrentTransaction();

// Creating a Loop for Checking New Transaction
setInterval(GetCurrentTransaction, 300000); //960000 for 16 minutes, 300000 for 5 minutes, 60000 for 1 min

function GetCurrentTransaction() {
    console.log('########################################################################################');
    console.log("Starting new session at "+new Date().toString());
    // Getting Latest 500 Transactions
    steem.api.getAccountHistory(config.Steem_account, -1, 500, (err, result) => {
        if (err) {
            console.log('Failed to retrive transection Data for ' + err.message);
        }
        else {
            // Filter Received Transactiuon
            let received = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].to === config.Steem_account);
            // Filter Sent Transactiuon
            let sended = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].from === config.Steem_account);

            //Making Received Transaction Body
            mailbody = mailbodymaker(received, "Received");

            //Making Sent Transaction Body
            mailbody += mailbodymaker(sended, "Sent");

            // Call this function to sent notification
            SendNotification(config.Sender_Email, config.Notification_Email, "Wallet Notification", mailbody);
        }
    });
}

// Mail Body making by this Function
function mailbodymaker(transferlist, transferType) {
    // Geting Previous Mailed Transaction Id
    var preEmailList = GetExistiongEmail();
    // Declaring Mail Body
    var mailbody = "";
    // Creating Loop on transferlist
    transferlist.forEach(function (atransfer) {
        // Filtering Transaction Which already mailed
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

            // New Transaction Ids Adding for Store on log file
            tempTransId.push(atransfer[1].trx_id)
        }
    });

    return mailbody;
}

function SendNotification(mail, to, title, body) {
    // Checking New Transaction
    if (tempTransId.length > 0) {
        let mailOptions = {
            from: mail,
            to: to,
            subject: title,
            text: body
        };
        // Mail Sending Function
        transporter.sendMail(mailOptions, function (err, res) {
            if (err) {
                console.log('Mail Sending failed for ' + err.message);
            } else {
                console.log('Notification Email Sent Successfully!');
                // Calling function to save new mail log
                SaveMailLog();
            }
        });
    }
    else {
        console.log('No New Transaction Found !!!');
    }
}

// This function will return transaction list which Already maild
function GetExistiongEmail() {
    var preEmailList = [];
    if (fs.existsSync('MailLog.json')) {
        // Reading MailLog.json file
        const preEmail = JSON.parse(fs.readFileSync("MailLog.json"));
        if (preEmail.length) {
            preEmailList = preEmail;
        }
    }

    return preEmailList;
}

function SaveMailLog() {
    // Marging New transaction ids with previous
    var NewMailLog = GetExistiongEmail().concat(tempTransId);
    //Storing Marged Transaction List
    fs.writeFile('MailLog.json', JSON.stringify(NewMailLog), function (err) {
        if (err) {
            console.log(err);
        }
        else {
            tempTransId = [];
        }
    });
}