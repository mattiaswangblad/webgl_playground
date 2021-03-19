import Tile from './Tile';

class TestApp{
	constructor(){
		this.init();
	}

	
	init(){
		if (DEBUG){
			console.log("[FVApp::init]");
		}
		var canvas = document.getElementById("webglcanvas");
		
		try {
			if (DEBUG){
				console.log(canvas);
			}
			
			this.gl = canvas.getContext("webgl2", {
				alpha: false
			});
			let params = new URLSearchParams(location.search);
			if (params.get('debug') != null){
				console.warn("WebGL DEBUG MODE ON");
				this.gl = WebGLDebugUtils.makeDebugContext(this.gl);	
			}
			
			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
			this.gl.clearColor(0.412, 0.412, 0.412, 1.0);
			
			this.gl.enable(this.gl.DEPTH_TEST);
			
		} catch (e) {
			console.log("Error instansiating WebGL context");
		}
		if (!this.gl) {
			alert("Could not initialise WebGL, sorry :-(");
		}
		
		
		global.gl = this.gl;
		
		this.initShaders()
		this.loadData()
	};

	loadData(){
		let imgUrl = "http://skiesdev.esac.esa.int/hst-outreach3/Norder9/Dir160000/Npix167928.png";
		this.tile = new Tile(this.gl, imgUrl);
	}
	
	initShaders () {
		var _self = this;
		var fragmentShader = getShader("hips-shader-fs");
		var vertexShader = getShader("hips-shader-vs");
		this.shaderProgram = this.gl.createProgram();
		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
		this.gl.linkProgram(this.shaderProgram);
		this.gl.program = this.shaderProgram;

		if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");


	    function getShader(id){
	    	var shaderScript = document.getElementById(id);
			if (!shaderScript) {
				return null;
			}

			var str = "";
			var k = shaderScript.firstChild;
			while (k) {
				if (k.nodeType == 3) {
					str += k.textContent;
				}
				k = k.nextSibling;
			}

			var shader;
			if (shaderScript.type == "x-shader/x-fragment") {
				shader = _self.gl.createShader(_self.gl.FRAGMENT_SHADER);
			} else if (shaderScript.type == "x-shader/x-vertex") {
				shader = _self.gl.createShader(_self.gl.VERTEX_SHADER);
			} else {
				return null;
			}

			_self.gl.shaderSource(shader, str);
			_self.gl.compileShader(shader);

			if (!_self.gl.getShaderParameter(shader, _self.gl.COMPILE_STATUS)) {
				alert(_self.gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
	    }

	}

	run(){
		if (DEBUG){
			console.log("[FVApp::run]");
		}
		this.tick();
	};
	
	tick() {
		
		this.drawScene();
		if(DEBUG){
			// Only do this at DEBUG since every getError call takes 5-10ms
			var error = this.gl.getError();
			if (error != this.gl.NO_ERROR && error != this.gl.CONTEXT_LOST_WEBGL) {
				console.log("GL error: "+error);
			}
		}

		this.fabVReqID = requestAnimationFrame(()=>this.tick());
		
	}

	
	drawScene(){
		this.tile.draw();
		console.log("drawing")
	};
	
	
}

export default TestApp;