let log = require('../models/ILogger.js')

class Logger extends log {
    constructor() {
        super();
    }

    debug(primaryMessage, ...supportingData) {
        this.emitLogMessage("debug", primaryMessage, supportingData)

    }

    warn(primaryMessage, ...supportingData) {

        this.emitLogMessage("warn", primaryMessage, supportingData)

    }

    error(primaryMessage, ...supportingData) {

        this.emitLogMessage("error", primaryMessage, supportingData)

    }

    info(primaryMessage, ...supportingData) {

        this.emitLogMessage("info", primaryMessage, supportingData)

    }

    debugNg(primaryMessage, ...supportingData) {

        this.emitLogMessage("log", primaryMessage, supportingData)
    }

    emitLogMessage(msgType, msg, supportingData) {
        if (supportingData != null && supportingData.length > 0) {
            console[msgType](msg, supportingData)
        } else {
            console[msgType](msg)
        }
    }
}

module.exports = Logger;