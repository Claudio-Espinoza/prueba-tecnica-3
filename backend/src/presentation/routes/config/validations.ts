import { ValidationError } from './types';
import { logger } from '../../../infrastructure/logger/index';

export class ValidationService {
    static validateUUID(value: string, fieldName: string = 'ID'): ValidationError | null {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            return { field: fieldName, message: `${fieldName} must be a valid UUID` };
        }
        return null;
    }

    static validateString(value: any, fieldName: string, minLength: number = 1, maxLength: number = 255): ValidationError | null {
        if (typeof value !== 'string') {
            return { field: fieldName, message: `${fieldName} must be a string` };
        }
        if (value.length < minLength) {
            return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters` };
        }
        if (value.length > maxLength) {
            return { field: fieldName, message: `${fieldName} must not exceed ${maxLength} characters` };
        }
        return null;
    }

    static validateNumber(value: any, fieldName: string, min?: number, max?: number): ValidationError | null {
        if (typeof value !== 'number' || isNaN(value)) {
            return { field: fieldName, message: `${fieldName} must be a number` };
        }
        if (min !== undefined && value < min) {
            return { field: fieldName, message: `${fieldName} must be at least ${min}` };
        }
        if (max !== undefined && value > max) {
            return { field: fieldName, message: `${fieldName} must not exceed ${max}` };
        }
        return null;
    }

    static validateInteger(value: any, fieldName: string, min?: number, max?: number): ValidationError | null {
        const numberError = this.validateNumber(value, fieldName, min, max);
        if (numberError) return numberError;
        if (!Number.isInteger(value)) {
            return { field: fieldName, message: `${fieldName} must be an integer` };
        }
        return null;
    }

    static validateEnum(value: any, fieldName: string, allowedValues: string[]): ValidationError | null {
        if (!allowedValues.includes(value)) {
            return {
                field: fieldName,
                message: `${fieldName} must be one of: ${allowedValues.join(', ')}`
            };
        }
        return null;
    }

    static validateCreateBoard(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        // name validation
        const nameError = this.validateString(data.name, 'name', 1, 100);
        if (nameError) errors.push(nameError);

        // owner_id validation
        if (!data.owner_id) {
            errors.push({ field: 'owner_id', message: 'owner_id is required' });
        } else {
            const ownerError = this.validateString(data.owner_id, 'owner_id', 1, 100);
            if (ownerError) errors.push(ownerError);
        }

        // description validation (optional)
        if (data.description && typeof data.description !== 'string') {
            errors.push({ field: 'description', message: 'description must be a string' });
        }

        return errors;
    }

    static validateCreateNote(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.board_id) {
            errors.push({ field: 'board_id', message: 'board_id is required' });
        } else {
            const boardIdError = this.validateUUID(data.board_id, 'board_id');
            if (boardIdError) errors.push(boardIdError);
        }

        const titleError = this.validateString(data.title, 'title', 1, 255);
        if (titleError) errors.push(titleError);

        const xError = this.validateInteger(data.x, 'x', 0, 10000);
        if (xError) errors.push(xError);

        const yError = this.validateInteger(data.y, 'y', 0, 10000);
        if (yError) errors.push(yError);

        if (!data.updated_by) {
            errors.push({ field: 'updated_by', message: 'updated_by is required' });
        }

        if (data.content && typeof data.content !== 'string') {
            errors.push({ field: 'content', message: 'content must be a string' });
        }

        return errors;
    }

    static validateUpdateNote(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.updated_by) {
            errors.push({ field: 'updated_by', message: 'updated_by is required' });
        }

        if (data.title !== undefined) {
            const titleError = this.validateString(data.title, 'title', 1, 255);
            if (titleError) errors.push(titleError);
        }

        if (data.content !== undefined && typeof data.content !== 'string') {
            errors.push({ field: 'content', message: 'content must be a string' });
        }

        if (data.x !== undefined) {
            const xError = this.validateInteger(data.x, 'x', 0, 10000);
            if (xError) errors.push(xError);
        }

        if (data.y !== undefined) {
            const yError = this.validateInteger(data.y, 'y', 0, 10000);
            if (yError) errors.push(yError);
        }

        return errors;
    }

    static validateCreateComment(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.note_id) {
            errors.push({ field: 'note_id', message: 'note_id is required' });
        } else {
            const noteIdError = this.validateUUID(data.note_id, 'note_id');
            if (noteIdError) errors.push(noteIdError);
        }

        const textError = this.validateString(data.text, 'text', 1, 1000);
        if (textError) errors.push(textError);

        const userNameError = this.validateString(data.user_name, 'user_name', 1, 100);
        if (userNameError) errors.push(userNameError);

        return errors;
    }

    static validatePagination(page: any, limit: any): { page: number; limit: number; errors: ValidationError[] } {
        const errors: ValidationError[] = [];

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;

        if (pageNum < 1) {
            errors.push({ field: 'page', message: 'page must be at least 1' });
        }

        if (limitNum < 1) {
            errors.push({ field: 'limit', message: 'limit must be at least 1' });
        }

        if (limitNum > 100) {
            errors.push({ field: 'limit', message: 'limit cannot exceed 100' });
        }

        return {
            page: Math.max(1, pageNum),
            limit: Math.min(100, Math.max(1, limitNum)),
            errors
        };
    }
}