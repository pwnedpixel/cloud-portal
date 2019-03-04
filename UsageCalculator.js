class UsageCalculator {

    calculateUsages(rows) {
        var basicUsage = 0;
        var largeUsage = 0;
        var ultraUsage = 0;
        if (rows.length < 1) return { basicUsage: basicUsage, largeUsage: largeUsage, ultraUsage: ultraUsage };
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
                        basicUsage += deltaTime;
                        break;
                    case "LARGE":
                        largeUsage += deltaTime;
                        break;
                    case "ULTRA":
                        ultraUsage += deltaTime;
                        break;
                    default:
                        break;
                }
            // Update the timestamp if we're between cycles
            } else if (prevEventType == "STOP" && currType == "START") {
                prevTime = currTime;
            } else if (currType == "DELETE") {
                break;
            }

            // Update the VM type and previous event type with current.
            vmType = rows[i].VM_TYPE;
            prevEventType = currType;
        }
        if (!(prevEventType == "STOP" || prevEventType == "DELETE")) {
            // Calculate delta to time now!
            var now = Date.now();
            var lastRecordTime = new Date(rows[rows.length-1].EVENT_TIME).getTime();
            vmType = rows[rows.length-1].VM_TYPE;
            var deltaTime = (now-lastRecordTime)/60000; // minutes
            switch (vmType) {
                case "BASIC":
                    basicUsage += deltaTime;
                    break;
                case "LARGE":
                    largeUsage += deltaTime;
                    break;
                case "ULTRA":
                    ultraUsage += deltaTime;
                    break;
                default:
                    break;
            }
        }
        return { basicUsage: basicUsage, largeUsage: largeUsage, ultraUsage: ultraUsage };
    }
}

module.exports = UsageCalculator;