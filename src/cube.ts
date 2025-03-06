import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";

const CUBIE_SIZE = 0.95;
const CUBIE_SEGMENTS = 50;

let geometry: BoxGeometry | undefined = undefined;
function makeCubieGeometry() {
	if (!geometry) {
		geometry = new BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, CUBIE_SEGMENTS, CUBIE_SEGMENTS, CUBIE_SEGMENTS);
	}
	return geometry;
}

const black = new MeshBasicMaterial({ color: 0x333333, transparent: true });
function makeCubieMaterials(x: number, y: number, z: number) {
	const materials: MeshBasicMaterial[] = [
		black, // x === 1
		black, // x === -1
		black, // y === 1
		black, // y === -1
		black, // z === 1
		black, // z === -1
	];
	if (x === 1) {
		materials[0] = new MeshBasicMaterial({ color: 0xff8800 });
	}
	if (x === -1) {
		materials[1] = new MeshBasicMaterial({ color: 0xff0000 });
	}
	if (y === 1) {
		materials[2] = new MeshBasicMaterial({ color: 0xffff00 });
	}
	if (y === -1) {
		materials[3] = new MeshBasicMaterial({ color: 0xeeeeee });
	}
	if (z === 1) {
		materials[4] = new MeshBasicMaterial({ color: 0x00ff00 });
	}
	if (z === -1) {
		materials[5] = new MeshBasicMaterial({ color: 0x0000ff });
	}
	return materials;
}

function makeCubieMesh(material: MeshBasicMaterial[]) {
	return new Mesh(makeCubieGeometry(), material);
}

export function makeCubeGroup() {
	const group = new Group();
	for (let x = -1; x <= 1; x++) {
		for (let y = -1; y <= 1; y++) {
			for (let z = -1; z <= 1; z++) {
				const materials = makeCubieMaterials(x, y, z);
				const cube = makeCubieMesh(materials);
				cube.position.set(x, y, z);
				group.add(cube);
			}
		}
	}
	return group;
}

type Slice = [number, null, null] | [null, number, null] | [null, null, number];

export class Cube {
	readonly cube: Group;
	#rotatingSlice: Group | null = null;

	constructor() {
		this.cube = makeCubeGroup();
	}
	get currentSlice() {
		return this.#rotatingSlice;
	}

	/**
	 * Group all cubies in given slice and put them into `this.#rotatingSlice`
	 */
	groupSlice(slice: Slice) {
		this.#rotatingSlice = new Group();
		this.cube.add(this.#rotatingSlice);
		for (let child of this.cube.children.slice()) {
			if (!(child instanceof Mesh)) continue;
			const p = child.getWorldPosition(new Vector3());
			p.round();
			if (slice[0] !== null && slice[0] !== p.x) continue;
			if (slice[1] !== null && slice[1] !== p.y) continue;
			if (slice[2] !== null && slice[2] !== p.z) continue;
			this.#rotatingSlice.attach(child);
		}
	}

	/**
	 * Clean up currently grouped slice
	 */
	ungroupSlice() {
		if (!this.#rotatingSlice) return;
		for (let child of this.#rotatingSlice.children.slice()) {
			this.cube.attach(child);
			child.position.x = Math.round(child.position.x);
			child.position.y = Math.round(child.position.y);
			child.position.z = Math.round(child.position.z);
		}
		this.#rotatingSlice = null;
	}
}

export enum CubieKind {
	None,

	Center,
	Edge,
	Corner,
}
export function getCubieKind(cubie: Mesh): CubieKind {
	const material = cubie.material;
	if (!Array.isArray(material)) return CubieKind.None;

	return material.reduce((acc, cur) => (acc += +(cur !== black)), 0) as unknown as CubieKind;
}
