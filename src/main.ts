import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';


let controls: OrbitControls;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let instancedMesh: THREE.InstancedMesh;
let matrix = new THREE.Matrix4() 

const stats = new Stats();
document.body.appendChild( stats.dom );

const listener = new THREE.AudioListener();
const loader = new THREE.AudioLoader();

let soundReady = false;
const swoosh = new THREE.Audio(listener)

var mouse = new THREE.Vector2();

init();
requestAnimationFrame(tick);

function init() {
  // Camera
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    300,
  );
  camera.position.set(0, 0, 20);

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

  createBalloons(50);
  
  
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
      // Remove the intersected balloon
      matrix.setPosition(Math.random() * 30 - 10, -10, Math.random() * 30 - 10);
      if(!instanceIndex)return;
      instancedMesh.setMatrixAt(instanceIndex, matrix);

    }
  }
}

// RAF Update the screen
function tick(): void {
  stats.begin();

  for (let i = 0; i < instancedMesh.count; i++) {
    instancedMesh.getMatrixAt(i,matrix);
    matrix.elements[13] += 0.01;
    matrix.setPosition(matrix.elements[12], matrix.elements[13], matrix.elements[14]);

    // If the balloon is above the screen, position it down again
    if (matrix.elements[13] > 10) {
      matrix.setPosition(matrix.elements[12], -10, matrix.elements[14]);

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
  instancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, 50);
  instancedMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

  // Set the position and rotation of each instance
  for (var i = 0; i < count; i++) {
    let matrix = new THREE.Matrix4();
    matrix.setPosition(new THREE.Vector3(
      Math.random() * 30 - 10,
      Math.random() * 10 - 5,
      Math.random() * 30 - 10
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


  const toggleSoundDom = document.getElementById('toggleSound');
  // @ts-ignore
  toggleSoundDom.addEventListener('click',()=>{toggleSound()},false)

  const toggleAnimationDom = document.getElementById('toggleAnimation');
  // @ts-ignore
  toggleAnimationDom.addEventListener('click',()=>{toggleAnimation()},false)

}

function toggleSound() {
  const soundOn = document.getElementById('soundOn');
  const soundOff = document.getElementById('soundOff');
  if (!soundOn || !soundOff) return;
  if (soundReady == false) {
    soundOn.style.display = 'block';
    soundOff.style.display = 'none';
  } else {
    soundOn.style.display = 'none';
    soundOff.style.display = 'block';
  }
  soundReady=!soundReady;
}

function toggleAnimation() {
}