import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const mount = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcdd4cc);
scene.fog = new THREE.Fog(0xcdd4cc, 23, 45);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(13, 15, 19);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.target.set(0, 0, 0); controls.maxPolarAngle = 1.42; controls.minDistance = 10; controls.maxDistance = 34;
scene.add(new THREE.HemisphereLight(0xf5fff2, 0x68736c, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(-8, 16, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);

const mat = (color, roughness=.8) => new THREE.MeshStandardMaterial({ color, roughness });
const box = (name, size, pos, material) => { const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material); m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m; };
box('ground',[32,.3,32],[0,-.25,0],mat(0xaeb9ae));
box('street',[8.4,.08,29],[0,0,0],mat(0x444c48,.95));
box('walkL',[4,.18,29],[-6.25,.05,0],mat(0xc4cbc1)); box('walkR',[4,.18,29],[6.25,.05,0],mat(0xc4cbc1));
for(let z=-13;z<14;z+=3) box('lane',[.11,.03,1.35],[0,.075,z],mat(0xd5dbc8));
for(let x=-3.75;x<4;x+=.75) box('crosswalk',[.43,.035,3.2],[x,.09,2.2],mat(0xe8e9dd));

// Street furniture and surrounding context.
const furniture = new THREE.Group(); furniture.name='furniture'; scene.add(furniture);
function fbox(size,pos,color){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;furniture.add(m);return m}
function pole(x,z){fbox([.13,2.5,.13],[x,1.25,z],0x33423a);fbox([.55,.18,.24],[x,2.38,z],0xff775e)}
pole(-4.7,1.1); pole(4.7,-6.4);
fbox([2.2,.12,.55],[5.8,.7,2],0x34443c); fbox([.12,1.2,.12],[5.05,.32,2],0x34443c);fbox([.12,1.2,.12],[6.55,.32,2],0x34443c);
fbox([.65,1.15,.65],[-5.6,.65,-5.2],0xff775e);
for(const side of [-1,1]) for(let z=-12;z<13;z+=5.5){const h=1.7+(Math.sin(z)*.25);box('building',[3.4,h,3],[side*8.5,h/2,z],mat(z%2?0x89968d:0x9eaaa0));}
for(const z of [-9,8]){const trunk=box('tree',[.22,1.7,.22],[-5.8,.9,z],mat(0x4c584c));const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,1),mat(0x718b69));crown.position.set(-5.8,2.2,z);crown.castShadow=true;scene.add(crown)}

const human = new THREE.Group(); human.name='human'; scene.add(human);
const lime=mat(0xd8ff3e,.55), dark=mat(0x1c2a23);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.9,5,12),lime);body.position.y=1.15;body.castShadow=true;human.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.31,18,18),dark);head.position.y=2.05;head.castShadow=true;human.add(head);
for(const x of [-.2,.2]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,.68,.18),dark);leg.position.set(x,.38,0);leg.castShadow=true;human.add(leg)}
const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.72,48),new THREE.MeshBasicMaterial({color:0xd8ff3e,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.12;human.add(ring);human.position.set(0,0,5.2);

const state={moving:true,direction:0,speed:1.2,avoiding:false,targetZ:-10};
const dirs=['NORTH','EAST','SOUTH','WEST']; let toastTimer;
function toast(text){const n=document.querySelector('#notice');n.textContent=text;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),1600)}
function setAction(action){document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.action===action));
  if(action==='move'){state.moving=true;state.speed=1.2;toast('Agent moving '+dirs[state.direction].toLowerCase())}
  if(action==='stop'){state.moving=false;state.speed=0;toast('Agent stopped safely')}
  if(action==='turn'){state.direction=(state.direction+1)%4;human.rotation.y=-state.direction*Math.PI/2;state.moving=true;state.speed=.8;toast('Turned '+dirs[state.direction].toLowerCase())}
  if(action==='avoid'){state.moving=true;state.speed=.7;state.avoiding=true;toast('Obstacle avoidance engaged')}
  if(action==='reroute'){state.moving=true;state.speed=1;state.direction=0;human.rotation.y=0;state.targetZ=human.position.z>0?-10:10;toast('New route calculated via crosswalk')}
  sync();
}
function sync(){document.querySelector('#movement').textContent=state.moving?'MOVING':'STOPPED';document.querySelector('#direction').textContent=dirs[state.direction];document.querySelector('#speed').textContent=state.speed.toFixed(1)+' M/S'}
document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>setAction(b.dataset.action)));
document.querySelectorAll('.legend-row').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.legend-row').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const target=b.dataset.focus==='human'?human.position:b.dataset.focus==='furniture'?new THREE.Vector3(5.8,0,2):new THREE.Vector3();controls.target.lerp(target,.8);toast('Focused on '+b.dataset.focus)}));
addEventListener('keydown',e=>{const map={m:'move',t:'turn',s:'stop',a:'avoid',r:'reroute'};if(map[e.key.toLowerCase()])setAction(map[e.key.toLowerCase()])});

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(state.moving){const angle=-state.direction*Math.PI/2;human.position.x+=Math.sin(angle)*state.speed*dt;human.position.z-=Math.cos(angle)*state.speed*dt;if(state.avoiding){human.position.x=Math.sin(performance.now()/700)*1.2;if(performance.now()%5000<40)state.avoiding=false}human.position.x=THREE.MathUtils.clamp(human.position.x,-3.7,3.7);human.position.z=THREE.MathUtils.clamp(human.position.z,-13,13);body.position.y=1.15+Math.abs(Math.sin(performance.now()/170))*.06;document.querySelector('#position').innerHTML=`X ${human.position.x.toFixed(1)}&nbsp;&nbsp; Z ${human.position.z.toFixed(1)}`;}ring.material.opacity=.55+.25*Math.sin(performance.now()/300);ring.material.transparent=true;controls.update();renderer.render(scene,camera)}animate();
setInterval(()=>document.querySelector('#clock').textContent=new Date().toLocaleTimeString('en-GB'),1000);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
