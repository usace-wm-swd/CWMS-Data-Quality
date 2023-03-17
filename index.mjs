/*
Little Endian i.e. 31....0
Bit Mappings :       
    bit 30              bit 20              bit 10

         3                   2                   1                     
     2 1 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2 1 

     P - - - - - T T T T T T T T T T T M M M M C C C D R R V V V V S
     |           <---------+---------> <--+--> <-+-> | <+> <--+--> |
     |                     |              |      |   |  |     |    +------Screened T/F
     |                     |              |      |   |  |     +-----------Validity Flags
     |                     |              |      |   |  +--------------Value Range Integer
     |                     |              |      |   +-------------------Different T/F
     |                     |              |      +---------------Replacement Cause Integer
     |                     |              +---------------------Replacement Method Integer
     |                     +-------------------------------------------Test Failed Flags
     +-------------------------------------------------------------------Protected T/F
*/


export default class QualityTx {
    constructor() {
        this.elementData = new Int32Array(32)
        this.size = 0;
        this.SCREENED_BIT = 1
        this.OKAY_BIT = 2
        this.MISSING_BIT = 3
        this.QUESTION_BIT = 4
        this.REJECT_BIT = 5
        this.RANGE_OF_VALUE_BIT0 = 6
        this.RANGE_OF_VALUE_BIT1 = 7
        this.VALUE_DIFFERS_BIT = 8
        this.HOW_REVISED_BIT0 = 9
        this.HOW_REVISED_BIT1 = 10
        this.HOW_REVISED_BIT2 = 11
        this.REPLACE_METHOD_BIT0 = 12
        this.REPLACE_METHOD_BIT1 = 13
        this.REPLACE_METHOD_BIT2 = 14
        this.REPLACE_METHOD_BIT3 = 15
        this.ABSOLUTEMAGNITUDE_BIT = 16
        this.CONSTANTVALUE_BIT = 17
        this.RATEOFCHANGE_BIT = 18
        this.RELATIVEMAGNITUDE_BIT = 19
        this.DURATIONMAGNITUDE_BIT = 20
        this.NEGATIVEINCREMENTAL_BIT = 21
        this.NOT_DEFINED_BIT0 = 22
        this.GAGELIST_BIT = 23
        this.NOT_DEFINED_BIT1 = 24
        this.USER_DEFINED_TEST_BIT = 25
        this.DISTRIBUTIONTEST_BIT = 26
        this.RESERVED_BIT0 = 27
        this.RESERVED_BIT1 = 28
        this.RESERVED_BIT2 = 29
        this.RESERVED_BIT3 = 30
        this.RESERVED_BIT4 = 31
        this.PROTECTED_BIT = 32
        this.MASK = [ 1, 2, 4, 8, 16, 32, 64, 128 ]
    }
    _getElementAt(elementIndex) {
        if (elementIndex > this.size || elementIndex < 0)
            throw new RangeError("Index of: " + elementIndex + " Out of range[0 - " + this.size);
        let byteIndex = elementIndex * 4;
        let bytes = new Uint8Array(4);
        for (let i = 0; i < 4; i++)
            bytes.push(this.elementData[byteIndex + i])
        return bytes;
    }
    _getIntegerAt(elementIndex) {
        let bytes = getElementAt(elementIndex);
        let i0 = bytes[0] & 0xFF;
        let i1 = bytes[1] & 0xFF;
        let i2 = bytes[2] & 0xFF;
        let i3 = bytes[3] & 0xFF;
        return i3 | i2 << 8 | i1 << 16 | i0 << 24;
    }
    _getInteger(bytes) {
        let i0 = bytes[0] & 0xFF;
        let i1 = bytes[1] & 0xFF;
        let i2 = bytes[2] & 0xFF;
        let i3 = bytes[3] & 0xFF;
        return i3 | i2 << 8 | i1 << 16 | i0 << 24;
    }
    _isQualityClear(bytes) {
        return (this._getInteger(bytes) == 0);
    }
    _isScreened(elementIndex) {
        return this._isBitSet(elementIndex, 1);
    }
    _isNotScreened(elementIndex) {
        return this._isBitClear(elementIndex, 1);
    }
    _isBitClear(elementIndex, bitPosition) {
        return !this._isBitSet(elementIndex, bitPosition);
    }
    _isBitSet(elementIndex, bitPosition) {
        if (typeof elementIndex == "object") {
            let bytes = elementIndex
            // Round down the targetByte
            let targetByte = Math.floor((32 - bitPosition) / 8);
            let targetBit = (bitPosition - 1) % 8;
            let base = bytes[targetByte];
            let result = base & this.MASK[targetBit];
            return (result != 0);
        } else {
            // If not an array, convert it into one
            if (elementIndex > this.size || elementIndex < 0)
                throw new RangeError("Index of: " + elementIndex + " Out of range[0 - " + this.size + "]");
            let bytes = this._getElementAt(elementIndex);
            return this._isBitSet(bytes, bitPosition);
        }
    }
    _isRange1(bytes) {
        if (this._isBitSet(bytes, 6) && this._isBitClear(bytes, 7))
            return true;
        return false;
    }
    _isRange2(bytes) {
        if (this._isBitClear(bytes, 6) && this._isBitSet(bytes, 7))
            return true;
        return false;
    }
    _isRange3(bytes) {
        if (this._isBitSet(bytes, 6) && this._isBitSet(bytes, 7))
            return true;
        return false;
    }
    _isDifferentValue(bytes) {
        return this._isBitSet(bytes, 8);
    }

    _isRevisedAutomatically(bytes) {
        if (this._isBitSet(bytes, 9) &&
            this._isBitClear(bytes, 10) &&
            this._isBitClear(bytes, 11))
            return true;
        return false;
    }
    _isRevisedInteractively(bytes) {
        if (this._isBitClear(bytes, 9) &&
            this._isBitSet(bytes, 10) &&
            this._isBitClear(bytes, 11))
            return true;
        return false;
    }
    _isRevisedManually(bytes) {
        if (this._isBitSet(bytes, 9) &&
            this._isBitSet(bytes, 10) &&
            this._isBitClear(bytes, 11))
            return true;
        return false;
    }
    _isRevisedToOriginalAccepted(bytes) {
        if (this._isBitClear(bytes, 9) &&
            this._isBitClear(bytes, 10) &&
            this._isBitSet(bytes, 11))
            return true;
        return false;
    }
    _isReplaceLinearInterpolation(bytes) {
        if (this._isBitSet(bytes, 12) &&
            this._isBitClear(bytes, 13) &&
            this._isBitClear(bytes, 14) &&
            this._isBitClear(bytes, 15))
            return true;
        return false;
    }
    _isReplaceManualChange(bytes) {
        if (this._isBitClear(bytes, 12) &&
            this._isBitSet(bytes, 13) &&
            this._isBitClear(bytes, 14) &&
            this._isBitClear(bytes, 15))
            return true;
        return false;
    }
    _isReplaceWithMissing(bytes) {
        if (this._isBitSet(bytes, 12) &&
            this._isBitSet(bytes, 13) &&
            this._isBitClear(bytes, 14) &&
            this._isBitClear(bytes, 15))
            return true;
        return false;
    }
    _isReplaceGraphicalChange(bytes) {
        if (this._isBitClear(bytes, 12) &&
            this._isBitClear(bytes, 13) &&
            this._isBitSet(bytes, 14) &&
            this._isBitClear(bytes, 15))
            return true;
        return false;
    }
    _getValidity(bytes) {
        if (this._isBitSet(bytes, 2))
            return "OKAY"
        if (this._isBitSet(bytes, 3))
            return "MISSING"
        if (this._isBitSet(bytes, 4))
            return "QUESTIONABLE"
        if (this._isBitSet(bytes, 5))
            return "REJECTED"
        return "UNKNOWN"
    }
    _getRange(bytes) {
        if (this._isRange1(bytes))
            return "RANGE_1"
        if (this._isRange2(bytes))
            return "RANGE_2"
        if (this._isRange3(bytes))
            return "RANGE_3"
        return "NO_RANGE"
    }
    _getReplaceCause(bytes) {
        if (this._isRevisedAutomatically(bytes))
            return "AUTOMATIC"
        if (this._isRevisedInteractively(bytes))
            return "INTERACTIVE"
        if (this._isRevisedManually(bytes))
            return "MANUAL"
        if (this._isRevisedToOriginalAccepted(bytes))
            return "RESTORED"
        return "NONE"
    }
    _getReplaceMethod(bytes) {
        if (this._isReplaceLinearInterpolation(bytes))
            return "LIN_INTERP"
        if (this._isReplaceManualChange(bytes))
            return "EXPLICIT"
        if (this._isReplaceWithMissing(bytes))
            return "MISSING"
        if (this._isReplaceGraphicalChange(bytes))
            return "GRAPHICAL"
        return "NONE"
    }
    _getTestFailed(bytes) {
        let failed = []
        if (this._isBitSet(bytes, 16))
            failed.push("ABSOLUTE_VALUE");
        if (this._isBitSet(bytes, 17))
            failed.push("CONSTANT_VALUE");
        if (this._isBitSet(bytes, 18))
            failed.push("RATE_OF_CHANGE");
        if (this._isBitSet(bytes, 19))
            failed.push("RELATIVE_VALUE");
        if (this._isBitSet(bytes, 20))
            failed.push("DURATION_VALUE");
        if (this._isBitSet(bytes, 21))
            failed.push("NEG_INCREMENT");
        if (this._isBitSet(bytes, 23))
            failed.push("SKIP_LIST");
        if (this._isBitSet(bytes, 25))
            failed.push("USER_DEFINED");
        if (this._isBitSet(bytes, 26))
            failed.push("DISTRIBUTION");
        return failed.length ? failed.join("+") : "NONE"
    }
    getStringDescription(intQuality, columns=false) {
        let bytes = new Uint8Array(4);
        bytes[3] = intQuality & 0xFF;
        bytes[2] = intQuality >> 8 & 0xFF;
        bytes[1] = intQuality >> 16 & 0xFF;
        bytes[0] = intQuality >> 24 & 0xFF;
        if (columns) {
            return {
                "QUALITY_CODE": intQuality,
                "SCREENED_ID": this._isScreened(bytes) ? "SCREENED" : "UNSCREENED",
                "VALIDITY_ID": this._getValidity(bytes),
                "RANGE_ID": this._getRange(bytes),
                "CHANGED_ID": this._isDifferentValue(bytes) ? "MODIFIED" : "ORIGINAL",
                "REPL_CAUSE_ID": this._getReplaceCause(bytes),
                "REPL_METHOD_ID": this._getReplaceMethod(bytes),
                "TEST_FAILED_ID": this._getTestFailed(bytes),
                "PROTECTED": this._isBitSet(bytes, 32) ? "PROTECTED" : "UNPROTECTED"
            }
        }
        if (this._isQualityClear(bytes))
            return "Quality is undetermined";
        let sb = []
        if (this._isScreened(bytes)) {
            sb.push("Screened");
        } else {
            sb.push("Not Screened?");
        }
        if (this._isBitSet(bytes, 2)) {
            if (sb.length > 0)
                sb.push(", ");
            sb.push("Passed tests OK");
        }
        if (this._isBitSet(bytes, 3)) {
            if (sb.length > 0)
                sb.push(", ");
            sb.push("Set to Missing");
        }
        if (this._isBitSet(bytes, 4)) {
            if (sb.length > 0)
                sb.push(", ");
            sb.push("Questionable Quality");
        }
        if (this._isBitSet(bytes, 5)) {
            if (sb.length > 0)
                sb.push(", ");
            sb.push("Rejected Quality");
        }
        if (this._isRange1(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Value is between first and second range limit");
        }
        if (this._isRange2(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Value is between second and third range limit");
        }
        if (this._isRange3(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Value is above third range limit");
        }
        if (this._isDifferentValue(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Current value is different from original value");
        }
        if (this._isRevisedAutomatically(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Revised automatically by DATCHK or other Process");
        }
        if (this._isRevisedInteractively(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Revised interactively with DATVUE or CWMS Verification Editor");
        }
        if (this._isRevisedManually(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Manual entry with DATVUE or CWMS Verification Editor");
        }
        if (this._isRevisedToOriginalAccepted(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Original value accepted in DATVUE or CWMS Verification Editor");
        }
        if (this._isReplaceLinearInterpolation(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Replacement method: linear interpolation");
        }
        if (this._isReplaceManualChange(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Replacement method: manual change");
        }
        if (this._isReplaceWithMissing(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Replacement method: replace with missing value");
        }
        if (this._isReplaceGraphicalChange(bytes)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Replacement method: graphical change");
        }
        if (this._isBitSet(bytes, 16)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Absolute Magnitude");
        }
        if (this._isBitSet(bytes, 17)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Constant Value");
        }
        if (this._isBitSet(bytes, 18)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Rate-of-change");
        }
        if (this._isBitSet(bytes, 19)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Relative Magnitude");
        }
        if (this._isBitSet(bytes, 20)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Duration-magnitude");
        }
        if (this._isBitSet(bytes, 21)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Negative Incremental Value");
        }
        if (this._isBitSet(bytes, 23)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: On GAGE list as faulty gage");
        }
        if (this._isBitSet(bytes, 25)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: User-defined Test");
        }
        if (this._isBitSet(bytes, 26)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("Failed Test: Distribution Test");
        }
        if (this._isBitSet(bytes, 32)) {
            if (sb.length > 0) sb.push("\n");
            sb.push("PROTECTED from change or replacement");
        }
        return sb.toString()
    }
}
