export enum RoleType {
    VIEWER = 'viewer',
    EDITOR = 'editor'
}

export class Role {
    constructor(public readonly type: RoleType) {
        if (!Object.values(RoleType).includes(type)) {
            throw new Error(`Invalid role: ${type}`);
        }
    }

    static create(type: RoleType): Role {
        return new Role(type);
    }

    isEditor(): boolean {
        return this.type === RoleType.EDITOR;
    }

    isViewer(): boolean {
        return this.type === RoleType.VIEWER;
    }

    static editor(): Role {
        return new Role(RoleType.EDITOR);
    }

    static viewer(): Role {
        return new Role(RoleType.VIEWER);
    }

    canEdit(): boolean {
        return this.isEditor();
    }

    toString(): string {
        return this.type;
    }
}