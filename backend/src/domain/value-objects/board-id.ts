import { v4 as uuid } from 'uuid';

export class BoardId {
    constructor(public readonly value: string = uuid()) {
        if (!value) throw new Error('BoardId must not be empty');
    }

    static create(value: string): BoardId {
        return new BoardId(value);
    }

    equals(other: BoardId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}