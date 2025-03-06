import { Quaternion } from "three";
import { Slice } from "./cube";

function getRandomSlice() {
	const slice: any[] = [null, null, null];
	const value = Math.floor(Math.random() * 2) - 1;
	const index = Math.floor(Math.random() * 3);
	slice[index] = value;
	return slice as Slice;
}

function getRandomSliceRotation(slice: Slice): Quaternion {
	const sign = Math.sign(Math.random() - 0.5);
	const s = slice.map((e) => sign * (e ?? 0) * Math.SQRT1_2);
	return new Quaternion(s[0], s[1], s[2], Math.SQRT1_2);
}
