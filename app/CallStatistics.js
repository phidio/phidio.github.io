var $ = require('jquery');

function CallStatistics() {
    this.localName = 'user1';
    this.remoteName = 'user2';

    if(window.location.href.indexOf('test') !== -1) {
        this.localName = 'user2';
        this.remoteName = 'user1';
    }

    console.log(this.localName);

    this.initialize();

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
    this.callStats.initialize(AppID, AppSecret, this.localName, initCallback, function(e) { console.log('stats', e) });
}

CallStatistics.prototype.monitorCall = function(peerConnection) {
    var usage = this.callStats.fabricUsage.multiplex;
    this.callStats.addNewFabric(peerConnection, this.remoteName, usage, 'conference');
}


module.exports = CallStatistics
