export class DomainError extends Error {
    constructor(message: string, public readonly code: string = 'DOMAIN_ERROR') {
        super(message);
        this.name = 'DomainError';
        Object.setPrototypeOf(this, DomainError.prototype);
    }
}

export class NotFoundError extends DomainError {
    constructor(entity: string) {
        super(`${entity} not found`, 'NOT_FOUND');
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class ConcurrencyError extends DomainError {
    constructor(message = 'Concurrent modification detected') {
        super(message, 'CONCURRENCY_ERROR');
        this.name = 'ConcurrencyError';
        Object.setPrototypeOf(this, ConcurrencyError.prototype);
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class PermissionError extends DomainError {
    constructor(message = 'Permission denied') {
        super(message, 'PERMISSION_ERROR');
        this.name = 'PermissionError';
        Object.setPrototypeOf(this, PermissionError.prototype);
    }
}