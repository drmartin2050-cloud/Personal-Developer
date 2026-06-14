import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Unlock, Eye, EyeOff, Copy, ExternalLink, Plus, Trash2, X, ShieldAlert, Key } from 'lucide-react';
import { LocalizationSchema, CredentialItem } from '../types';
import { encryptText, decryptText } from '../utils/crypto';

interface SecretsViewProps {
  key?: string;
  t: LocalizationSchema['secrets'];
  credentials: CredentialItem[];
  onAddCredential: (cred: Omit<CredentialItem, 'id'>) => void;
  onDeleteCredential: (id: string) => void;
  masterPasswordKey: string;
  setMasterPasswordKey: (key: string) => void;
}

export default function SecretsView({
  t,
  credentials,
  onAddCredential,
  onDeleteCredential,
  masterPasswordKey,
  setMasterPasswordKey,
}: SecretsViewProps) {
  // Authentication State
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!masterPasswordKey);
  const [authError, setAuthError] = useState('');

  // Reveal IDs map state (which elements have their secrets decrypted on screen)
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Clipboard Copied feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin') {
      setMasterPasswordKey(passwordInput);
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError(t.wrongPassword);
    }
  };

  const handleLock = () => {
    setMasterPasswordKey('');
    setIsAuthenticated(false);
    setPasswordInput('');
    setRevealedIds({});
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(labelId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleQuickLaunch = (cred: CredentialItem) => {
    // 1. Decrypt token and secret key
    const rawToken = decryptText(cred.apiToken, masterPasswordKey);
    const rawSecret = decryptText(cred.secretKey, masterPasswordKey);

    // 2. Format a copyable credential bundle
    const credentialBundle = `Service: ${cred.serviceName}\nAPI Token: ${rawToken}\nSecret Key: ${rawSecret}\nIP/Link: ${cred.ipAddress}`;
    
    // 3. Copy to clipboard
    navigator.clipboard.writeText(credentialBundle);

    // 4. Highlight UI
    setCopiedField(`quick-${cred.id}`);
    setTimeout(() => setCopiedField(null), 2500);

    // 5. Open service URL in new tab if present
    if (cred.serviceUrl) {
      window.open(cred.serviceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !apiToken.trim() || !secretKey.trim()) {
      setFormError(t.isEncryptedWarn);
      return;
    }

    // Encrypt the sensitive fields BEFORE saving!
    const encryptedToken = encryptText(apiToken.trim(), masterPasswordKey);
    const encryptedSecret = encryptText(secretKey.trim(), masterPasswordKey);

    onAddCredential({
      serviceName: serviceName.trim(),
      ipAddress: ipAddress.trim() || '127.0.0.1',
      apiToken: encryptedToken,
      secretKey: encryptedSecret,
      serviceUrl: serviceUrl.trim(),
    });

    // Reset fields
    setServiceName('');
    setIpAddress('');
    setApiToken('');
    setSecretKey('');
    setServiceUrl('');
    setFormError('');
    setIsModalOpen(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        /* Lock Screen Interface */
        <motion.div
          key="lock-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-md mx-auto my-12"
        >
          <div id="lock-screen-panel" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center backdrop-blur-xl shadow-2xl space-y-6">
            {/* Lock pulsing animation */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-zinc-100">{t.authTitle}</h1>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {t.authSubtitle}
              </p>
            </div>

            {authError && (
              <div className="p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-405 rounded-lg font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="text-xs font-bold text-zinc-400 block">{t.passwordLabel}</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-700 focus:border-emerald-500 hover:border-zinc-700 transition text-center font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white transition shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <Unlock className="h-4.5 w-4.5" />
                <span>{t.unlockBtn}</span>
              </button>
            </form>
          </div>
        </motion.div>
      ) : (
        /* Authenticated Credentials Workspace */
        <motion.div
          key="secrets-workspace"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          {/* Header row */}
          <div id="secrets-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-emerald-550" />
                <span>{t.title}</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-2xl">
                {t.subtitle}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleLock}
                className="inline-flex items-center justify-center p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-850 font-semibold text-xs text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <Lock className="h-4.5 w-4.5" />
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-md shadow-emerald-950/40 border border-emerald-500/20 cursor-pointer transition"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>{t.addBtn}</span>
              </button>
            </div>
          </div>

          {/* Local storage warning prompt */}
          <div id="security-notice-panel" className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2.5 text-zinc-300">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">{t.isEncryptedWarn}</h4>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              {t.localStorageWarn}
            </p>
          </div>

          {/* Credentials list */}
          <div id="credentials-card-list" className="space-y-4">
            {credentials.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/10 flex flex-col items-center">
                <Key className="h-12 w-12 text-zinc-800 mb-3 animate-pulse" />
                <h3 className="font-bold text-zinc-400 text-sm">No Secured Credentials</h3>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs leading-relaxed">
                  Start by logging API tokens and secret credentials mapped to your development stacks.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {credentials.map((cred) => {
                  const isRevealed = !!revealedIds[cred.id];
                  const plainToken = isRevealed ? decryptText(cred.apiToken, masterPasswordKey) : '••••••••••••••••••••••••';
                  const plainSecret = isRevealed ? decryptText(cred.secretKey, masterPasswordKey) : '••••••••••••••••••••••••';

                  return (
                    <motion.div
                      layout
                      key={cred.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 backdrop-blur-sm hover:border-zinc-700 transition flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Title pane & deletion trigger */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <h3 className="font-bold text-zinc-100 text-base">{cred.serviceName}</h3>
                            <span className="text-[10px] font-semibold font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-450">
                              {cred.ipAddress}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleReveal(cred.id)}
                              className="p-1.5 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-805 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this credentials record?')) {
                                  onDeleteCredential(cred.id);
                                }
                              }}
                              className="p-1.5 rounded bg-zinc-950 hover:bg-rose-950/40 border border-zinc-805 text-zinc-550 hover:text-red-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Plain token & Secret key forms */}
                        <div className="space-y-3">
                          {/* API Token */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">{t.apiToken}</span>
                            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-805 rounded-lg p-2.5 font-mono text-xs">
                              <span className="truncate w-full text-zinc-300">{plainToken}</span>
                              <button
                                onClick={() => copyToClipboard(decryptText(cred.apiToken, masterPasswordKey), `${cred.id}-token`)}
                                className="text-zinc-500 hover:text-emerald-450 transition cursor-pointer"
                              >
                                {copiedField === `${cred.id}-token` ? (
                                  <span className="text-[10px] text-emerald-500 font-bold">{t.copied}</span>
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Secret Key */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">{t.secretKey}</span>
                            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-805 rounded-lg p-2.5 font-mono text-xs">
                              <span className="truncate w-full text-zinc-300">{plainSecret}</span>
                              <button
                                onClick={() => copyToClipboard(decryptText(cred.secretKey, masterPasswordKey), `${cred.id}-secret`)}
                                className="text-zinc-500 hover:text-emerald-450 transition cursor-pointer"
                              >
                                {copiedField === `${cred.id}-secret` ? (
                                  <span className="text-[10px] text-emerald-500 font-bold">{t.copied}</span>
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Launch workflow block */}
                      <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
                        {/* Preview encrypted bits to exhibit dynamic encryption transparency */}
                        <div className="text-[10px] font-mono text-zinc-650 max-w-[150px] truncate">
                          AES Sandbox Payload: <span className="opacity-60">{cred.apiToken.slice(0, 10)}...</span>
                        </div>

                        <button
                          onClick={() => handleQuickLaunch(cred)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/10 hover:bg-emerald-600 border border-transparent text-emerald-450 hover:text-white font-bold text-xs cursor-pointer transition duration-150"
                        >
                          <span>{copiedField === `quick-${cred.id}` ? t.copied : t.quickLaunch}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add credentials Modal Form */}
          <AnimatePresence>
            {isModalOpen && (
              <div id="secrets-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsModalOpen(false)}
                  className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-300"
                >
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-350"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-3">
                    <Key className="h-6 w-6 text-emerald-500" />
                    <h3 className="text-lg font-bold text-zinc-100">{t.modalTitle}</h3>
                  </div>

                  {formError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-500 text-xs font-semibold">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Service Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">{t.serviceName} *</label>
                      <input
                        type="text"
                        required
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder={t.placeholderService}
                        className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                      />
                    </div>

                    {/* IP Link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">{t.ipAddress}</label>
                      <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder={t.placeholderIp}
                        className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                      />
                    </div>

                    {/* API Token */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">{t.apiToken} *</label>
                      <input
                        type="password"
                        required
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder={t.placeholderToken}
                        className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                      />
                    </div>

                    {/* Secret Key */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">{t.secretKey} *</label>
                      <input
                        type="password"
                        required
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder={t.placeholderSecretKey}
                        className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                      />
                    </div>

                    {/* Service direct sign-in link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">{t.placeholderUrlLabel} (Optional)</label>
                      <input
                        type="text"
                        value={serviceUrl}
                        onChange={(e) => setServiceUrl(e.target.value)}
                        placeholder={t.placeholderUrl}
                        className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                      />
                    </div>

                    {/* Submit buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-850 text-zinc-450 hover:text-white transition text-xs font-bold cursor-pointer"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition text-xs cursor-pointer shadow-emerald-950/40 shadow-md"
                      >
                        {t.saveBtn}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
