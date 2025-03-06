import { Euler, Quaternion, Vector2 } from "three";
import { Cube, Slice } from "./cube";
import { Stabilizer } from "./stabilizer";
import { findClippedOrientation } from "./utils";

export enum State {
	Still,
	GrabbingCube,
	StabilizingCube,
	GrabbingSlice,
	StabilizingSlice,
}

function mousePosition(e: MouseEvent) {
	const renderer = document.querySelector("canvas");
	if (!renderer) throw new Error("invalid app state: renderer should be a canvas element");
	return new Vector2((e.clientX / renderer.clientWidth) * 2 - 1, -(e.clientY / renderer.clientHeight) * 2 + 1);
}

export class Action {
	/**
	 * No slice means that the whole cube is rotated
	 */
	slice?: Slice;
	direction?: "x" | "y";
	from = new Quaternion();
	to = new Quaternion();

	constructor(from?: Quaternion) {
		if (from) this.from = from.clone();
	}
}

export class StateHandler {
	#state = State.Still;
	#cube: Cube;
	#mouseStart: Vector2 | null = null;
	#grabbedPoint: Vector2 | null = null;
	// TODO: need only 1 start quaternion
	#cubeStartQuaternion = new Quaternion();
	// TODO: need only 1 stabilizer
	#cubeStabilizer: Stabilizer | null = null;
	#sliceRotationDirection: "x" | "y" | null = null;
	#sliceStartWorldQuaternion = new Quaternion();
	#sliceStabilizer: Stabilizer | null = null;

	// TODO: maybe should take in StartQuaternion & rotation?
	#currentAction: Action | null = new Action();
	#history: Action[] = [];

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
			case State.GrabbingSlice:
				this.#mouseStart = null;
				this.#grabbedPoint = null;
				break;
			case State.StabilizingSlice:
				this.#sliceStabilizer = null;
				this.#cube.ungroupSlice();
				break;
		}

		// set up new state
		switch (state) {
			case State.Still:
				if (this.#currentAction) this.#history.push(this.#currentAction);
				break;
			case State.GrabbingCube:
				if (!e) throw new Error("invalid app state: mouse event should've been passed here!");
				this.#mouseStart = mousePosition(e);
				this.#cubeStartQuaternion = this.#cube.cube.quaternion.clone();
				this.#currentAction = new Action(this.#cubeStartQuaternion.clone());
				break;
			case State.StabilizingCube:
				this.#state = State.StabilizingCube;
				const q = findClippedOrientation(this.#cube.cube.quaternion);
				this.#cubeStabilizer = new Stabilizer(this.#cube.cube.quaternion, q);
				this.#currentAction!.to = q;
				break;
			case State.GrabbingSlice:
				if (!e) throw new Error("invalid app state: mouse event should've been passed here!");
				this.#mouseStart = mousePosition(e);
				this.#sliceRotationDirection = null;
				this.#currentAction = new Action();
				break;
			case State.StabilizingSlice:
				this.#state = State.StabilizingSlice;
				const worldQuarternion = this.#cube.currentSlice!.getWorldQuaternion(new Quaternion());
				const sliceTargetOrientation = findClippedOrientation(worldQuarternion);
				this.#currentAction!.to = sliceTargetOrientation.clone();
				this.#sliceStabilizer = new Stabilizer(worldQuarternion, sliceTargetOrientation);
				break;
		}
		this.#state = state;
	}

	grabAt(position: Vector2) {
		this.#grabbedPoint = position;
	}

	#grabSlice() {
		if (!this.#grabbedPoint) throw new Error("no point have been grabbed!");
		if (!this.#sliceRotationDirection) throw new Error("no rotation direction!");

		const slice: Slice =
			this.#sliceRotationDirection === "x" ? [null, this.#grabbedPoint.y, null] : [this.#grabbedPoint.x, null, null];
		this.#cube.groupSlice(slice);
		this.#currentAction!.slice = slice;
	}

	#updateGrabbedSlice(mouse: Vector2) {
		if (!this.#mouseStart) throw new Error("invalid app state: missing mouse starting position");
		mouse.sub(this.#mouseStart);
		if (this.#sliceRotationDirection === null) {
			if (mouse.x === 0 && mouse.y === 0) return;
			this.#sliceRotationDirection = Math.abs(mouse.x) > Math.abs(mouse.y) ? "x" : "y";
			this.#grabSlice();
			this.#sliceStartWorldQuaternion = this.#cube.currentSlice!.getWorldQuaternion(new Quaternion());
			this.#currentAction!.from = this.#sliceStartWorldQuaternion.clone();
			this.#currentAction!.direction = this.#sliceRotationDirection;
		}
		const x = this.#sliceRotationDirection === "y" ? -2 * mouse.y : 0;
		const y = this.#sliceRotationDirection === "x" ? 2 * mouse.x : 0;
		const mouseRotation = new Quaternion().setFromEuler(new Euler(x, y));
		const worldQuaternion = mouseRotation.multiply(this.#sliceStartWorldQuaternion);
		const localQuaternion = this.#cube.cube.quaternion.clone().conjugate().multiply(worldQuaternion);
		this.#cube.currentSlice!.quaternion.copy(localQuaternion);
		return;
	}

	#updateStabilizingSlice() {
		if (!this.#sliceStabilizer) throw new Error("invalid app state: expected stabilizer");
		const faceWorldQuaternion = this.#sliceStabilizer.getCurrentOrientation();
		const localQuaternion = this.#cube.cube.quaternion.clone().conjugate().multiply(faceWorldQuaternion);
		this.#cube.currentSlice!.quaternion.copy(localQuaternion);
		if (this.#sliceStabilizer.done) this.setState(State.Still);
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
			case State.GrabbingSlice:
				if (!mouse) return; // don't update the cube in the animation loop
				return this.#updateGrabbedSlice(mouse);
			case State.StabilizingSlice:
				return this.#updateStabilizingSlice();
		}
	}

	#undoLastSlice(last: Action) {
		this.#state = State.StabilizingSlice;
		this.#cube.groupSlice(last.slice!);
		// slices don't persist between moves, so they always start at default orientation relative to cube
		const sliceQuaternion = this.#cube.cube.quaternion;
		const to = sliceQuaternion.clone().multiply(last.to.clone().conjugate()).multiply(sliceQuaternion);
		this.#sliceStabilizer = new Stabilizer(sliceQuaternion, to);
		this.#sliceRotationDirection = last.direction!;
	}

	#undoLastCube(last: Action) {
		this.#state = State.StabilizingCube;
		this.#cubeStabilizer = new Stabilizer(last.to, last.from);
	}

	undoLast() {
		const last = this.#history.pop();
		// TODO: should not be able to click on button!
		if (!last) return;

		this.#currentAction = null;
		last.slice ? this.#undoLastSlice(last) : this.#undoLastCube(last);
	}
}
