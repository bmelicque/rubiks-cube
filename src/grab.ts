import { Camera, Mesh, Raycaster, Vector2 } from "three";
import { State, StateHandler } from "./state";
import { eventPosition } from "./utils";
import { CubieKind, getCubieKind } from "./cube";

/**
 * Attach all event handlers needed for manipulating the cube
 * @param canvas the canvas used to render the cube
 * @param camera the `three` camera used in the scene
 * @param stateHandler the global state handler
 */
export function addGrabEventListeners(canvas: HTMLCanvasElement, camera: Camera, stateHandler: StateHandler) {
	const raycaster = new Raycaster();
	const hovered = (e: MouseEvent | TouchEvent) => {
		raycaster.setFromCamera(eventPosition(e), camera);
		return raycaster.intersectObjects(stateHandler.cube.cube.children)[0];
	};
	function updateCursor(e: MouseEvent | TouchEvent) {
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
	canvas.addEventListener("touchmove", (e) => {
		stateHandler.updateCube(e);
		updateCursor(e);
	});
	const onGrabStart = (e: MouseEvent | TouchEvent) => {
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
	};
	canvas.addEventListener("mousedown", onGrabStart);
	canvas.addEventListener("touchstart", onGrabStart);

	const onGrabEnd = () => {
		switch (stateHandler.state) {
			case State.GrabbingCube:
				stateHandler.setState(State.StabilizingCube);
				return;
			case State.GrabbingSlice:
				stateHandler.setState(State.StabilizingSlice);
				return;
		}
	};
	canvas.addEventListener("mouseup", onGrabEnd);
	canvas.addEventListener("touchend", onGrabEnd);
}
