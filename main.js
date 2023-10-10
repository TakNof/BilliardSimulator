import * as THREE from "three";

import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import ShapeGenerator from "./ShapeGenerator.js";
import ScenePhysics from "./ScenePhysics.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const controls = new OrbitControls( camera,renderer.domElement );
controls.enableZoom = true; 
controls.minDistance = 1; 
controls.maxDistance = 100; 
controls.zoomSpeed = 1; 
controls.enablePan = true; 
controls.enableDamping = false; 
controls.DampingFactor= 0;

scene.background = new THREE.CubeTextureLoader()
	.setPath( 'assets/' )
	.load( [
        '1.png',
        '2.png',
        '3.png',
        '4.png',
        '5.png',
        '6.png'
	]);

let scenePhysics = new ScenePhysics(scene, {viewMovementHelper: false, energyLoss: 0.1});

let playAnimation = false;

let timeDivision = 1000;

let ballYo = 2;

let balls = new Array(10);
for(let i = 0; i < balls.length; i++){
    balls[i] = new ShapeGenerator("Sphere", [0.5, 32, 32], "Standard", {map: createTexture(`./assets/ball${rand(1, 5)}.jpg`), roughness: 0});
    balls[i].position.y = ballYo;
    balls[i].position.x = rand(0, 4);
    balls[i].position.z = rand(-4, 0);

    balls[i].castShadow = true;

    balls[i].createPhysics(scene, {velocityVector: [rand(-2, 2)/timeDivision*100, 0, rand(-2, 2)/timeDivision*100]});

    scene.add(balls[i]);
}

let floor = new ShapeGenerator("Box", [20, 1, 10], "Standard", {map: createTexture("./assets/table.jpg")});
floor.receiveShadow = true;
floor.position.y = -0.5;
scene.add(floor);

let walls = new Array(4);

for(let i = 0; i < walls.length; i++){
    let side = 1;
    let dimensions = [floor.geometry.parameters[checkProperty("x")], 2, floor.geometry.parameters[checkProperty("z")]];
    let axis = "x";

    if(i % 2 == 0){
        side = -1;
    }

    if(i < 2){
        dimensions[0] = 1;
        
    }else{
        dimensions[2] = 1;
        axis = "z";
    }

    walls[i] = new ShapeGenerator("Box", dimensions, "Standard", {map: createTexture("./assets/wood.jpg"), normalMap: createTexture("./assets/woodNM.jpg")});
    walls[i].receiveShadow = true;
    walls[i].position.y = dimensions[1]/2;
    walls[i].position[axis] = ((floor.geometry.parameters[checkProperty(axis)]/2) + floor.geometry.parameters.height/2)*side;
    scene.add(walls[i]);
    
}

let scenary = [floor, ...walls];

scenePhysics.add(...scenary, ...balls);

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

let light2 = createLight(0xffffff, 1, {x: 10, y: 10, z: 0});
scene.add(light2);

let light3 = createLight(0xffffff, 1, {x: 0, y: 0, z: 10});
scene.add(light3);

camera.position.y = 20;

function animate(time, delta) {
	requestAnimationFrame(animate);

    if(playAnimation){
        scenePhysics.checkWorldCollisions();
        playerInteraction();
        for(let ball of balls){
            ball.physics.move(1/timeDivision);
        }
    }
    renderer.render(scene, camera);
    controls.update();
}
animate();

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function playerInteraction(){ 
    raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(scene.children);

    if(intersects.length > 0){
        let element = intersects[0];

        if(element && element.object.physics){
            onclick = (event) =>{
                // element.object.material.color.set( 0xff0000 );
                element.object.physics.config.velocityVector = new THREE.Vector3().subVectors(camera.position, element.object.position).normalize().multiplyScalar(-0.2);
            } 
        } 
    }   
}

window.addEventListener('pointermove', onPointerMove );

window.addEventListener("keydown", function(event){
    switch (event.code) {
        case "Space":
            playAnimation = !playAnimation;
        break;

        case "ArrowLeft":
            timeDivision *= 10;
            // console.log(timeDivision);
        break;

        case "ArrowRight":
            timeDivision /= 10;
            // console.log(timeDivision);
        break;

        case "KeyR":
            for(let ball of balls){
                ball.position.y = ballYo;
                ball.position.x = rand(0, 4);
                ball.position.z = rand(-4, 0);

                ball.physics.config.velocityVector.fromArray([rand(-2, 2)/timeDivision*100, 0, rand(-2, 2)/timeDivision*100]);
            }            
        break;
    
        default:
            break;
    }
})

function checkProperty(axis){
    switch (axis) {
        case "x":
            return "width";
        
        case "y":
            return "height";
        
        case "z":
            return "depth";
        
        default:
            return undefined;
    }
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function createLight(color, intensity, position = {x: 0, y: 0, z: 0}){
    let light = new THREE.PointLight(color, intensity);
    light.position.set(position.x, position.y, position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024; // default
    light.shadow.mapSize.height = 1024; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
    light.shadow.focus = 1; // default
    return light;
}

function createTexture(rute, height = 1, width = 1){
    let texture = new THREE.TextureLoader().load(rute);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(height, width); 

    return texture;
}