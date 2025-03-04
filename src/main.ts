import { Mesh, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { Cube, CubieKind, getCubieKind } from "./cube";
import { Face } from "./face";
import { State, StateHandler } from "./state";

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

const stateHandler = new StateHandler(cube);

const raycaster = new Raycaster();
canvas.addEventListener("mousemove", (e) => {
	stateHandler.updateCube(e);
});
canvas.addEventListener("mousedown", (e) => {
	if (stateHandler.state !== State.Still) return;
	const mouse = new Vector2(
		(e.clientX / renderer.domElement.clientWidth) * 2 - 1,
		-(e.clientY / renderer.domElement.clientHeight) * 2 + 1
	);
	raycaster.setFromCamera(mouse, camera);
	const intersected = raycaster.intersectObjects(cube.cube.children);
	if (intersected.length === 0) return;
	const intersection = intersected[0];
	const cubie = intersection.object as Mesh;
	const cubieKind = getCubieKind(cubie);
	switch (cubieKind) {
		case CubieKind.Center:
			stateHandler.setState(State.GrabbingCube, e);
			return;
		case CubieKind.Edge:
			const x = Math.round(intersection.point.x);
			const y = Math.round(intersection.point.y);
			const face = [x, y, 0] as unknown as Face;
			stateHandler.grabFace(face);
			stateHandler.setState(State.GrabbingFace, e);
			return;
	}
});

canvas.addEventListener("mouseup", () => {
	switch (stateHandler.state) {
		case State.GrabbingCube:
			stateHandler.setState(State.StabilizingCube);
			return;
		case State.GrabbingFace:
			stateHandler.setState(State.StabilizingFace);
			return;
	}
});

const animate = (_: number) => {
	stateHandler.updateCube();
	renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);
