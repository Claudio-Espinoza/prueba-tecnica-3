// Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Array<{ field: string; message: string }>;
    timestamp: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    error?: string;
    errors?: Array<{ field: string; message: string }>;
    timestamp: string;
}

// Request types
export interface CreateBoardRequest {
    name: string;
    description?: string;
    owner_id: string;
}

export interface CreateNoteRequest {
    board_id: string;
    title: string;
    content?: string;
    x: number;
    y: number;
    updated_by: string;
}

export interface UpdateNoteRequest {
    title?: string;
    content?: string;
    x?: number;
    y?: number;
    updated_by: string;
}

export interface CreateCommentRequest {
    board_id?: string;
    note_id: string;
    text: string;
    user_name?: string;
}

// Entity response types
export interface BoardDTO {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface NoteDTO {
    id: string;
    board_id: string;
    title: string;
    content: string;
    x: number;
    y: number;
    updated_by: string;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface CommentDTO {
    id: string;
    note_id: string;
    user_name: string;
    text: string;
    created_at: string;
}

export interface UserDTO {
    id: string;
    name: string;
    socket_id: string;
    connected_at: string;
}

// Validation error response
export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationErrorResponse extends ApiResponse {
    errors?: ValidationError[];
}