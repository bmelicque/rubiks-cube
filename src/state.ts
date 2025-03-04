import { Euler, Quaternion, Vector2 } from "three";
import { Face } from "./face";
import { Stabilizer } from "./stabilizer";
import { findClippedOrientation } from "./utils";
import { Cube } from "./cube";

export enum State {
	Still,
	GrabbingCube,
	StabilizingCube,
	GrabbingFace,
	StabilizingFace,
}

function mousePosition(e: MouseEvent) {
	const renderer = document.querySelector("canvas");
	if (!renderer) throw new Error("invalid app state: renderer should be a canvas element");
	return new Vector2((e.clientX / renderer.clientWidth) * 2 - 1, -(e.clientY / renderer.clientHeight) * 2 + 1);
}

export class StateHandler {
	#state = State.Still;
	#cube: Cube;
	#mouseStart: Vector2 | null = null;
	#cubeStartQuaternion = new Quaternion();
	#cubeStabilizer: Stabilizer | null = null;
	#faceRotationDirection: "x" | "y" | null = null;
	#faceStartWorldQuaternion = new Quaternion();
	#faceStabilizer: Stabilizer | null = null;

	constructor(cube: Cube) {
		this.#cube = cube;
	}

	get state() {
		return this.#state;
	}

	setState(state: State, e?: MouseEvent) {
		// clean up previous state
		switch (this.#state) {
			case State.Still:
				break;
			case State.StabilizingCube:
				this.#cubeStabilizer = null;
				break;
			case State.GrabbingCube:
				this.#mouseStart = null;
				break;
			case State.GrabbingFace:
				this.#mouseStart = null;
				break;
			case State.StabilizingFace:
				this.#faceStabilizer = null;
				this.#cube.ungroupFace();
				break;
		}

		// set up new state
		switch (state) {
			case State.Still:
				break;
			case State.GrabbingCube:
				if (!e) throw new Error("invalid app state: mouse event should've been passed here!");
				this.#mouseStart = mousePosition(e);
				this.#cubeStartQuaternion = this.#cube.cube.quaternion.clone();
				break;
			case State.StabilizingCube:
				this.#state = State.StabilizingCube;
				const q = findClippedOrientation(this.#cube.cube.quaternion);
				this.#cubeStabilizer = new Stabilizer(this.#cube.cube.quaternion, q);
				break;
			case State.GrabbingFace:
				if (!e) throw new Error("invalid app state: mouse event should've been passed here!");
				if (!this.#cube.currentFace) throw new Error("invalid app state: current face should've been set");
				this.#mouseStart = mousePosition(e);
				this.#faceStartWorldQuaternion = this.#cube.currentFace!.getWorldQuaternion(new Quaternion());
				break;
			case State.StabilizingFace:
				this.#state = State.StabilizingFace;
				const worldQuarternion = this.#cube.currentFace!.getWorldQuaternion(new Quaternion());
				const faceTargetOrientation = findClippedOrientation(worldQuarternion);
				this.#faceStabilizer = new Stabilizer(worldQuarternion, faceTargetOrientation);
				break;
		}
		this.#state = state;
	}

	grabFace(face: Face) {
		this.#cube.groupFace(face);
		if (face[0]) this.#faceRotationDirection = "y";
		if (face[1]) this.#faceRotationDirection = "x";
	}

	updateGrabbedFace(mouse: Vector2) {
		if (!this.#mouseStart) throw new Error("invalid app state: missing mouse starting position");
		mouse.sub(this.#mouseStart);
		const x = this.#faceRotationDirection === "y" ? -2 * mouse.y : 0;
		const y = this.#faceRotationDirection === "x" ? 2 * mouse.x : 0;
		const mouseRotation = new Quaternion().setFromEuler(new Euler(x, y));
		const worldQuaternion = mouseRotation.multiply(this.#faceStartWorldQuaternion);
		const localQuaternion = this.#cube.cube.quaternion.clone().conjugate().multiply(worldQuaternion);
		this.#cube.currentFace!.quaternion.copy(localQuaternion);
		return;
	}

	#updateStabilizingFace() {
		if (!this.#faceStabilizer) throw new Error("invalid app state: expected stabilizer");
		const faceWorldQuaternion = this.#faceStabilizer.getCurrentOrientation();
		const localQuaternion = this.#cube.cube.quaternion.clone().conjugate().multiply(faceWorldQuaternion);
		this.#cube.currentFace!.quaternion.copy(localQuaternion);
		if (this.#faceStabilizer.done) this.setState(State.Still);
	}

	#updateGrabbedCube(mouse: Vector2) {
		if (!this.#mouseStart) throw new Error("invalid app state: missing mouse starting position");
		mouse.sub(this.#mouseStart);
		const q = new Quaternion().setFromEuler(new Euler(-2 * mouse.y, 2 * mouse.x)).multiply(this.#cubeStartQuaternion);
		this.#cube.cube.quaternion.copy(q);
	}

	#updateStabilizingCube() {
		if (!this.#cubeStabilizer) throw new Error("invalid app state: expected stabilizer");
		const q = this.#cubeStabilizer.getCurrentOrientation();
		this.#cube.cube.quaternion.copy(q);
		if (this.#cubeStabilizer.done) this.setState(State.Still);
	}

	updateCube(e?: MouseEvent) {
		const mouse = e ? mousePosition(e) : null;
		switch (this.#state) {
			case State.Still:
				return;
			case State.GrabbingCube:
				if (!mouse) return; // don't update the cube in the animation loop
				return this.#updateGrabbedCube(mouse);
			case State.StabilizingCube:
				return this.#updateStabilizingCube();
			case State.GrabbingFace:
				if (!mouse) return; // don't update the cube in the animation loop
				return this.updateGrabbedFace(mouse);
			case State.StabilizingFace:
				return this.#updateStabilizingFace();
		}
	}
}
