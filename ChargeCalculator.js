class ChargeCalculator {

    calculateCharges(rows) {
        var totalCharges = 0;
        if (rows.length < 1) return 0;
        var prevEventType = rows[0].EVENT_TYPE;
        var vmType = rows[0].VM_TYPE;
        var prevTime = new Date(rows[0].EVENT_TIME).getTime();

        for (var i = 1; i < rows.length; i++) {
            var currTime = new Date(rows[i].EVENT_TIME).getTime();
            var currType = rows[i].EVENT_TYPE;

            // We don't care if the VM was created :-).
            if (currType == "CREATE") continue;
            // We don't care if the VM was stopped beforehand.
            // We also don't care if we're just starting the VM.
            if (!(prevEventType == "STOP" || currType == "START")) {
                var deltaTime = (currTime-prevTime)/60000; // minutes
                prevTime = currTime;
                switch (vmType) {
                    case "BASIC":
                        totalCharges += deltaTime*0.05;
                        break;
                    case "LARGE":
                        totalCharges += deltaTime*0.10;
                        break;
                    case "ULTRA":
                        totalCharges += deltaTime*0.15;
                        break;
                    default:
                        break;
                }
            // Update the timestamp if we're between VMs
            } else if (prevEventType == "STOP" && currType == "START") {
                prevTime = currTime;
            }

            // Update the VM type and previous event type with current.
            vmType = rows[i].VM_TYPE;
            prevEventType = currType;
        }
        return totalCharges;
    }
}

module.exports = ChargeCalculator;