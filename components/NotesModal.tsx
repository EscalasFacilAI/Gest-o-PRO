
import React, { useState } from 'react';
import { X, Plus, Trash2, StickyNote, Save } from 'lucide-react';
import { Note, User } from '../types';
import { format } from 'date-fns';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentUser: User;
  onSaveNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, notes, currentUser, onSaveNote, onDeleteNote }) => {
  const [currentNoteText, setCurrentNoteText] = useState('');
  const userNotes = notes.filter(n => n.userId === currentUser.id).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!isOpen) return null;

  const handleAddNote = () => {
     if (!currentNoteText.trim()) return;
     const newNote: Note = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        content: currentNoteText,
        updatedAt: new Date()
     };
     onSaveNote(newNote);
     setCurrentNoteText('');
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-300">
       <div className="bg-amber-100 border-b border-amber-200 px-4 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
             <StickyNote size={20} className="text-amber-600" /> Minhas Anotações
          </h2>
          <button onClick={onClose} className="text-amber-800 hover:bg-amber-200 p-1 rounded">
             <X size={20} />
          </button>
       </div>

       {/* Add New Note */}
       <div className="p-4 bg-amber-50 border-b border-amber-100">
          <textarea 
             value={currentNoteText}
             onChange={e => setCurrentNoteText(e.target.value)}
             placeholder="Digite um lembrete rápido..."
             className="w-full p-2 text-sm border border-amber-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-400 min-h-[80px] resize-none mb-2"
          />
          <button 
             onClick={handleAddNote}
             disabled={!currentNoteText.trim()}
             className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-1.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
             <Plus size={16} /> Adicionar Lembrete
          </button>
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 custom-scrollbar">
           {userNotes.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">
                 Nenhuma anotação.
              </div>
           )}
           {userNotes.map(note => (
              <div key={note.id} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg shadow-sm relative group hover:shadow-md transition-all">
                 <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                 <div className="mt-2 flex justify-between items-center border-t border-yellow-100 pt-2">
                    <span className="text-[10px] text-slate-400">
                       {format(new Date(note.updatedAt), 'dd/MM HH:mm')}
                    </span>
                    <button 
                       onClick={() => onDeleteNote(note.id)}
                       className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <Trash2 size={14} />
                    </button>
                 </div>
              </div>
           ))}
       </div>
    </div>
  );
};

export default NotesModal;
