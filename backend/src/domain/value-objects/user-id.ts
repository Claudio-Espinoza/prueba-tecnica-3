export class UserId {
    constructor(public readonly value: string) {
        if (!value || value.trim() === '') {
            throw new Error('UserId must not be empty');
        }
    }

    equals(other: UserId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}