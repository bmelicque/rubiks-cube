export const Face = {
	Red: [-1, 0, 0],
	Orange: [1, 0, 0],
	Yellow: [0, 1, 0],
	White: [0, -1, 0],
	Green: [0, 0, 1],
	Blue: [0, 0, -1],
} as const;
export type Face = (typeof Face)[keyof typeof Face];

export function getAdjacentFaces(face: Face): Face[] {
	switch (face) {
		case Face.Orange:
		case Face.Red:
			return [Face.Green, Face.Yellow, Face.White, Face.Blue];
		case Face.Yellow:
		case Face.White:
			return [Face.Green, Face.Red, Face.Orange, Face.Blue];
		case Face.Green:
		case Face.Blue:
			return [Face.Yellow, Face.Red, Face.Orange, Face.White];
		default:
			throw new Error("invalid face value!");
	}
}

export function getFaceName(face: Face): string {
	switch (face) {
		case Face.Orange:
			return "O";
		case Face.Red:
			return "R";
		case Face.Yellow:
			return "Y";
		case Face.White:
			return "W";
		case Face.Green:
			return "G";
		case Face.Blue:
			return "B";
		default:
			throw new Error("invalid face value!");
	}
}
