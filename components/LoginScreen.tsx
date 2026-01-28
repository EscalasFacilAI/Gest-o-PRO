import React from 'react';
import { USERS } from '../constants';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        {/* Fake Google Logo/Header */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-8 h-8">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span className="text-xl font-medium text-slate-700">Fazer login</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo ao GestorPro</h2>
        <p className="text-slate-500 mb-8 text-sm">Use sua conta profissional do Google</p>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left mb-2">Contas encontradas:</p>
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full flex items-center gap-4 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group text-left"
            >
              <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              {user.role === 'LEADER' && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Líder</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
          Este sistema é exclusivo para colaboradores autorizados.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;