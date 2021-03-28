import Tile from './Tile';

class TestApp {
	constructor() {
		this.init();
	}


	init() {
		let DEBUG = true
		var canvas = document.getElementById("webglcanvas");

		try {
			if (DEBUG) {
				console.log(canvas);
			}

			this.gl = canvas.getContext("webgl2", {
				// alpha: false,
				premultipliedAlpha: false
			});
			if (!this.gl) {
				if (typeof WebGL2RenderingContext !== 'undefined') {
				  console.log('Your browser appears to support WebGL2 but it might be disabled. Try updating your OS and/or video card drivers');
				} else {
					console.log('Your browser has no WebGL2 support at all'); 
				}
				console.log('Testing WebGL1');
				//TODO check if safari -> recommend enabling webgl2 flag
				this.gl = canvas.getContext("webgl", {
					premultipliedAlpha: false
				});
				if (!this.gl) {
					console.log('WebGL1 not supported');
				} else {
					console.log('WebGL1 supported!');
				}

			  } else {
				console.log('WebGL2 Supported!');
			  }

			if (DEBUG) {
				console.log(this.gl);
			}
			let params = new URLSearchParams(location.search);
			if (params.get('debug') != null) {
				console.warn("WebGL DEBUG MODE ON");
				this.gl = WebGLDebugUtils.makeDebugContext(this.gl);
			}

			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
			this.gl.viewport(0, 0, canvas.width, canvas.height);
			this.gl.clearColor(0.412, 0.412, 0.412, 1.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT)
			this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
			this.gl.enable(this.gl.BLEND);
			this.gl.disable(this.gl.DEPTH_TEST);

		} catch (e) {
			console.log("Error instansiating WebGL context");
		}

		this.initShaders()
		this.loadData()
	};

	loadData() {
		let imgUrl = "http://skiesdev.esac.esa.int/hst-outreach3/Norder9/Dir160000/Npix167928.png";
		this.tile = new Tile(this.gl, imgUrl);
	}

	initShaders() {
		var _self = this;
		var fragmentShader = getShader("hips-shader-fs");
		var vertexShader = getShader("hips-shader-vs");
		this.shaderProgram = this.gl.createProgram();
		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
		this.gl.linkProgram(this.shaderProgram);
		this.gl.useProgram(this.shaderProgram);
		this.gl.program = this.shaderProgram;


		if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");


		function getShader(id) {
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
				console.error(_self.gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}

	}

	run() {
		this.tick();
	};

	tick() {

		this.drawScene();
		DEBUG = true;
		if (DEBUG) {
			// Only do this at DEBUG since every getError call takes 5-10ms
			var error = this.gl.getError();
			if (error != this.gl.NO_ERROR && error != this.gl.CONTEXT_LOST_WEBGL) {
				console.log("GL error: " + error);
			}
		}

		requestAnimationFrame(() => this.tick());
	}


	drawScene() {
		this.tile.draw();
		// console.log("drawing")
	};


}

export default TestApp;