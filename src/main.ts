import { Mesh, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { Cube, CubieKind, getCubieKind } from "./cube";
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
const hovered = (e: MouseEvent) => {
	const mouse = new Vector2(
		(e.clientX / renderer.domElement.clientWidth) * 2 - 1,
		-(e.clientY / renderer.domElement.clientHeight) * 2 + 1
	);
	raycaster.setFromCamera(mouse, camera);
	return raycaster.intersectObjects(cube.cube.children)[0];
};
function updateCursor(e: MouseEvent) {
	const canvas = document.querySelector("canvas")!;
	switch (stateHandler.state) {
		case State.Still:
			canvas.style.cursor = hovered(e) ? "grab" : "auto";
			return;
		case State.StabilizingCube:
		case State.StabilizingSlice:
			canvas.style.cursor = "auto";
			return;
		case State.GrabbingSlice:
		case State.GrabbingCube:
			canvas.style.cursor = "grabbing";
			return;
	}
}
canvas.addEventListener("mousemove", (e) => {
	stateHandler.updateCube(e);
	updateCursor(e);
});
canvas.addEventListener("mousedown", (e) => {
	if (stateHandler.state !== State.Still) return;
	const intersection = hovered(e);
	if (!intersection) return;
	const cubie = intersection.object as Mesh;
	const cubieKind = getCubieKind(cubie);
	switch (cubieKind) {
		case CubieKind.Center:
			stateHandler.setState(State.GrabbingCube, e);
			return;
		case CubieKind.Edge:
		case CubieKind.Corner:
			intersection.point.round();
			stateHandler.grabAt(new Vector2(intersection.point.x, intersection.point.y));
			stateHandler.setState(State.GrabbingSlice, e);
			return;
	}
});

canvas.addEventListener("mouseup", () => {
	switch (stateHandler.state) {
		case State.GrabbingCube:
			stateHandler.setState(State.StabilizingCube);
			return;
		case State.GrabbingSlice:
			stateHandler.setState(State.StabilizingSlice);
			return;
	}
});

const animate = (_: number) => {
	stateHandler.updateCube();
	renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);

document.getElementById("undo")!.addEventListener("click", () => {
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
