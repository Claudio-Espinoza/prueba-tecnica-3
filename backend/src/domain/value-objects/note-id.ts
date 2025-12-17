import { v4 as uuid } from 'uuid';

export class NoteId {
    constructor(public readonly value: string = uuid()) {
        if (!value) throw new Error('NoteId must not be empty');
    }

    static create(value: string): NoteId {
        return new NoteId(value);
    }

    equals(other: NoteId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}