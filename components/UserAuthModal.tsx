import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null; // The user trying to login or change password
  mode: 'LOGIN' | 'CHANGE_PASSWORD';
  onSuccess: (updatedUser?: User) => void;
}

const UserAuthModal: React.FC<UserAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  targetUser, 
  mode, 
  onSuccess 
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen, targetUser, mode]);

  if (!isOpen || !targetUser) return null;

  // Determine the sub-mode
  // If mode is LOGIN but user has NO password, it's actually a "FIRST_ACCESS" (Create Password)
  const isFirstAccess = mode === 'LOGIN' && (!targetUser.password || String(targetUser.password).trim() === '');
  const isLogin = mode === 'LOGIN' && !isFirstAccess;
  const isChange = mode === 'CHANGE_PASSWORD';

  const handleSubmit = () => {
    setError(null);

    // 1. First Access: Create Password
    if (isFirstAccess) {
        if (newPassword.length < 4) {
            setError("A senha deve ter pelo menos 4 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        // Save new password
        const updatedUser = { ...targetUser, password: newPassword };
        onSuccess(updatedUser);
        onClose();
        return;
    }

    // 2. Login: Verify Password
    if (isLogin) {
        // Ensure string comparison to handle cases where Sheets sends number (e.g. 1234 vs "1234")
        if (String(oldPassword) === String(targetUser.password)) {
            onSuccess(); // Login successful
            onClose();
        } else {
            setError("Senha incorreta.");
        }
        return;
    }

    // 3. Change Password: Verify Old + Create New
    if (isChange) {
        if (String(oldPassword) !== String(targetUser.password)) {
            setError("A senha atual está incorreta.");
            return;
        }
        if (newPassword.length < 4) {
            setError("A nova senha deve ter pelo menos 4 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("As novas senhas não coincidem.");
            return;
        }
        // Save updated password
        const updatedUser = { ...targetUser, password: newPassword };
        onSuccess(updatedUser);
        onClose();
        return;
    }
  };

  const title = isFirstAccess ? 'Definir Senha de Acesso' : isLogin ? 'Acesso Restrito' : 'Alterar Senha';
  const subtitle = isFirstAccess 
    ? `Olá, ${targetUser.name.split(' ')[0]}. Defina sua senha para o primeiro acesso.` 
    : isLogin 
    ? `Digite a senha de ${targetUser.name.split(' ')[0]} para continuar.`
    : 'Digite sua senha atual e a nova senha desejada.';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {isChange ? <KeyRound size={20} className="text-indigo-600"/> : <Lock size={20} className="text-indigo-600"/>}
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-4">{subtitle}</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Field: Old Password / Login Password */}
          {(isLogin || isChange) && (
             <div>
               <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                 {isChange ? 'Senha Atual' : 'Senha'}
               </label>
               <input 
                 type="password" 
                 value={oldPassword}
                 onChange={e => setOldPassword(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                 placeholder="••••••"
                 autoFocus={isLogin}
               />
             </div>
          )}

          {/* Fields: New Password */}
          {(isFirstAccess || isChange) && (
             <>
               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                   Nova Senha
                 </label>
                 <input 
                   type="password" 
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                   placeholder="Mínimo 4 caracteres"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                   Confirmar Senha
                 </label>
                 <input 
                   type="password" 
                   value={confirmPassword}
                   onChange={e => setConfirmPassword(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                   placeholder="••••••"
                 />
               </div>
             </>
          )}

          <button 
            onClick={handleSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg shadow-lg shadow-indigo-200 mt-2 transition-colors flex items-center justify-center gap-2"
          >
            {isFirstAccess ? 'Criar Senha e Entrar' : isLogin ? 'Entrar' : 'Salvar Nova Senha'}
            {(isFirstAccess || isChange) && <ShieldCheck size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuthModal;