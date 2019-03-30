const axios = require('axios');

class CloudUsageHelper {

    logEvent (cc_id, vm_id, event_type, vm_type) {
        axios.post( process.env.CUM_HOST + '/event', {
            cc_id:  cc_id,
            vm_id: vm_id,
            event_type: event_type,
            vm_type: vm_type
        }).catch(function (error) {
            // handle error
            console.log(error);
        });
    }

    emailLog () {
        axios.get(process.env.CUM_HOST + '/log')
            .catch(error => {
                // handle error
                console.log(error);
            });
    }
}
	
module.exports = CloudUsageHelper;