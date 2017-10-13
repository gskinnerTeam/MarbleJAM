var camera, scene, renderer, effect, controls, vrControls, light;
var controller1, controller2;
var mobile = false;
var vr = false;
var useLights = true;
var cubeMap = 11;
var container = new THREE.Group();

var track = "./assets/Magic Trooper.mp3";

var material = null;

function init() {

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0,40,40);
    //camera.rotation.set(Math.PI/4,0,0);

    controls = new THREE.OrbitControls(camera);
    controls.autoRotate = true;

    addEvents();
}

var lights = [];
var NUM_LIGHTS = 3;

var envMap = getCubeMap(cubeMap);

var skyBoxMaterial = null;

var cubes = [];
var spheres = [];
var group = new THREE.Object3D();//create an empty container
var max = 5;
var texture;
var stage, cont = new createjs.Container(), background;
function setup() {

	if (useLights) {
		for (var i = 0; i < NUM_LIGHTS; i++) {
			var l = new THREE.DirectionalLight(0x333333);
			l.position.set(Math.random(), Math.random(), Math.random());
			lights.push(l);
			scene.add(l);
		}
	}

	var cubeShader = THREE.ShaderLib['cube'];
	cubeShader.uniforms['tCube'].value = getCubeMap(cubeMap);

	var skyBoxMaterial = new THREE.ShaderMaterial({
													  fragmentShader: cubeShader.fragmentShader,
													  vertexShader: cubeShader.vertexShader,
													  uniforms: cubeShader.uniforms,
													  depthWrite: false,
													  side: THREE.BackSide
												  });

	var skyBox = new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200), skyBoxMaterial);

	//scene.add(skyBox);

	// objects
	material = new THREE.MeshPhysicalMaterial({
												  metalness: 1,
												  roughness: 0.9,
												  shading: THREE.SmoothShading,
												  envMap: getCubeMap(4)
											  });


	var cw = 1024;
	var canvas = document.createElement("canvas");
	canvas.width = canvas.height = cw;
	stage = new createjs.Stage(canvas); stage.autoClear = false;
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.on("tick", stage);

	cont.x = cont.y = cw/2;
	stage.addChild(cont);
	background = new createjs.Shape();
	background.graphics.f("black").dr(-cw/2,-cw/2,cw,cw);
	cont.addChild(background);
	document.body.appendChild(canvas);

	texture = new THREE.CanvasTexture(canvas);

	var mat = new THREE.MeshPhysicalMaterial({
													  metalness: 0,
													  roughness: 0.3,
													  shading: THREE.SmoothShading,
													  map: texture,
		envMap: getCubeMap(4),
		transparent:true
												  });

	//mat = new THREE.MeshBasicMaterial({map: texture});

	var geo = new THREE.PlaneGeometry(1,1 ,1, 1),
			base = new THREE.Mesh(geo, mat);
	base.rotation.set(-Math.PI/2, 0, 0);
	base.scale.x = base.scale.z = base.scale.y = canvas.width/4;
	scene.add(base);


	// Create initial set
	for (var i = 0, l = 80; i < l; i++) {
		var r = Rnd(0.5, max),
				s = new THREE.SphereGeometry(r, 20, 20),
				sp = new THREE.Mesh(s, material);
		sp.r = r;
		sp.direction = 0; // Still
		var loopCount = 0, okay = false;
		while (loopCount++ < 30) {
			sp.position.set(Rnd(130) - 50, r, Rnd(130) - 50);
			okay = !isClose(sp);
			if (okay) { break; }
		}
		if (okay) {
			spheres.push(sp);
			group.add(sp);
		}
	}
	scene.add(group);

	//LabTemplate.loadComplete();
}

function isClose(sphere) {
	var close = spheres.find(s => {
		var distX = s.position.x - sphere.position.x,
				distY = s.position.z - sphere.position.z,
				dist = Math.sqrt(distX*distX+distY*distY);
		return dist < s.r+sphere.r;
	});
	return close != null;
}


var rot = 0;
function update(o) {

	if (o.all.hit || o.low.hit || o.high.hit) {
		spheres.forEach(function(sphere) {
			var f = (1-Math.pow(o.all.avg, 4)) * (5.5-sphere.r);
			
			if (!sphere.animating || sphere.posY < 0.25) {//} && sphere.r/max > o.all) {
				createjs.Tween.get(sphere, {override:true})
						.set({animating:true, loud:o.all.avg})
						.to({posY:10*f}, 120*f, createjs.Ease.quadOut)
						.to({posY:sphere.r}, 300*f, createjs.Ease.bounceOut)
						.set({animating:false, direction: 0});
			}
		});
	}
	background.alpha = o.all.val;
	spheres.forEach(function(sphere) {
		var dir = sphere.posY - sphere.position.y;
		if (dir > 0 && sphere.direction < 0) {
			addWave(sphere);
		}
		sphere.direction = sphere.posY - sphere.position.y; // Heading down
		sphere.position.setY(sphere.posY);
	});

	texture.needsUpdate = true;

    render(o);
}

function addWave(sphere) {
	var x = sphere.position.x,
			y = sphere.position.z;
	var shape = new createjs.Shape().set({x:x*4, y:y*4, scale:0, alpha:sphere.loud}),
			color = createjs.Graphics.getRGB(255,255-(sphere.r)/max*255|0, 0);
	shape.graphics.s(color).dc(0,0,sphere.r).ss(8,null,null,null,true);
	createjs.Tween.get(shape)
			.to({scale:4*sphere.r}, 500*sphere.r, createjs.Ease.quadOut)
			.call(function(tween) {
				cont.removeChild(tween.target);
			});
	createjs.Tween.get(shape)
			.wait(300*sphere.r)
			.to({alpha:0}, 200*sphere.r, createjs.Ease.quadIn);
	cont.addChild(shape);
}


function render() {
    var time = Date.now() * 0.001;

    if(lights.length > 0) {
        lights.forEach((light, i)=>{
        light.position.x = Math.sin(time*i);
        light.position.z = Math.cos(time*i);
        });
    }

    // vr

    if (vr) {
        vrControls.update();
        controller1.update();
        controller2.update();
        effect.requestAnimationFrame(render);
        effect.render(scene, camera);
        return;
    }

    controls.update();

    if (mobile) {
        camera.position.set(0, 0, 0);
        camera.translateZ(40);
    }
    renderer.render(scene, camera);
}



new JustAddMusic({
    src: track,
    label: "<b>JustAddMusic.js </b>", 
    ontick: update
});


init();
setup();
render();