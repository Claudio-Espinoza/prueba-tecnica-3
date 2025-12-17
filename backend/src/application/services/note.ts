import { NoteRepository } from '../../domain/repositories/note';
import { NoteDTO } from '../dtos/note-dto';

export class NoteService {
    constructor(private noteRepository: NoteRepository) { }

    async getNotesByBoard(boardId: string): Promise<NoteDTO[]> {
        const notes = await this.noteRepository.findByBoard(boardId);
        return notes.map(n => n.toJSON() as NoteDTO);
    }
}