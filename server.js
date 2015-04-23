var Logger = require('arsenic-logger');
var moment = require('moment');
var _ = require('underscore');
var exec = require('child_process').exec;
var argv = require('minimist')(process.argv.slice(2));

var apiKey = argv.apikey;
var metricGroupId = argv.metricgroupid; //rabbitmq_test";
var identifier = argv.identifier; //"Meetcentrale-test-tim";
var timestamp = moment().unix();

setInterval(function(){
    getQueueMeta(function(queues){
        var keys = _.keys(queues);
        var queue_depth = _.values(queues);
        var values = "";

        for(var i = 0; i < 3; i++){
            var label = "";
            switch(i){
                case 0:
                    label = "message_severa_storage_queue";
                    break;
                case 1:
                    label = "wmp_data_collector_commands";
                    break;
                case 2:
                    label = "wmp_data_exporter_commands";
                    break;
            }
            values += "\\\""+ label +"\\\": " + queue_depth[i];
            if(i != 3-1){
                values += ","
            }
        }

        var command = "curl -isk -u " + apiKey + ":U http://api.copperegg.com/v2/revealmetrics/samples/" + metricGroupId + ".json -H \"Content-Type: application/json\" -d \"{\\\"identifier\\\": \\\"" + identifier + "\\\",\\\"timestamp\\\": \\\"" + timestamp + "\\\", \\\"values\\\": {" + values + "}}\"";
        exec(command, function(error, stdout, stderr){
            Logger.info("Rabbitmq queue information sent");
            if(error){
                console.log("error: ", error);
            }
            if(stderr){
                console.log("stderr: ", stderr);
            }
        });
    });
}, 60000);

function getQueueMeta(callback){

    exec("sudo /usr/sbin/rabbitmqctl list_queues", function(error, stdout, stderr) {
        var queues = {};

        if (!error){

            var lines = stdout.split(/\n/);

            if (lines.length > 1){

                for (var i=1; i<lines.length-2; i++){
                    var temp = lines[i].split(/\s/);
                    queues[temp[0].trim()] = parseInt(temp[1]);
                }

            }

        }

        callback(queues);

    });

}