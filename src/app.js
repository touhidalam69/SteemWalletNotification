// Added References of Nodemailer and Steemjs and fs
const fs = require("fs");
let nodemailer = require('nodemailer');
let steem = require('steem');

config = JSON.parse(fs.readFileSync("config.json"));

GetCurrentTransaction();
function GetCurrentTransaction() {
    steem.api.getAccountHistory(config.Steem_account, -1, 100, (err, result) => {
        let received = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].to === config.Steem_account);
        let sended = result.filter(tx => tx[1].op[0] === 'transfer' && tx[1].op[1].from === config.Steem_account);
    });
}