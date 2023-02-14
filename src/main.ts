import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';

import swooshSound from './assets/sounds/little-whoosh-2-6301.mp3'
import musicSound from './assets/sounds/romanticMemories.mp3'
import burstSound from './assets/sounds/pop2-84862.mp3'
import burstSound2 from './assets/sounds/balloon-pop-93436.mp3'

// const stats = new Stats();
// document.body.appendChild( stats.dom );
// if (import.meta.env.PROD) {
  // stats.dom.style.display='none'
// }

// Get references to the input fields and the share button
const name1Input = document.getElementById('name1-input');
const name2Input = document.getElementById('name2-input');
const colorOptions = document.querySelectorAll('.color-option');
const colorContainers = document.querySelectorAll('.colorContainer');
const showColorsButton = document.getElementById('show-colors-button');
const shareBtn = document.getElementById('share-btn');
const heart = document.getElementById('heart');
const inputEntry = document.getElementById('inputEntry');
const createNew = document.getElementById('createNew');

let controls: OrbitControls;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let instancedMesh: THREE.InstancedMesh;
let balloonMaterial: THREE.MeshStandardMaterial;
let confettiInstance: THREE.InstancedMesh;
let matrix = new THREE.Matrix4() 
let mat = new THREE.Matrix4()



const listener = new THREE.AudioListener();
const loader = new THREE.AudioLoader();
let soundReady = false;
const swoosh = new THREE.Audio(listener)
const music = new THREE.Audio(listener)
const burst = new THREE.Audio(listener)
const burst2 = new THREE.Audio(listener)

var mouse = new THREE.Vector2();

const confettiVelocities: any[] = [];
const confettiRotations = [];

const balloonSpeeds: number[] = [];

init();
tick();

function init() {
  // Camera
  camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    1,
    300,
  );
  camera.position.set(0, 0, 40);

  // Scene
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xfefefe);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true,alpha:true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.render(scene, camera);
  document.body.appendChild(renderer.domElement);
  renderer.setClearColor( 0x000000, 0 ); // the default

  // Fog
  scene.fog = new THREE.FogExp2(0xfefefe, 0.005);

  setupLights();
  setupOrbitControls();
  setupSounds();

  // ***** setup our scene *******

  createBalloons(400);
  createFetti(500,2.5);


  setupEventListeners();

  // Pop the balloon on click
  document.addEventListener("click", onDocumentMouseDown, false);
  function onDocumentMouseDown(event: { preventDefault: () => void; clientX: number; clientY: number; }) {
    // event.preventDefault();
    if(!music.isPlaying)music.play();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(instancedMesh);
    if (intersects.length > 0) {
      if(!burst.isPlaying)burst.play();
      else if(!burst2.isPlaying)burst2.play();

      var instanceIndex = intersects[0].instanceId;
      updateFetti(intersects[0].point,2.5);
      // Remove the intersected balloon
      matrix.setPosition(Math.random() * 30 - 10, -30, Math.random() * 30 - 10);
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
    mat.makeRotationFromQuaternion(quat.setFromEuler(euler.set(rx, ry, rz, "XYZ")));
    const size = Math.random()*5;
    mat.scale(new THREE.Vector3(size,size,0))
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
    mat.elements[12] += (0.9*confettiVelocities[i].x );
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

  // stats.begin();
  tickFetti()
  for (let i = 0; i < instancedMesh.count; i++) {
    instancedMesh.getMatrixAt(i,matrix);
    matrix.elements[13] += balloonSpeeds[i]*0.1;
    matrix.setPosition(matrix.elements[12], matrix.elements[13], matrix.elements[14]);

    // If the balloon is above the screen, position it down again
    if (matrix.elements[13] > 30) {
      matrix.setPosition(matrix.elements[12], -30, matrix.elements[14]);

    }
    instancedMesh.setMatrixAt(i, matrix);
  }
  instancedMesh.instanceMatrix.needsUpdate = true;

  renderer.render(scene, camera);
  controls.update();
  // stats.end();

  window.requestAnimationFrame(tick);
}

function createBalloons(count:number){
  // Create a geometry for the balloons
  var sphereGeometry = new THREE.SphereGeometry( 1, 32, 32 );

  // Create a material for the balloons
  balloonMaterial = new THREE.MeshStandardMaterial( { 
    color: 0xe91e1e,
    transparent:true,
    opacity:0.5,
    side:THREE.DoubleSide 
  } );

  // Create an instanced mesh for the balloons
  instancedMesh = new THREE.InstancedMesh(sphereGeometry, balloonMaterial, count);
  instancedMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

  // Set the position and rotation of each instance
  for (var i = 0; i < count; i++) {
    balloonSpeeds.push(Math.random())
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
  audioSetup(swoosh,swooshSound,1,loader)
  audioSetup(music,musicSound,0.1,loader)
  audioSetup(burst,burstSound,0.1,loader)
  audioSetup(burst2,burstSound2,0.1,loader)
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


  
  // Parse the URL to get the parameter values
  const urlParams = new URLSearchParams(window.location.search);
  const name1 = (urlParams.get('a'))
  const name2 = (urlParams.get('b'))
  const color = (urlParams.get('c'))
  // If the URL has valid parameters, update the input fields and balloon color
  if (name1 && name2 && color) {
    (inputEntry as HTMLElement).style.display = 'none';
    const text = `From ${decodeURIComponent(name1)}. To ${decodeURIComponent(name2)}.`;
    const textElement = document.createElement('div');
    textElement.classList.add('text');
    textElement.innerText = text;
    document.body.appendChild(textElement);
    setBalloonColor(decodeURIComponent(color).toString()||'0')
  }

  let balloonColor = '0';
  colorOptions.forEach(colorOption => {
    colorOption.addEventListener('click', () => {
      balloonColor = (colorOption as HTMLElement).dataset.color||"0";
      console.log(balloonColor)
    });
  });
  // Add a click event listener to the share button
  (shareBtn as HTMLElement).addEventListener('click', () => {
    swoosh.playbackRate=1.7;
    swoosh.play();
    // Get the current values of the input fields and the selected color
    const name1 = (name1Input as HTMLInputElement).value || "I";
    const name2 = (name2Input as HTMLInputElement).value || "You";
    
    const color = balloonColor;

    // Encode the parameter values to be included in the URL
    const encodedName1 = encodeURIComponent(name1);
    const encodedName2 = encodeURIComponent(name2);
    const encodedColor = encodeURIComponent(color);

    urlParams.delete('a');
    urlParams.delete('b');
    urlParams.delete('c');
    const baseUrl = window.location.origin + window.location.pathname;
    const newUrl = baseUrl + urlParams.toString();
    window.history.pushState({path:newUrl}, '', newUrl);


    // Build the URL string with the parameter values
    const url = `${window.location.href}?a=${encodedName1}&b=${encodedName2}&c=${encodedColor}`;


    // Display the URL in an alert box
    // alert(`Here's your shareable URL:\n\n${url}`);
    showPopup(url)
  });


 
  (showColorsButton as HTMLElement).addEventListener('click', toggleColorOptions);
  function toggleColorOptions(){
    colorContainers.forEach((colorContainer, index) => {
      console.log((colorContainer as HTMLElement).style.opacity)
      if (!(colorContainer as HTMLElement).style.opacity || (colorContainer as HTMLElement).style.opacity == "0") {
        setTimeout(() => {
          (colorContainer as HTMLElement).style.display = 'block';
          (colorContainer as HTMLElement).style.opacity = "1";
          (colorContainer as HTMLElement).style.transform = 'scale(1)';
        }, index * 100);
      } else {
        setTimeout(() => {
          (colorContainer as HTMLElement).style.opacity = "0";
          (colorContainer as HTMLElement).style.transform = 'scale(0)';
          setTimeout(() => {
            (colorContainer as HTMLElement).style.display = 'none';
          }, 200);
        }, (colorContainers.length - index - 1) * 100);
      }
    });
  }

  colorOptions.forEach(colorOption => {
    colorOption.addEventListener('click', () => {
      const selectedColor = (colorOption as HTMLElement).dataset.color;
      setBalloonColor(selectedColor||'0')
      // Do something with the selected color, such as pass it to your Three.js function.
    });
  });


  const toggleSoundDom = document.getElementById('toggleSound');
  // @ts-ignore
  toggleSoundDom.addEventListener('click',()=>{toggleSound()},false)

  var copyButton = document.getElementById("copy-btn");
  (copyButton as HTMLElement).addEventListener('click',copyUrl,false);
  var closePopupButton = document.getElementById("close-popup");
  (closePopupButton as HTMLElement).addEventListener('click',closePopup,false);

  (createNew as HTMLElement).addEventListener('click',()=>{
    (inputEntry as HTMLElement).style.display = 'flex';
  },false);

  (heart as HTMLElement).addEventListener('click',()=>{
    swoosh.playbackRate=1.7;
    swoosh.play();
    music.play();
    // (inputEntry as HTMLElement).style.opacity = "0";
    // setTimeout(()=>{
      (inputEntry as HTMLElement).style.display = 'none';
    // },200)
  },false)
}

function setBalloonColor(color: string){
  if(color == "0")
    balloonMaterial.color.set(new THREE.Color(0xe91e1e))
  else if(color == "1")
    balloonMaterial.color.set(new THREE.Color(0xafeeee))
  else if(color == "2")
    balloonMaterial.color.set(new THREE.Color(0x90ee90))
  else if(color == "3")
    balloonMaterial.color.set(new THREE.Color(0xf0e68c))
  else if(color == "4")
    balloonMaterial.color.set(new THREE.Color(0xffc0cb))
  else if(color == "5")
    balloonMaterial.color.set(new THREE.Color(0xffffff))
}

function toggleSound() {
  swoosh.play();
  const soundOn = document.getElementById('soundOn');
  const soundOff = document.getElementById('soundOff');
  if (!soundOn || !soundOff) return;
  if (soundReady == true) {
    listener.setMasterVolume(1);
    soundOn.style.display = 'block';
    soundOff.style.display = 'none';
  } else {
    listener.setMasterVolume(0);
    soundOn.style.display = 'none';
    soundOff.style.display = 'block';
  }
  soundReady=!soundReady;
}
// Function to show the popup element
function showPopup(url: string) {
  // Get the popup element
  var popup = document.getElementById("popup");
  
  // Set the URL input value to the current URL with the user input appended as query parameters
  var urlInput = document.getElementById("url-input");
  (urlInput as HTMLInputElement).value = url;

  var sendGift = document.getElementById("sendGift");
  (sendGift as HTMLElement).innerText = 'Send your gift to '+((name2Input as HTMLInputElement).value || "You")

  // Create the Twitter button
  const twitterButton = document.getElementById("twitter-btn");
  const text = 'Check out this cool Valentine\'s Day gift!'
  var twitterUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  (twitterButton as HTMLAnchorElement).href = twitterUrl;
  
  // Create the WhatsApp button
  const whatsappButton = document.getElementById("whatsapp-btn");
  (whatsappButton as HTMLAnchorElement).href = `https://api.whatsapp.com/send?text=Check out my little gift for you! ❤️ ${encodeURIComponent(url)}`;

  // Show the popup
  (popup as HTMLElement).style.display = "flex";
}

// Function to close the popup element
function closePopup() {
  // Get the popup element
  var popup = document.getElementById("popup");
  // Hide the popup
  (popup as HTMLElement).style.display = "none";
}

// Function to copy the URL to the clipboard
function copyUrl() {
  // Get the URL input element
  var urlInput = document.getElementById("url-input");
  
  // Select the text in the URL input element
  const text = (urlInput as HTMLInputElement).value;
  
  // Copy the selected text to the clipboard
  navigator.clipboard.writeText(text).then(function() {
    console.log('Copied to clipboard: ' + text);
  }, function() {
    console.error('Failed to copy to clipboard: ' + text);
  });
}

