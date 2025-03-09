import { Quaternion, Vector2 } from "three";
import { Face, getAdjacentFaces, getFaceName } from "./face";

const S3 = Math.sin(Math.PI / 3) / Math.sqrt(3); // = .5 btw
const S2 = Math.sin(Math.PI / 2) / Math.SQRT2;
export const orientations = {
	GY: new Quaternion(0, 0, 0, 1),
	GO: new Quaternion(0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)),
	GW: new Quaternion(0, 0, Math.sin(Math.PI / 2), Math.cos(Math.PI / 2)),
	GR: new Quaternion(0, 0, Math.sin(-Math.PI / 4), Math.cos(-Math.PI / 4)),

	OG: new Quaternion(-S3, -S3, -S3, Math.cos(Math.PI / 3)),
	OY: new Quaternion(0, Math.sin(-Math.PI / 4), 0, Math.cos(-Math.PI / 4)),
	OB: new Quaternion(S3, -S3, S3, Math.cos(Math.PI / 3)),
	OW: new Quaternion(S2, 0, S2, 0),

	BY: new Quaternion(0, Math.sin(Math.PI / 2), 0, Math.cos(-Math.PI / 2)),
	BO: new Quaternion(S2, S2, 0, 0),
	BW: new Quaternion(Math.sin(Math.PI / 2), 0, 0, Math.cos(Math.PI / 2)),
	BR: new Quaternion(S2, -S2, 0, 0),

	RG: new Quaternion(-S3, S3, S3, Math.cos(Math.PI / 3)),
	RY: new Quaternion(0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)),
	RB: new Quaternion(S3, S3, -S3, Math.cos(Math.PI / 3)),
	RW: new Quaternion(S2, 0, -S2, 0),

	YR: new Quaternion(S3, -S3, -S3, Math.cos(Math.PI / 3)),
	YB: new Quaternion(Math.sin(Math.PI / 4), 0, 0, Math.cos(Math.PI / 4)),
	YO: new Quaternion(S3, S3, S3, Math.cos(Math.PI / 3)),
	YG: new Quaternion(0, S2, S2, 0),

	WR: new Quaternion(-S3, S3, -S3, Math.cos(Math.PI / 3)),
	WG: new Quaternion(Math.sin(-Math.PI / 4), 0, 0, Math.cos(-Math.PI / 4)),
	WO: new Quaternion(-S3, -S3, S3, Math.cos(Math.PI / 3)),
	WB: new Quaternion(0, S2, -S2, 0),
};
export function findClippedOrientation(orientation: Quaternion): Quaternion {
	let front: Face, top: Face;
	let fz = -1;
	let ty = -1;

	const q = orientation.clone();
	const q_ = q.clone().conjugate();
	for (let face of Object.values(Face)) {
		const f = new Quaternion(face[0], face[1], face[2]);
		const r = q.clone().multiply(f).multiply(q_);
		if (r.z > fz) {
			front = face;
			fz = r.z;
		}
	}
	for (let face of getAdjacentFaces(front!)) {
		const f = new Quaternion(face[0], face[1], face[2]);
		const r = q.clone().multiply(f).multiply(q_);
		if (r.y > ty) {
			top = face;
			ty = r.y;
		}
	}

	// TODO: wanted position is so that front becomes [0, 0, any, any] and top [0, any, 0, any]
	const s = getFaceName(front!) + getFaceName(top!);
	return orientations[s as keyof typeof orientations];
}

export function equals(a: Quaternion, b: Quaternion): boolean {
	return Math.abs(a.clone().dot(b)) > 1 - Number.EPSILON;
}

/**
 * Compute the mouse|touch position
 * @param e the event
 */
export function eventPosition(e: MouseEvent | TouchEvent): Vector2 {
	const renderer = document.querySelector("canvas");
	if (!renderer) throw new Error("canvas not found!");
	if (e instanceof TouchEvent) {
		const { touches, changedTouches } = e;
		const touch = touches[0] ?? changedTouches[0];
		return new Vector2((touch.pageX / renderer.clientWidth) * 2 - 1, -(touch.pageY / renderer.clientHeight) * 2 + 1);
	}
	if (e instanceof MouseEvent) {
		return new Vector2((e.clientX / renderer.clientWidth) * 2 - 1, -(e.clientY / renderer.clientHeight) * 2 + 1);
	}
	throw new Error("unhandled event type");
}
