import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Menu, Brain, User, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlanLimits } from '../hooks/usePlanLimits';
import LoginModal from './LoginModal';
import PaymentModal from './PaymentModal';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onClearChat: () => void;
  onLegalAction: (action: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode, onClearChat, onLegalAction }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const { usage, currentLimits, getUsagePercentage } = usePlanLimits();

  // Escuchar evento para abrir modal de login automáticamente
  useEffect(() => {
    const handleOpenLogin = () => {
      setShowLoginModal(true);
    };

    const handleOpenPaymentModal = () => {
      setShowPaymentModal(true);
    };

    // Cerrar modal de login cuando el usuario se autentica
    const handleAuthSuccess = () => {
      setShowLoginModal(false);
    };
    window.addEventListener('openLogin', handleOpenLogin);
    window.addEventListener('openPaymentModal', handleOpenPaymentModal);
    window.addEventListener('authSuccess', handleAuthSuccess);
    
    return () => {
      window.removeEventListener('openLogin', handleOpenLogin);
      window.removeEventListener('openPaymentModal', handleOpenPaymentModal);
      window.removeEventListener('authSuccess', handleAuthSuccess);
    };
  }, []);

  // Cerrar modal cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [isAuthenticated, showLoginModal]);
  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      onClearChat(); // Limpiar chat al cerrar sesión
      
      // Forzar actualización del estado después de cerrar sesión
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'professional':
        return 'bg-purple-100 text-purple-800';
      case 'advanced':
        return 'bg-gold-100 text-gold-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <header className={`header-premium sticky top-0 z-50 animate-slideInFromLeft`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 border-r border-black">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 hover-lift">
              <div className="bg-black border-2 border-white p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">IkbaTech</h1>
                <p className="text-xs text-gray-300">IA Legal Educativa</p>
              </div>
              {profile && profile.plan !== 'free' && (
                <span className={`ml-3 text-xs px-3 py-1 rounded-full font-medium border ${
                  profile.plan === 'advanced' 
                    ? 'text-white border-white bg-black'
                    : profile.plan === 'professional'
                    ? 'text-white border-white bg-black'
                    : 'text-white border-white bg-black'
                }`}>
                  {profile.plan.toUpperCase()}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Botón Limpiar Chat */}
              <button
                onClick={() => {
                  // Limpiar chat directamente
                  window.location.reload();
                }}
                className="hidden sm:flex text-sm text-white hover:text-gray-300 px-3 py-2 rounded-lg border border-white hover:bg-white hover:text-black transition-all duration-300 items-center space-x-2"
                title="Vaciar conversación"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Vaciar chat</span>
              </button>

              <div className="flex items-center space-x-2 sm:space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className={`text-sm hidden sm:inline ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cargando...</span>
                </div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg border border-white hover:bg-white hover:text-black transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-black border border-white rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getUserInitials()}
                      </span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium text-white">
                        {profile?.full_name || user?.email?.split('@')[0]}
                      </div>
                      {profile?.plan && (
                        <div className="text-xs px-2 py-0.5 rounded-full border border-white text-white">
                          {profile.plan}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-64 rounded-lg shadow-lg bg-black border border-white animate-scaleIn z-50">
                      <div className="p-3 border-b border-white">
                        <p className="text-sm font-medium text-white">
                          {profile?.full_name}
                        </p>
                        <p className="text-xs text-gray-300">
                          {user?.email}
                        </p>
                        {/* Mostrar uso del plan */}
                        {profile?.plan !== 'free' && (
                          <div className="mt-2 text-xs">
                            <div className="flex justify-between text-gray-400">
                              <span>Mensajes:</span>
                              <span>
                                {currentLimits.maxMessages === -1 
                                  ? `${usage.messagesThisMonth} / ∞`
                                  : `${usage.messagesThisMonth} / ${currentLimits.maxMessages}`
                                }
                              </span>
                            </div>
                            {currentLimits.maxMessages !== -1 && (
                              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-white h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(getUsagePercentage('messages'), 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowPaymentModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white hover:text-black transition-all duration-300 flex items-center space-x-2 text-white"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Actualizar Plan</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white hover:text-black transition-all duration-300 flex items-center space-x-2 text-white"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-black border-2 border-white text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-white hover:text-black transition-all duration-300"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Acceder</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            {!isAuthenticated && (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="sm:hidden p-2 rounded-lg border border-white hover:bg-white hover:text-black text-white transition-all duration-300"
              >
                <LogIn className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        isDarkMode={isDarkMode}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default Header;