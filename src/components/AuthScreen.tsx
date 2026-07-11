import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Activity, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Flame, 
  TrendingUp, 
  Gauge, 
  Clock, 
  Heart,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Statuses
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Splash message sequence
  const [splashStatus, setSplashStatus] = useState('Iniciando o Lab de Performance...');

  useEffect(() => {
    // Sequence of mock loading states for the athletic vibe
    const timer1 = setTimeout(() => setSplashStatus('Otimizando métricas de ritmo...'), 500);
    const timer2 = setTimeout(() => setSplashStatus('Sincronizando planilha de volume...'), 1000);
    const timer3 = setTimeout(() => setShowSplash(false), 1600); // ~1.5 - 1.6s total

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const resetStatus = () => {
    setError(null);
    setMessage(null);
  };

  const switchMode = (newMode: AuthMode) => {
    resetStatus();
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
  };

  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'O endereço de e-mail não é válido.';
      case 'auth/user-disabled':
        return 'Este usuário foi desativado.';
      case 'auth/user-not-found':
        return 'Não há usuário correspondente a este e-mail.';
      case 'auth/wrong-password':
        return 'Senha incorreta. Verifique suas credenciais.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso por outra conta.';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Escolha uma senha de pelo menos 6 caracteres.';
      case 'auth/invalid-credential':
        return 'Credenciais inválidas. Verifique seu e-mail e senha.';
      case 'auth/operation-not-allowed':
        return 'O provedor de login com e-mail/senha não está ativado no Firebase Console. Ative-o em Authentication > Sign-in method ou utilize o botão "Entrar com Google" abaixo.';
      default:
        return `Ocorreu um erro ao processar sua solicitação (Código: ${code}). Se o erro persistir, tente o login com Google.`;
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Criar/atualizar perfil do atleta de forma segura
      const defaultAthleteId = `user-athlete-${user.uid}`;
      await setDoc(doc(db, 'users', defaultAthleteId), {
        name: user.displayName || 'Atleta Anônimo',
        avatarColor: 'from-rose-500 to-pink-600',
        ownerId: user.uid
      }, { merge: true });

      onAuthSuccess();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(getFirebaseErrorMessage(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onAuthSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Create auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // 2. Update display name
      await updateProfile(user, { displayName: name.trim() });
      
      // 3. Create initial athlete profile inside user's private space
      const defaultAthleteId = `user-athlete-${user.uid}`;
      await setDoc(doc(db, 'users', defaultAthleteId), {
        name: name.trim(),
        avatarColor: 'from-rose-500 to-pink-600',
        ownerId: user.uid // Scoped to this logged-in user
      });

      onAuthSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada e spam para cadastrar sua nova senha.');
      setEmail('');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070809] text-[#F4F4F4] font-sans relative overflow-hidden flex items-center justify-center">
      
      {/* 1. ATHLETIC SPLASH SCREEN INTRO */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 bg-[#070809] z-50 flex flex-col items-center justify-center px-6"
          >
            {/* Fine grid network backdrop in splash */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-80" />
            
            <div className="relative text-center max-w-sm flex flex-col items-center">
              {/* Spinning performance gauge ring */}
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-t-2 border-r-2 border-brand-neon border-b border-l-0"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border-b-2 border-l border-white/20 border-t-0 border-r-0"
                />
                <motion.div 
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-12 h-12 bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon"
                >
                  <Activity size={24} className="stroke-[2.5]" />
                </motion.div>
              </div>

              {/* Title with Speed lines */}
              <div className="flex items-baseline gap-2 mb-1.5 overflow-hidden">
                <motion.span 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-4xl font-black tracking-tighter italic text-white"
                >
                  AQUECE
                </motion.span>
                <motion.span 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-4xl font-black tracking-tighter italic text-brand-neon"
                >
                  .
                </motion.span>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.3 }}
                className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/80 mb-6"
              >
                LAB DE PERFORMANCE CORRIDA
              </motion.p>

              {/* Loader Subtitles */}
              <div className="h-5 flex items-center justify-center">
                <motion.p 
                  key={splashStatus}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-mono text-brand-neon/90"
                >
                  {splashStatus}
                </motion.p>
              </div>

              {/* Micro layout details to match premium design */}
              <div className="mt-12 flex gap-4 text-[8px] font-mono text-white/25">
                <span>VITE + REACT</span>
                <span>•</span>
                <span>SECURE DATABASE</span>
                <span>•</span>
                <span>PERFORMANCE LAB v1.2</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PREMIUM SPLIT-SCREEN LAYOUT */}
      <div className="w-full min-h-screen flex flex-row relative z-10">
        
        {/* LEFT PANEL - Premium Athletic Showcase & Motivation (Desktop Only) */}
        <div className="hidden lg:flex lg:w-[48%] bg-[#0B0D0F] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
          {/* Subtle grid line backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          
          {/* Top glowing radar light */}
          <div className="absolute top-0 left-1/3 w-[350px] h-[350px] bg-brand-neon/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black italic tracking-tighter text-white">AQUECE</span>
              <span className="text-2xl font-black italic tracking-tighter text-brand-neon">.</span>
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-[0.25em] ml-2">LAB</span>
            </div>
            <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
              Estilo de Vida & Volume Programado
            </p>
          </div>

          {/* Center Graphic: Mock Performance Stats Board */}
          <div className="relative z-10 my-auto max-w-md">
            <div className="space-y-6">
              
              {/* Motivational statement */}
              <div className="border-l-2 border-brand-neon pl-4 py-1">
                <span className="text-[10px] font-mono text-brand-neon uppercase tracking-widest font-bold">CONCEITO ATLETA</span>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase mt-1 leading-snug">
                  A disciplina supera o talento quando o talento não quer treinar.
                </h1>
              </div>

              {/* Bento Stats Display */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-none">
                  <div className="flex items-center justify-between text-white/40 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider">Metas Semanais</span>
                    <TrendingUp size={14} className="text-brand-neon" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">100%</div>
                  <p className="text-[10px] text-white/50 mt-1">Conclusão de treinos</p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-none">
                  <div className="flex items-center justify-between text-white/40 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider">Zonas de Ritmo</span>
                    <Gauge size={14} className="text-brand-neon" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">Z2 / Z3</div>
                  <p className="text-[10px] text-white/50 mt-1">Gasto aeróbico otimizado</p>
                </div>
              </div>

              {/* Stride Telemetry Widget */}
              <div className="bg-[#121417]/80 border border-brand-neon/20 p-4 rounded-none relative">
                <div className="absolute top-0 right-0 bg-brand-neon text-black text-[8px] font-mono font-black uppercase px-2 py-0.5">
                  LIVE TELEMETRIA
                </div>
                <span className="text-[9px] font-mono text-brand-neon uppercase tracking-widest block mb-2">Análise de Ritmo</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon animate-pulse rounded-full">
                      <Heart size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Cadência Alvo</div>
                      <div className="text-xs text-white/50 font-mono">180 SPM • Foco em Eficiência</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black font-mono text-white">Elite</div>
                    <div className="text-[10px] text-white/40 font-mono">Nível Técnico</div>
                  </div>
                </div>

                {/* Simulated EKG Grid animation */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-1 h-8">
                  {[40, 20, 80, 50, 90, 10, 40, 30, 85, 20, 50, 40, 95, 30, 40].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-brand-neon/25" 
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Footer details */}
          <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-white/30">
            <span>SISTEMA DE CORRIDA INTEGRADO</span>
            <span>PROJETADO PARA ATLETAS</span>
          </div>
        </div>

        {/* RIGHT PANEL - Authentic Login Card Wrapper (Adapts to full screen on smaller displays) */}
        <div className="flex-1 bg-[#070809] flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto">
          {/* Subtle floating orb behind form container */}
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-brand-neon/5 rounded-full blur-[130px] pointer-events-none" />
          
          {/* Header branding for Mobile */}
          <div className="lg:hidden flex items-center justify-between w-full mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black italic tracking-tighter text-white">AQUECE</span>
              <span className="text-xl font-black italic tracking-tighter text-brand-neon">.</span>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-none text-[8px] font-mono text-white/60 tracking-widest uppercase">
              Lab de Corrida
            </div>
          </div>

          {/* Main Card Container centered */}
          <div className="my-auto w-full max-w-md mx-auto relative z-10">
            
            {/* Fine framing border containing the form */}
            <div className="bg-[#0F1113]/90 border border-white/10 p-6 sm:p-10 rounded-none relative shadow-2xl">
              
              {/* Corner brackets to represent technical accuracy */}
              <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-brand-neon" />
              <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-brand-neon" />
              <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-brand-neon" />
              <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-brand-neon" />

              <AnimatePresence mode="wait">
                
                {/* 1. LOGIN MODE */}
                {mode === 'login' && (
                  <motion.div
                    key="login-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-1.5 w-1.5 bg-brand-neon rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">
                          Acessar Conta
                        </h2>
                      </div>
                      <p className="text-xs font-mono text-white/50 lowercase">
                        insira as credenciais para acessar seus treinos.
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                          E-mail
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                            <Mail size={15} />
                          </div>
                          <input
                            id="login-email"
                            type="email"
                            required
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                            Senha
                          </label>
                          <button
                            type="button"
                            onClick={() => switchMode('forgot_password')}
                            className="text-[10px] font-mono uppercase tracking-wider text-brand-neon hover:text-[#b8e600] font-bold cursor-pointer transition-colors"
                          >
                            Recuperar?
                          </button>
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                            <Lock size={15} />
                          </div>
                          <input
                            id="login-password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20 transition-all"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-mono flex items-start gap-2">
                          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        id="login-submit"
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 text-xs font-mono font-black text-black bg-brand-neon hover:bg-[#b8e600] transition-all rounded-none cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6 border border-transparent hover:scale-[1.01]"
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <span>ENTRAR NO APP</span>
                            <ArrowRight size={15} strokeWidth={2.5} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="relative my-5 flex items-center justify-center">
                      <div className="absolute inset-x-0 h-px bg-white/5" />
                      <span className="relative px-3 bg-[#0F1113] text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        ou
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-3 text-xs font-mono font-black text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 rounded-none cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.95 15.45 1 12.24 1 5.48 1 0 6.48 0 13.2s5.48 12.2 12.24 12.2c7.055 0 11.75-4.96 11.75-11.96 0-.813-.087-1.43-.195-2.155H12.24z"
                        />
                      </svg>
                      <span>ENTRAR COM GOOGLE</span>
                    </button>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                      <p className="text-xs text-white/40 font-mono">
                        NÃO TEM CONTA?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className="text-brand-neon hover:text-[#b8e600] font-black cursor-pointer uppercase tracking-wider"
                        >
                          CADASTRAR-SE
                        </button>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 2. REGISTER MODE */}
                {mode === 'register' && (
                  <motion.div
                    key="register-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-1.5 w-1.5 bg-brand-neon rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">
                          CRIAR CONTA
                        </h2>
                      </div>
                      <p className="text-xs font-mono text-white/50 lowercase">
                        faça o cadastro para gerenciar seus treinos.
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                          Nome do Atleta
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                            <UserIcon size={15} />
                          </div>
                          <input
                            id="register-name"
                            type="text"
                            required
                            placeholder="Ex: Déborah Braga"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                          E-mail
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                            <Mail size={15} />
                          </div>
                          <input
                            id="register-email"
                            type="email"
                            required
                            placeholder="atleta@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                            Senha
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                              <Lock size={15} />
                            </div>
                            <input
                              id="register-password"
                              type="password"
                              required
                              placeholder="Mín. 6 dgt"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-xs text-white font-mono placeholder-white/20 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                            Confirmar
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                              <Lock size={15} />
                            </div>
                            <input
                              id="register-confirm"
                              type="password"
                              required
                              placeholder="Senha"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-xs text-white font-mono placeholder-white/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-mono flex items-start gap-2">
                          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        id="register-submit"
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 text-xs font-mono font-black text-black bg-brand-neon hover:bg-[#b8e600] transition-all rounded-none cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6 border border-transparent hover:scale-[1.01]"
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <span>CRIAR MINHA CONTA</span>
                            <ArrowRight size={15} strokeWidth={2.5} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="relative my-5 flex items-center justify-center">
                      <div className="absolute inset-x-0 h-px bg-white/5" />
                      <span className="relative px-3 bg-[#0F1113] text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        ou
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-3 text-xs font-mono font-black text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 rounded-none cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.95 15.45 1 12.24 1 5.48 1 0 6.48 0 13.2s5.48 12.2 12.24 12.2c7.055 0 11.75-4.96 11.75-11.96 0-.813-.087-1.43-.195-2.155H12.24z"
                        />
                      </svg>
                      <span>CADASTRAR COM GOOGLE</span>
                    </button>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                      <p className="text-xs text-white/40 font-mono">
                        JÁ TEM UMA CONTA?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="text-brand-neon hover:text-[#b8e600] font-black cursor-pointer uppercase tracking-wider"
                        >
                          ENTRAR
                        </button>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 3. FORGOT PASSWORD MODE */}
                {mode === 'forgot_password' && (
                  <motion.div
                    key="forgot-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6 flex items-center gap-2">
                      <KeyRound className="text-brand-neon" size={20} />
                      <h2 className="text-xl font-black uppercase tracking-tight text-white">
                        Recuperar Senha
                      </h2>
                    </div>

                    <p className="text-xs font-mono text-white/50 lowercase mb-6">
                      digite seu e-mail para enviarmos as instruções de redefinição de senha.
                    </p>

                    {message ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 py-2"
                      >
                        <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs font-mono flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-brand-neon flex-shrink-0 mt-0.5" />
                          <span>{message}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="w-full py-3 text-xs font-mono font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-none transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          VOLTAR AO LOGIN
                        </button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                            Seu E-mail Cadastrado
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand-neon transition-colors">
                              <Mail size={15} />
                            </div>
                            <input
                              id="forgot-email"
                              type="email"
                              required
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-3 bg-[#070809] border border-white/10 hover:border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20 transition-all"
                            />
                          </div>
                        </div>

                        {error && (
                          <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-mono flex items-start gap-2">
                            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => switchMode('login')}
                            disabled={isLoading}
                            className="flex-1 py-3 text-xs font-mono font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-none transition-colors cursor-pointer uppercase tracking-wider text-center"
                          >
                            Cancelar
                          </button>
                          <button
                            id="forgot-submit"
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] py-3 text-xs font-mono font-black text-black bg-brand-neon hover:bg-[#b8e600] transition-colors rounded-none cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <span>ENVIAR E-MAIL</span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer details on Mobile/Tablet */}
          <div className="text-center mt-8 text-[9px] font-mono text-white/20 flex flex-col items-center gap-1">
            <span>AQUECE. LAB DE PERFORMANCE</span>
            <span className="opacity-60">Sua planilha inteligente de volume de corrida</span>
          </div>

        </div>

      </div>
    </div>
  );
}
