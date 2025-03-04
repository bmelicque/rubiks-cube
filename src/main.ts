import { Euler, Mesh, PerspectiveCamera, Quaternion, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { Cube } from "./cube";
import { findClippedOrientation } from "./utils";
import { Stabilizer } from "./stabilizer";

function makeCamera() {
	const aspect = innerWidth / innerHeight;
	const camera = new PerspectiveCamera(20, aspect);
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

const cube = new Cube();
scene.add(cube.cube);

enum State {
	Still,
	Stabilizing,
	Grabbing,
}
let currentState = State.Still;
let grabStart: Vector2 | null = null;
let grabStartQuaternion = new Quaternion();

const raycaster = new Raycaster();
canvas.addEventListener("mousemove", (e) => {
	if (currentState !== State.Grabbing) return;
	if (!grabStart) throw new Error("grabStart should've been set to some value!");
	const mouse = new Vector2(
		(e.clientX / renderer.domElement.clientWidth) * 2 - 1,
		-(e.clientY / renderer.domElement.clientHeight) * 2 + 1
	);
	mouse.sub(grabStart);
	const euler = new Euler(-mouse.y, mouse.x);
	const quaternion = new Quaternion().setFromEuler(euler);
	const r = quaternion.multiply(grabStartQuaternion);
	cube.cube.quaternion.set(r.x, r.y, r.z, r.w);
});
canvas.addEventListener("mousedown", (e) => {
	const mouse = new Vector2(
		(e.clientX / renderer.domElement.clientWidth) * 2 - 1,
		-(e.clientY / renderer.domElement.clientHeight) * 2 + 1
	);
	raycaster.setFromCamera(mouse, camera);
	const intersected = raycaster.intersectObjects(cube.cube.children);
	if (intersected.length === 0) return;
	currentState = State.Grabbing;
	stabilizer = null;
	grabStart = mouse;
	grabStartQuaternion = cube.cube.quaternion.clone();
	const intersection = intersected[0];
	const cubie = intersection.object as Mesh;
	// console.log(getCubieKind(cubie));
});

let stabilizer: Stabilizer | null;
canvas.addEventListener("mouseup", () => {
	currentState = State.Stabilizing;
	const q = findClippedOrientation(cube.cube.quaternion);
	stabilizer = new Stabilizer(cube.cube.quaternion, q);
});

const animate = (_: number) => {
	if (stabilizer) {
		const q = stabilizer.getCurrentOrientation();
		cube.cube.quaternion.set(q.x, q.y, q.z, q.w);
		if (stabilizer.done) stabilizer = null;
	}
	renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);
