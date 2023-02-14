import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';


let controls: OrbitControls;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let instancedMesh: THREE.InstancedMesh;
let confettiInstance: THREE.InstancedMesh;
let matrix = new THREE.Matrix4() 
let mat = new THREE.Matrix4()

const stats = new Stats();
document.body.appendChild( stats.dom );

const listener = new THREE.AudioListener();
const loader = new THREE.AudioLoader();

// let soundReady = false;
const swoosh = new THREE.Audio(listener)

var mouse = new THREE.Vector2();

const confettiVelocities: any[] = [];
const confettiRotations = [];

const balloonSpeed: number[] = [];

init();
requestAnimationFrame(tick);

function init() {
  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    300,
  );
  camera.position.set(0, 0, 40);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfefefe);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.render(scene, camera);
  document.body.appendChild(renderer.domElement);

  // Fog
  // scene.fog = new THREE.FogExp2(0xfefefe, 0.05);

  setupLights();
  setupOrbitControls();
  setupEventListeners();
  setupSounds();

  // ***** setup our scene *******

  createBalloons(400);
  createFetti(500,2.5);

  // Pop the balloon on click
  document.addEventListener("click", onDocumentMouseDown, false);
  function onDocumentMouseDown(event: { preventDefault: () => void; clientX: number; clientY: number; }) {
    event.preventDefault();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(instancedMesh);
    if (intersects.length > 0) {
      var instanceIndex = intersects[0].instanceId;

      updateFetti(intersects[0].point,2.5);

      // Remove the intersected balloon
      matrix.setPosition(Math.random() * 30 - 10, -10, Math.random() * 30 - 10);
      if(!instanceIndex)return;
      instancedMesh.setMatrixAt(instanceIndex, matrix);

    }
  }
}
function createFetti(count:number,radius:number){
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  // Create a geometry for the confetti
  var planeGeometry = new THREE.PlaneBufferGeometry( 0.1, 0.1 );

  // Create a material for the confetti
  var planeMaterial = new THREE.MeshBasicMaterial( { 
    // color: 0x00ff00,
    side: THREE.DoubleSide
  } );
  // const colors = [];

  const color = new THREE.Color();
  // Create an instanced mesh for the balloons
  confettiInstance = new THREE.InstancedMesh(planeGeometry, planeMaterial, count);
  confettiInstance.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

  // Set the position and rotation of each instance
  for (var i = 0; i < count; i++) {
    // confettiInstance.getMatrixAt(i,mat);

    color.setHSL( Math.random(), Math.random(), Math.random() );

    confettiVelocities[i] = new THREE.Vector3(Math.random() * 0.2 - 0.1, Math.random() * 0.5, Math.random() * 0.2 - 0.1);
    // Give each confetti a random rotation
    confettiRotations.push(Math.random() * Math.PI * 2);
    // Give each confetti a random rotation
    confettiRotations.push(Math.random() * Math.PI * 2);
    var rx = Math.random() * 2 * Math.PI;
    var ry = Math.random() * 2 * Math.PI;
    var rz = Math.random() * 2 * Math.PI;
    mat.makeRotationFromQuaternion(quat.setFromEuler(euler.set(rx, ry, rz, "XYZ")))
    
    var randomDirection = new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).normalize();
    var randomPosition = randomDirection.multiplyScalar(Math.random()*radius);
    mat.setPosition(randomPosition)

    confettiInstance.setMatrixAt(i, mat);
    confettiInstance.setColorAt(i, color);
    // confettiInstance.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "XYZ")), new THREE.Vector3(1,1,1)));
  }
  // confettiInstance.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  // Add the instanced mesh to the scene
  scene.add(confettiInstance);
}
function updateFetti(pos: THREE.Vector3,radius:number){
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  confettiInstance.position.set(pos.x,pos.y,pos.z)

  // Set the position and rotation of each instance
  for (var i = 0; i < 500; i++) {
    confettiInstance.getMatrixAt(i,mat);
    // Give each confetti a random velocity on the z axis
    confettiVelocities[i] = new THREE.Vector3(Math.random() * 0.2 - 0.1, Math.random() * 0.5, Math.random() * 0.2 - 0.1);
    // Give each confetti a random rotation
    confettiRotations.push(Math.random() * Math.PI * 2);
    var rx = Math.random() * 2 * Math.PI;
    var ry = Math.random() * 2 * Math.PI;
    var rz = Math.random() * 2 * Math.PI;
    mat.makeRotationFromQuaternion(quat.setFromEuler(euler.set(rx, ry, rz, "XYZ")))

    var randomDirection = new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).normalize();
    var randomPosition = randomDirection.multiplyScalar(Math.random()*radius);
    mat.setPosition(randomPosition)

    confettiInstance.setMatrixAt(i, mat);
    // confettiInstance.setMatrixAt(i, new THREE.Matrix4().compose(randomPosition, new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "XYZ")), new THREE.Vector3(1,1,1)));
  }
  confettiInstance.instanceMatrix.needsUpdate = true;

}
function tickFetti(){
  // Set the position and rotation of each instance
  for (let i = 0; i < 500; i++) {
    confettiInstance.getMatrixAt(i,mat)
    // Update the position of the confetti
    if(mat.elements[14]>0) 
      confettiVelocities[i].y += 0.005;
    else confettiVelocities[i].y +=0.001
    mat.elements[12] += (0.9*confettiVelocities[i].x);
    mat.elements[13] += 0.2 - (0.5 * confettiVelocities[i].y);
    // mat.elements[13] += 0.10 - (0.5 * confettiVelocities[i].y);
    mat.elements[14] += (0.9*confettiVelocities[i].z);
    mat.setPosition(mat.elements[12], mat.elements[13], mat.elements[14]);
    confettiInstance.setMatrixAt(i, mat);
    if(mat.elements[12], mat.elements[13], mat.elements[14]){

    }
  }
  confettiInstance.instanceMatrix.needsUpdate = true;
}
// RAF Update the screen
function tick(): void {

  stats.begin();

  tickFetti()

  for (let i = 0; i < instancedMesh.count; i++) {
    instancedMesh.getMatrixAt(i,matrix);
    matrix.elements[13] += balloonSpeed[i]*0.05;
    matrix.setPosition(matrix.elements[12], matrix.elements[13], matrix.elements[14]);

    // If the balloon is above the screen, position it down again
    if (matrix.elements[13] > 50) {
      matrix.setPosition(matrix.elements[12], -50, matrix.elements[14]);

    }
    instancedMesh.setMatrixAt(i, matrix);
  }
  instancedMesh.instanceMatrix.needsUpdate = true;

  renderer.render(scene, camera);
  controls.update();
  stats.end();

  window.requestAnimationFrame(tick);
}

function createBalloons(count:number){
  // Create a geometry for the balloons
  var sphereGeometry = new THREE.SphereGeometry( 1, 32, 32 );

  // Create a material for the balloons
  var sphereMaterial = new THREE.MeshStandardMaterial( { 
    color: 0xff0000,
    transparent:true,
    opacity:0.5,
    side:THREE.DoubleSide 
  } );

  // Create an instanced mesh for the balloons
  instancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, count);
  instancedMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

  // Set the position and rotation of each instance
  for (var i = 0; i < count; i++) {
    balloonSpeed.push(Math.random())
    let matrix = new THREE.Matrix4();
    matrix.setPosition(new THREE.Vector3(
      Math.random() * 100 - 50,
      Math.random() * 50 - 25,
      Math.random() * 100 - 50
    ));
    instancedMesh.setMatrixAt(i, matrix);
  }

  // Add the instanced mesh to the scene
  scene.add(instancedMesh);

}

function setupSounds() {
  camera.add(listener);
  audioSetup(swoosh,'src/assets/sounds/little-whoosh-2-6301.mp3',1,loader)
}

function audioSetup(sound:THREE.Audio, url:string,volume:number,loader:THREE.AudioLoader){
  loader.load(
    url,
    // onLoad callback
    function ( audioBuffer ) {
      // set the audio object buffer to the loaded object
      sound.setBuffer( audioBuffer );
      sound.setVolume(volume)
      sound.loop=false;
    },
  );
}

function setupLights() {
  // ***** Lights ****** //
  const ambLight = new THREE.AmbientLight(0xfefefe, 0.5);
  const dirLight = new THREE.DirectionalLight(0xfefefe, 0.5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.top = 40;
  dirLight.shadow.camera.right = 40;
  dirLight.shadow.camera.bottom = -40;
  dirLight.shadow.camera.left = -40;

  dirLight.position.set(20, 30, 20);
  scene.add(ambLight, dirLight);
}

function setupOrbitControls() {
  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.enableDamping = true;
  controls.autoRotate = false;
  controls.rotateSpeed = 1;
  controls.dampingFactor = 0.1;
  controls.minDistance = 2.4;
  controls.maxDistance = 180;
  controls.target.set(0, 0, 0);
  controls.enabled = false;
}

function setupEventListeners() {
  // Handle `resize` events
  window.addEventListener(
    'resize',
    function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    },
    false,
  );

  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(colorOption => {
    colorOption.addEventListener('click', () => {
      const selectedColor = (colorOption as HTMLElement).dataset.color;
      if(selectedColor == "red")
        (instancedMesh.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(0xe91e63))
      else if(selectedColor == "blue")
        (instancedMesh.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(0xafeeee))
      else if(selectedColor == "green")
        (instancedMesh.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(0x90ee90))
      else if(selectedColor == "yellow")
        (instancedMesh.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(0xf0e68c))
      else if(selectedColor == "pink")
        (instancedMesh.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(0xffc0cb))
      else if(selectedColor == "white")
        (instancedMesh.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(0xffffff))
      // Do something with the selected color, such as pass it to your Three.js function.
    });
  });


  // const toggleSoundDom = document.getElementById('toggleSound');
  // // @ts-ignore
  // toggleSoundDom.addEventListener('click',()=>{toggleSound()},false)

  // const toggleAnimationDom = document.getElementById('toggleAnimation');
  // // @ts-ignore
  // toggleAnimationDom.addEventListener('click',()=>{toggleAnimation()},false)

}

// function toggleSound() {
//   const soundOn = document.getElementById('soundOn');
//   const soundOff = document.getElementById('soundOff');
//   if (!soundOn || !soundOff) return;
//   if (soundReady == false) {
//     soundOn.style.display = 'block';
//     soundOff.style.display = 'none';
//   } else {
//     soundOn.style.display = 'none';
//     soundOff.style.display = 'block';
//   }
//   soundReady=!soundReady;
// }

// function toggleAnimation() {
// }