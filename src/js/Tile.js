
class Tile {

	constructor(gl, url) {
		this.gl = gl;
		this.url = url;
        this.useMipmap = true
        this.nSteps = 10;
        this.populateVertexList(this.nSteps);
        this.loaded = false;
        this.image = new Image();
        this.initImage();
	}
    
    initImage(){
        this.image.onload = ()=> {
            this.onLoad();
        }
        this.image.setAttribute('crossorigin', 'anonymous');
        this.image.src = this.url;
    }
    
    onLoad(){
        this.createTexture();
        this.setupBuffers();
        this.loaded = true;
    } 

    populateVertexList(step){
        this.vertexPosition = new Float32Array(5 * (this.nSteps + 1) * (this.nSteps + 1));
        this.vertexPositionBuffer = this.gl.createBuffer();
		let indexArray = new Uint16Array((this.nSteps + 1) * (this.nSteps + 1));
        for (let y = 0; y <= step; y += 1){
			for (let x = 0; x <= step; x += 1){
                let index = y * (step + 1) + x;
                indexArray[index] = index;
				this.addVertexPosition((1 / step) * y, (1 / step) * x, 0, (1 / step) * y, (1 / step) * x, index);
			}
		}

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);

        this.vertexIndexBuffers = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.STATIC_DRAW);
    }

    createTexture(){
        this.texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        if(this.useMipmap){
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);// 4 times per pixel
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
    }

    addVertexPosition(x, y, z, u , v, index) {
		index *= 5;
		this.vertexPosition[index++] = x;
		this.vertexPosition[index++] = y;
		this.vertexPosition[index++] = z;
		this.vertexPosition[index++] = u;
		this.vertexPosition[index++] = v;
	}

    setupBuffers(){
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        if(this.useMipmap){
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }
        
        this.anythingToRender = true;
        this.textureLoaded = true;
    }

    draw(){
        if(this.loaded){
            let nElements = (this.nSteps + 1) * (this.nSteps + 1);
            this.gl.drawElements(this.gl.TRIANGLES,  nElements, this.gl.UNSIGNED_SHORT, 0);
        }
    }

}
export default Tile;