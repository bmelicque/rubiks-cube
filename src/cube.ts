import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { Face } from "./face";

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

export class Cube {
	readonly cube: Group;
	#rotatingFace: Group | null = null;

	constructor() {
		this.cube = makeCubeGroup();
	}
	get currentFace() {
		return this.#rotatingFace;
	}

	groupFace(face: Face) {
		this.#rotatingFace = new Group();
		this.cube.add(this.#rotatingFace);
		const p = new Vector3();
		for (let child of this.cube.children.slice()) {
			child.getWorldPosition(p);
			p.round();
			if ((face[0] && face[0] === p.x) || (face[1] && face[1] === p.y) || (face[2] && face[2] === p.z)) {
				this.#rotatingFace.attach(child);
			}
		}
	}

	ungroupFace() {
		if (!this.#rotatingFace) return;
		for (let child of this.#rotatingFace.children.slice()) {
			this.cube.attach(child);
			child.position.x = Math.round(child.position.x);
			child.position.y = Math.round(child.position.y);
			child.position.z = Math.round(child.position.z);
		}
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
