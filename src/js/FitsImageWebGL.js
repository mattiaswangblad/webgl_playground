import WebFile from './WebFile';
import BinaryReader from './BinaryReader';
import WcsImage from './WCSImage';

class FitsImageWebGL extends WcsImage {

    constructor(file, callMeBack) {
        super();
        this._header$1 = {};
        this.isHipsTile = false;
        this.sourceBlob = null;
        this.width = 0;
        this.height = 0;
        this.numAxis = 0;
        this.bZero = 0;
        this.bScale = 1;
        this.dataType = 5;
        this.containsBlanks = false;
        this.blankValue = Number.MIN_VALUE;
        this.maxVal = Number.MIN_VALUE;
        this.minVal = Number.MAX_VALUE;
        this.transparentBlack = true;
        this.lastMin = 0;
        this.lastMax = 255;
        this._color$1 = false;
        this._parseSuccessful$1 = false;
        this._sizeZ$1 = 1;
        this.depth = 1;
        this._bufferSize$1 = 1;
        this.lastScale = 0;
        this.lastBitmapMin = 0;
        this.lastBitmapMax = 0;
        this.lastBitmapZ = 0;
        this.lastBitmapColorMapperName = null;
        FitsImageWebGL.last = this;
        this._callBack$1 = callMeBack;
        this.filename = file;
        this.getFile(file);
    }
    createHipsTile(file, callMeBack) {
        var fits = new FitsImageWebGL(file, callMeBack);
        fits.isHipsTile = true;
        return fits;
    };
    isGzip(br) {
        var line = br.readBytes(2);
        br.seek(0);
        if (line[0] === 31 && line[1] === 139) {
            return true;
        }
        else {
            return false;
        }
    };
    getFile(url) {
        this._webFile$1 = new WebFile(url);
        this._webFile$1.responseType = 'blob';
        this._webFile$1.onStateChange = () => { this.fileStateChange() };
        this._webFile$1.send();
    }
    fileStateChange() {
        if (this._webFile$1.get_state() === 2) {
            console.log(this._webFile$1.get_message());
        }
        else if (this._webFile$1.get_state() === 1) {
            var mainBlob = this._webFile$1.getBlob();
            this._readFromBlob$1(mainBlob);
        }
    }

    trimEnd(s, tc) {
        var r = tc ? new RegExp('[' + tc.join('') + ']+$') : /\s+$/;
        return s.replace(r, '');
    }
    trim(s, tc) {
        if (tc || !String.prototype.trim) {
            tc = tc ? tc.join('') : null;
            var r = tc ? new RegExp('^[' + tc + ']+|[' + tc + ']+$', 'g') : /^\s+|\s+$/g;
            return s.replace(r, '');
        }
        return s.trim();
    }
    emptyString(s) {
        return !s || !s.length;
    }

    whitespace(s) {
        return this.emptyString(s) || !s.replace(/^\s*/, '').length;
    }
    keyExists(obj, key) {
        return obj[key] !== undefined;
    }
    truncate(n) {
        return (n >= 0) ? Math.floor(n) : Math.ceil(n);
    }

    emptyString(s) {
        return !s || !s.length;
    }

    _readFromBlob$1(blob) {
        var $this = this;

        this.sourceBlob = blob;
        var chunck = new FileReader();
        chunck.onloadend = function (e) {
            $this._readFromBin$1(new BinaryReader(new Uint8Array(chunck.result)));
            if ($this._callBack$1 != null && $this._parseSuccessful$1) {
                $this._callBack$1($this);
            }
        };
        chunck.readAsArrayBuffer(blob);
    }
    _readFromBin$1(br) {
        this.parseHeader(br);
    }
    _validateFitsSimple$1(br) {
        var pos = br.get_position();
        br.seek(0);
        var data = br.readByteString(8);
        var keyword = this.trimEnd(data);
        br.seek(pos);
        return keyword.toUpperCase() === 'SIMPLE';
    }
    parseHeader(br) {
        if (!this._validateFitsSimple$1(br)) {
            console.log('The requested file is not a valid FITS file.');
            return;
        }
        var foundEnd = false;
        while (!foundEnd && !br.get_endOfStream()) {
            for (var i = 0; i < 36; i++) {
                var data = br.readByteString(80);
                if (!foundEnd) {
                    var keyword = this.trimEnd(data.substring(0, 8));
                    var values = data.substring(10).split('/');
                    if (keyword.toUpperCase() === 'END') {
                        foundEnd = true;
                        i++;
                        data = br.readByteString(80);
                        while (this.whitespace(data)) {
                            i++;
                            data = br.readByteString(80);
                        }
                        keyword = this.trimEnd(data.substring(0, 8));
                        values = data.substring(10).split('/');
                        if (keyword.toUpperCase() === 'XTENSION') {
                            foundEnd = false;
                        }
                        else {
                            br.seekRelative(-80);
                        }
                    }
                    else {
                        this._addKeyword$1(keyword, values);
                    }
                }
            }
        }
        if (!foundEnd) {
            console.log('Unable to parse requested FITS file.');
            return;
        }
        this.numAxis = parseInt(this._header$1['NAXIS']);
        this.containsBlanks = this.keyExists(this._header$1, 'BLANK');
        if (this.containsBlanks) {
            this.blankValue = parseFloat(this._header$1['BLANK']);
        }
        if (this.keyExists(this._header$1, 'BZERO')) {
            this.bZero = parseFloat(this._header$1['BZERO']);
        }
        if (this.keyExists(this._header$1, 'BSCALE')) {
            this.bScale = parseFloat(this._header$1['BSCALE']);
        }
        this.axisSize = new Array(this.numAxis);
        for (var axis = 0; axis < this.numAxis; axis++) {
            this.axisSize[axis] = parseInt(this._header$1['NAXIS' + axis + 1]);
            this._bufferSize$1 *= this.axisSize[axis];
        }
        var bitsPix = parseInt(this._header$1['BITPIX']);
        this.dataType = 0;
        this._initDataBytes$1(br);
        if (this.numAxis > 1) {
            if (this.numAxis === 3) {
                if (this.axisSize[2] === 3) {
                    this._color$1 = true;
                }
            }
            if (this.numAxis > 2) {
                this._sizeZ$1 = this.depth = this.axisSize[2];
                this.lastBitmapZ = this.truncate((this._sizeZ$1 / 2));
            }
            this.sizeX = this.width = this.axisSize[0];
            this.sizeY = this.height = this.axisSize[1];
        }
        this._parseSuccessful$1 = true;
    }
    _addKeyword$1(keyword, values) {
        if (keyword !== 'CONTINUE' && keyword !== 'COMMENT' && keyword !== 'HISTORY' && !this.emptyString(keyword)) {
            try {
                if (this.keyExists(this._header$1, keyword)) {
                    this._header$1[keyword] = this.trim(values[0]);
                }
                else {
                    this._header$1[keyword.toUpperCase()] = this.trim(values[0]);
                }
            }
            catch ($e1) {
            }
        }
    }

    _initDataBytes$1(br) {
        this.buffer = br.readRemainingBytes(this._bufferSize$1);
    }

}


export default FitsImageWebGL;