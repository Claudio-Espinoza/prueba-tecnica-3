export class Position {
    constructor(
        public readonly x: number,
        public readonly y: number
    ) {
        if (x < 0 || y < 0) {
            throw new Error('Position coordinates must be non-negative');
        }
    }

    static create(x: number, y: number): Position {
        return new Position(x, y);
    }

    equals(other: Position): boolean {
        return this.x === other.x && this.y === other.y;
    }

    toJSON() {
        return { x: this.x, y: this.y };
    }
}