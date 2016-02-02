var $ = require('jquery');

function CallStatistics() {
    console.log('loaded');
}

CallStatistics.prototype.initialize = function() {
    this.callStats = new callstats($,io,jsSHA);

    //initialize the app with application tokens
    var AppID     = 415266112;
    var AppSecret = '1e61zw+ZNXLV9G42am4iGwEVYhk=';

    function initCallback (err, msg) {
        console.log("Initializing Status: err="+err+" msg="+msg);
    }

    //userID is generated or given by the origin server
    this.callStats.initialize(AppID, AppSecret, 'local', initCallback, function(e) { console.log('stats', e) });
}

CallStatistics.prototype.monitorCall = function(peerConnection) {
    var usage = this.callStats.fabricUsage.multiplex;
    this.callStats.addNewFabric(peerConnection, 'remote', usage, 'conference');
}


module.exports = CallStatistics
