import FitsImageWebGL from './FitsImageWebGL';

class Tile {

    constructor(gl, url) {
        this.gl = gl;
        this.url = url;
        this.useMipmap = false;
        this.nSteps = 128;
        this.populateVertexList(this.nSteps);
        this.loaded = false;
        this.image = new Image();
        this.initImage();
        this.onLoad();
        this.fits = new FitsImageWebGL("http://skies.esac.esa.int/Herschel/normalized/hips500_pnorm_allsky/Norder0/Dir0/Npix0.fits", () => { })
    }

    initImage() {
        this.image.onload = () => {
            this.onLoad();
        }
        this.image.setAttribute('crossorigin', 'anonymous');
        // this.image.src = this.url;
    }

    onLoad() {
        this.createTexture();
        this.setupBuffers();
        this.loaded = true;
    }

    populateVertexList(step) {
        this.vertexPosition = new Float32Array(5 * (step + 1) * (step + 1));
        this.vertexPositionBuffer = this.gl.createBuffer();
        this.indexArray = new Uint16Array(6 * (this.nSteps) * (this.nSteps));
        let i = 0;
        for (let y = 0; y <= step; y += 1) {
            for (let x = 0; x <= step; x += 1) {
                let index = y * (step + 1) + x;
                this.addVertexPosition((2.0 / step) * y - 1, (2.0 / step) * x - 1, 0.5, (1 / step) * y, (1 / step) * x, index);
                if (x > 0 && y > 0) {
                    this.indexArray[i++] = (y - 1) * (step + 1) + (x - 1);
                    this.indexArray[i++] = (y - 1) * (step + 1) + x;
                    this.indexArray[i++] = y * (step + 1) + (x - 1);

                    this.indexArray[i++] = y * (step + 1) + (x - 1);
                    this.indexArray[i++] = (y - 1) * (step + 1) + x;
                    this.indexArray[i++] = y * (step + 1) + x;
                }
            }
        }
        // let indexArray = new Uint16Array([0,1,2,0,1,3]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.gl.program.vertexPositionAttribute, 3, this.gl.FLOAT, false, 20, 0);
        this.gl.vertexAttribPointer(this.gl.program.textureCoordAttribute, 2, this.gl.FLOAT, false, 20, 12);
        this.gl.enableVertexAttribArray(this.gl.program.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.gl.program.textureCoordAttribute);
        this.vertexIndexBuffers = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexArray, this.gl.STATIC_DRAW);

        this.gl.program.samplerUniform = this.gl.getUniformLocation(this.gl.program, "uSampler0");
        this.gl.uniform1i(this.gl.program.samplerUniform, 0);

    }

    createTexture() {
        this.texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        if (this.useMipmap) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);// 4 times per pixel
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
    }

    addVertexPosition(x, y, z, u, v, index) {
        index *= 5;
        this.vertexPosition[index++] = x;
        this.vertexPosition[index++] = y;
        this.vertexPosition[index++] = z;
        this.vertexPosition[index++] = u;
        this.vertexPosition[index++] = v;
    }

    setupBuffers() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        // this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        let array = new Uint8Array([100, 255, 255, 0, 255, 0, 0, 255, 192, 192, 192, 255, 255, 255, 255, 255])
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R8, 2, 2, 0, this.gl.RED, this.gl.UNSIGNED_BYTE, array, 0);
        // this.gl.texImage2D(this.gl.TEXTURE_2D, 0,this.gl.RGBA,2,2,0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, array, 0);
        if (this.useMipmap) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }
        this.anythingToRender = true;
        this.textureLoaded = true;
    }

    draw() {
        if (this.loaded) {
            let nElements = 6 * (this.nSteps) * (this.nSteps)
            this.gl.drawElements(this.gl.TRIANGLES, nElements, this.gl.UNSIGNED_SHORT, 0);
        }
    }

}
export default Tile;