import { Quaternion } from "three";

export class Stabilizer {
	readonly #from: Quaternion;
	readonly #to: Quaternion;
	readonly #startedAt: number;
	readonly #duration: number;

	constructor(from: Quaternion, to: Quaternion, duration = 300) {
		this.#from = from.clone();
		this.#to = to;
		this.#startedAt = performance.now();
		this.#duration = duration;
	}

	/** `true` if the animation is over */
	get done() {
		return (performance.now() - this.#startedAt) / this.#duration > 1;
	}

	getCurrentOrientation() {
		const t = Math.min(1, (performance.now() - this.#startedAt) / this.#duration);
		const easedOut = 1 - (1 - t) ** 2;
		return this.#from.clone().slerp(this.#to, easedOut);
	}
}
