import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Cube } from "./cube";
import { addGrabEventListeners } from "./grab";
import { State, StateHandler } from "./state";

const FOV = 20;

function makeCamera() {
	const aspect = innerWidth / innerHeight;
	const camera = new PerspectiveCamera(FOV, aspect);
	camera.position.z = 15;
	return camera;
}

function makeRenderer(canvas: HTMLCanvasElement) {
	const renderer = new WebGLRenderer({ canvas, alpha: true });
	renderer.setSize(innerWidth, innerHeight);
	renderer.shadowMap.enabled = true;
	return renderer;
}

const scene = new Scene();
const camera = makeCamera();
const canvas = document.createElement("canvas");
const renderer = makeRenderer(canvas);
document.body.appendChild(canvas);
const resize = () => {
	camera.aspect = innerWidth / innerHeight;
	const angle = (Math.min(FOV, FOV * camera.aspect) * Math.PI) / 180;
	const halfWidth = 1.5; // 3 cubies / 2
	camera.position.z = halfWidth * Math.sqrt(3) * (1 + 1 / Math.tan(angle / 2));
	camera.updateProjectionMatrix();
	renderer.setSize(innerWidth, innerHeight);
};
addEventListener("resize", resize);
resize();

const cube = new Cube();
scene.add(cube.cube);

const stateHandler = new StateHandler(cube);

addGrabEventListeners(canvas, camera, stateHandler);

const animate = (_: number) => {
	stateHandler.updateCube();
	renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);

document.getElementById("undo")!.addEventListener("click", () => {
	if (stateHandler.state !== State.Still) return;
	stateHandler.undoLast();
});
document.getElementById("undo")!.addEventListener("touchstart", (e) => {
	e.preventDefault();
	if (stateHandler.state !== State.Still) return;
	stateHandler.undoLast();
});

document.getElementById("rotate-cw")!.addEventListener("click", () => {
	if (stateHandler.state !== State.Still) return;
	stateHandler.F();
});
document.getElementById("rotate-ccw")!.addEventListener("click", () => {
	if (stateHandler.state !== State.Still) return;
	stateHandler.F_();
});
document.getElementById("shuffle")!.addEventListener("click", () => {
	if (stateHandler.state !== State.Still) return;
	stateHandler.shuffle();
});
