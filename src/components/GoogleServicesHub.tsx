import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, Server, ShieldCheck, Mail, Calendar, Database, HardDrive, RefreshCw, AlertCircle, Info, ChevronRight, Check, Play, LogOut, Send, Plus, ExternalLink, FileText, BarChart
} from 'lucide-react';
import { auth, googleSignIn, logoutFirebase, getCachedAccessToken } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  fetchGoogleDriveFiles,
  createGoogleDriveFolder,
  createGoogleSpreadsheet,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  fetchGmailMessages,
  createGoogleDoc,
  createGoogleForm
} from '../utils/googleApi';

interface GoogleServicesHubProps {
  lang: 'ar' | 'en';
}

const HUB_TRANSLATIONS = {
  ar: {
    title: 'مجمع خدمات Google Workspace المتكامل',
    subtitle: 'مزامنة حقيقية وإدارة آمنة عن طريق OAuth لكل الملفات السحابية والملفات وجداول البيانات وقوائم التقويم والبريد.',
    notLoggedIn: 'الرجاء تسجيل الدخول لتفعيل خدمات Google السحابية للوصول الحقيقي.',
    loginGsiBtn: 'ربط الحساب وتسجيل الدخول عبر Google',
    logoutBtn: 'فصل الاتصال',
    driveTab: 'Google Drive',
    sheetsTab: 'Google Sheets & Docs',
    calendarTab: 'التقويم والأجندة',
    gmailTab: 'صندوق البريد الإلكتروني',
    activeToken: 'رمز التوثيق نشط وساري',
    refreshing: 'جاري جلب البيانات...',
    noData: 'لا يوجد سجلات حالياً. انقر على البيانات بالأسفل لإنشاء ملفات أو أحداث جديدة بشكل حي!',
    createFolderBtn: 'إنشاء مجلد رئيسي جديد',
    createSheetBtn: 'إنشاء جدول بيانات ذكي',
    addEventBtn: 'جدولة حدث جديد في التقويم',
    createDocBtn: 'إنشاء مستند Docs فارغ',
    createFormBtn: 'إنشاء نموذج Forms للمطورين',
    subject: 'الموضوع',
    from: 'المرسل',
    date: 'التاريخ',
    statusActive: 'متصل ومصرح له',
    successMsg: 'تمت العملية بنجاح وتحديث البيانات في Google Cloud!'
  },
  en: {
    title: 'Google Workspace Connected Cloud Hub',
    subtitle: 'Unified credentials status, live OAuth syncing, and access management across your Google drive, calendar, sheets, and inbox.',
    notLoggedIn: 'Authorize Google OAuth Session to allow this portal to communicate with Google Cloud.',
    loginGsiBtn: 'Sign in with Google Account',
    logoutBtn: 'Disconnect Session',
    driveTab: 'Google Drive',
    sheetsTab: 'Sheets, Docs & Forms',
    calendarTab: 'Calendar & Schedules',
    gmailTab: 'Gmail Inbox',
    activeToken: 'OAuth Access Token is active',
    refreshing: 'Retrieving secure metadata...',
    noData: 'No records loaded. Use actions below to create active documents, sheets, forms or events directly in Google Workspace!',
    createFolderBtn: 'Create Project Folder',
    createSheetBtn: 'Create Spreadsheet',
    addEventBtn: 'Schedule Calendar Event',
    createDocBtn: 'Create Google Doc',
    createFormBtn: 'Create Google Form',
    subject: 'Subject',
    from: 'From',
    date: 'Date',
    statusActive: 'Active & Connected',
    successMsg: 'Operation completed and propagated to Google Workspace!'
  }
};

export default function GoogleServicesHub({ lang }: GoogleServicesHubProps) {
  const t = HUB_TRANSLATIONS[lang];
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'drive' | 'sheets' | 'calendar' | 'gmail'>('drive');
  const [loading, setLoading] = useState<boolean>(false);
  const [toastText, setToastText] = useState<string | null>(null);

  // Live retrieved state lists
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [gmailMsgs, setGmailMsgs] = useState<any[]>([]);

  // Inputs for creating active resources
  const [folderName, setFolderName] = useState<string>('Personal Developer Folder');
  const [sheetTitle, setSheetTitle] = useState<string>('Developer Tech Budget');
  const [docTitle, setDocTitle] = useState<string>('Sentry Technical Readme');
  const [formTitle, setFormTitle] = useState<string>('Client Feedback Survey');
  const [eventSummary, setEventSummary] = useState<string>('🤖 Sentry Core Auto-Validation Run');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      const cached = getCachedAccessToken();
      if (usr && cached) {
        setToken(cached);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (token) {
      loadWorkspaceData();
    }
  }, [token, activeSubTab]);

  const loadWorkspaceData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeSubTab === 'drive') {
        const files = await fetchGoogleDriveFiles(token);
        setDriveFiles(files);
      } else if (activeSubTab === 'calendar') {
        const evs = await fetchGoogleCalendarEvents(token);
        setCalendarEvents(evs);
      } else if (activeSubTab === 'gmail') {
        const msgs = await fetchGmailMessages(token);
        setGmailMsgs(msgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (txt: string) => {
    setToastText(txt);
    setTimeout(() => setToastText(null), 4000);
  };

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(t.successMsg);
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setCalendarEvents([]);
    setGmailMsgs([]);
  };

  // Mutator operations checking destructive/mutating instructions: "always include an explicit user confirmation dialog before the operation executes"
  const handleCreateFolder = async () => {
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to create a folder named "${folderName}" inside your Google Drive?`);
    if (!confirm) return;

    setLoading(true);
    try {
      await createGoogleDriveFolder(token, folderName);
      showToast(t.successMsg);
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to create a Google Spreadsheet named "${sheetTitle}"?`);
    if (!confirm) return;

    setLoading(true);
    try {
      await createGoogleSpreadsheet(token, sheetTitle);
      showToast(t.successMsg);
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async () => {
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to create a Google Document titled "${docTitle}"?`);
    if (!confirm) return;

    setLoading(true);
    try {
      await createGoogleDoc(token, docTitle);
      showToast(t.successMsg);
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to create a new Google Form titled "${formTitle}"?`);
    if (!confirm) return;

    setLoading(true);
    try {
      await createGoogleForm(token, formTitle);
      showToast(t.successMsg);
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to schedule the calendar event: "${eventSummary}"?`);
    if (!confirm) return;

    setLoading(true);
    try {
      const now = new Date();
      const end = new Date();
      end.setHours(now.getHours() + 1);

      await createGoogleCalendarEvent(token, {
        summary: eventSummary,
        description: 'Auto-scheduled from personal developer sendbox portal via Google Sentry.',
        startTime: now.toISOString(),
        endTime: end.toISOString()
      });
      showToast(t.successMsg);
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="workspace-cloud-hub-container" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3d-flat space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-indigo-600 border border-indigo-700 text-white rounded-2xl shadow-3d-deep flex items-center gap-2 text-xs font-black"
          >
            <ShieldCheck className="h-5 w-5 text-emerald-300 animate-pulse" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600 animate-pulse" />
            <span>{t.title}</span>
          </h3>
          <p className="text-[11px] text-slate-450 leading-relaxed font-bold max-w-2xl">{t.subtitle}</p>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-800 block">{user.displayName || user.email}</span>
              <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1">
                <Check className="h-3 w-3" /> {t.statusActive}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-50 border border-rose-150 rounded-xl hover:bg-rose-100 hover:text-rose-700 text-rose-600 transition cursor-pointer"
              title={t.logoutBtn}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs cursor-pointer flex items-center gap-2 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t.loginGsiBtn}</span>
          </button>
        )}
      </div>

      {!user ? (
        <div className="p-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <Info className="h-8 w-8 text-indigo-500 animate-bounce" />
          <div className="space-y-1 max-w-md">
            <h4 className="font-extrabold text-sm text-slate-800">{t.notLoggedIn}</h4>
            <p className="text-[10px] text-slate-450 leading-relaxed font-bold">
              {lang === 'ar' 
                ? 'يتيح لك الاتصال الحقيقي بـ Google Workspace فحص الملفات وجداول البيانات وجدولة المواعيد مع الاحتماء بنظام الحماية.'
                : 'Secure integration authenticates safely using custom scopes. None of your persistent credentials will end up stored raw.'}
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="px-5 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-xs font-black select-none cursor-pointer flex items-center gap-2 transition"
          >
            <Globe className="h-4 w-4" />
            <span>{t.loginGsiBtn}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sub Navigation */}
          <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('drive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'drive' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              📂 {t.driveTab}
            </button>
            <button
              onClick={() => setActiveSubTab('sheets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'sheets' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              📊 {t.sheetsTab}
            </button>
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              📅 {t.calendarTab}
            </button>
            <button
              onClick={() => setActiveSubTab('gmail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'gmail' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              ✉️ {t.gmailTab}
            </button>
          </div>

          {/* Loader or Content */}
          {loading ? (
            <div className="py-12 flex justify-center items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
              <span className="text-[11px] font-bold text-slate-500">{t.refreshing}</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Tab: Drive Folder Creator */}
              {activeSubTab === 'drive' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 w-full md:w-auto">
                      <span className="text-xs font-extrabold text-slate-700 block">{t.createFolderBtn}</span>
                      <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        className="px-3 py-1.5 w-full md:w-64 max-w-full text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateFolder}
                      className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-3xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t.createFolderBtn}</span>
                    </button>
                  </div>

                  {driveFiles.length === 0 ? (
                    <p className="text-[11px] text-slate-450 font-bold py-6 text-center">{t.noData}</p>
                  ) : (
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      <div className="bg-slate-50 px-4 py-2 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tight">
                        <span>{lang === 'ar' ? 'اسم الملف' : 'File Name'}</span>
                        <span>{lang === 'ar' ? 'النوع / الصيغة' : 'Type'}</span>
                      </div>
                      {driveFiles.map((file) => (
                        <div key={file.id} className="px-4 py-2.5 flex justify-between items-center bg-white hover:bg-slate-50 transition text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-2">
                            <span className="p-1 bg-indigo-50 text-indigo-600 rounded">📄</span>
                            <span className="truncate max-w-sm">{file.name}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold truncate max-w-xs">{file.mimeType.replace('application/vnd.google-apps.', '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Sheets, Docs & Forms creator widgets */}
              {activeSubTab === 'sheets' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sheets creation item */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <BarChart className="h-4 w-4 text-emerald-600" />
                        <span>Google Sheets</span>
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">أنشئ ومزامنة جداول مالية وتخطيطات مباشرة وحيَّة.</p>
                      <input
                        type="text"
                        value={sheetTitle}
                        onChange={(e) => setSheetTitle(e.target.value)}
                        className="px-3 py-1.5 w-full text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateSheet}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl shadow-3xs cursor-pointer select-none transition flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t.createSheetBtn}</span>
                    </button>
                  </div>

                  {/* Docs creation item */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>Google Docs</span>
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">إنشاء مسودات المستندات التقنية والشروح بفقرات منسقة.</p>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="px-3 py-1.5 w-full text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateDoc}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold rounded-xl shadow-3xs cursor-pointer select-none transition flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t.createDocBtn}</span>
                    </button>
                  </div>

                  {/* Forms creation item */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-purple-600" />
                        <span>Google Forms</span>
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">جمع الآراء، والتقييمات، ومتابعة استطلاعات المستخدم للأنظمة.</p>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="px-3 py-1.5 w-full text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateForm}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold rounded-xl shadow-3xs cursor-pointer select-none transition flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t.createFormBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Calendar scheduler */}
              {activeSubTab === 'calendar' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Creation form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-850 block">{t.addEventBtn}</span>
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">جدولة حدث فوري يستمر لمدة ساعة بالتوقيت العالمي UTC.</p>
                      <input
                        type="text"
                        value={eventSummary}
                        onChange={(e) => setEventSummary(e.target.value)}
                        className="px-3 py-1.5 w-full text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateEvent}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-3xs cursor-pointer select-none transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>{t.addEventBtn}</span>
                    </button>
                  </div>

                  {/* Listings events */}
                  <div className="space-y-2">
                    {calendarEvents.length === 0 ? (
                      <p className="text-[11px] text-slate-450 font-bold text-center py-12">{t.noData}</p>
                    ) : (
                      <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                        <div className="bg-slate-50 px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                          <span>{lang === 'ar' ? 'قائمة الأحداث القادمة' : 'Upcoming Scheduled Events'}</span>
                        </div>
                        {calendarEvents.map((evt) => (
                          <div key={evt.id} className="px-4 py-2.5 bg-white text-xs font-bold space-y-1 text-slate-700">
                            <span className="block font-extrabold text-indigo-600">{evt.summary}</span>
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>📅 {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleDateString() : 'All Day'}</span>
                              <span>⌚ {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleTimeString() : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Gmail mail reader */}
              {activeSubTab === 'gmail' && (
                <div className="space-y-4">
                  {gmailMsgs.length === 0 ? (
                    <p className="text-[11px] text-slate-450 font-bold py-12 text-center">{t.noData}</p>
                  ) : (
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100">
                      <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                        <span className="col-span-3">{t.from}</span>
                        <span className="col-span-6">{t.subject}</span>
                        <span className="col-span-3 text-left">{t.date}</span>
                      </div>
                      {gmailMsgs.map((msg) => (
                        <div key={msg.id} className="px-4 py-3 grid grid-cols-12 items-center bg-white hover:bg-slate-50 transition text-xs font-bold text-slate-700">
                          <span className="col-span-3 text-indigo-600 truncate pr-2" title={msg.from}>{msg.from.replace(/<.*>/, '')}</span>
                          <div className="col-span-6 flex flex-col pr-2">
                            <span className="font-extrabold text-slate-800 truncate" title={msg.subject}>{msg.subject}</span>
                            <span className="text-[10px] text-slate-400 font-normal truncate mt-0.5" title={msg.snippet}>{msg.snippet}</span>
                          </div>
                          <span className="col-span-3 text-[10px] text-slate-400 text-left font-mono truncate">{msg.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
