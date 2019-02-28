const axios = require('axios');

class CloudUsageHelper {

	constructor( host ) {
		this.host = host;
	}
    
    logEvent (cc_id, vm_id, event_type, vm_type) {
        axios.post( this.host + '/event', {
            cc_id:  cc_id,
            vm_id: vm_id,
            event_type: event_type,
            vm_type: vm_type
        });
    }
}
	
module.exports = CloudUsageHelper;