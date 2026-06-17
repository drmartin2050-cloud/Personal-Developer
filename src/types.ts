export type ActiveTab = 'dashboard' | 'resources' | 'projects' | 'secrets' | 'emails' | 'automation' | 'calculator' | 'optimizer' | 'expenses' | 'ai_agent' | 'prompt_translator' | 'diagnostics';

export type Language = 'ar' | 'en';

export interface Project {
  id: string;
  projectName: string;
  platformUsed: string;
  associatedEmail: string;
  projectUrl: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'social' | 'ai';
  url: string;
  isUserAdded?: boolean;
}

export interface CredentialItem {
  id: string;
  serviceName: string;
  ipAddress: string;
  apiToken: string; // Stored encrypted
  secretKey: string; // Stored encrypted
  serviceUrl?: string; // Optional URL for quick launching
}

export interface N8NWebhook {
  id: string;
  name: string;
  webhookUrl: string;
}

export interface LocalizationSchema {
  dir: 'rtl' | 'ltr';
  nav: {
    dashboard: string;
    resources: string;
    projects: string;
    secrets: string;
    emails: string;
    automation: string;
    calculator: string;
    optimizer: string;
    expenses: string;
    ai_agent: string;
    prompt_translator: string;
    diagnostics: string;
  };
  dashboard: {
    welcome: string;
    description: string;
    totalProjects: string;
    savedResources: string;
    secureSecrets: string;
    quickStats: string;
    quickActions: string;
    addNewProjectShort: string;
    manageCredentialsShort: string;
    viewResourcesShort: string;
    recentProjects: string;
    noRecentProjects: string;
    platformBrief: string;
  };
  resources: {
    title: string;
    subtitle: string;
    categories: {
      all: string;
      databases: string;
      social: string;
      ai: string;
    };
    openLink: string;
    addBtn: string;
    modalTitle: string;
    resourceName: string;
    resourceDesc: string;
    resourceUrl: string;
    resourceCategory: string;
    cancelBtn: string;
    saveBtn: string;
  };
  projects: {
    title: string;
    subtitle: string;
    tableName: string;
    tablePlatform: string;
    tableEmail: string;
    tableUrl: string;
    tableActions: string;
    addBtn: string;
    modalTitle: string;
    placeholderName: string;
    placeholderPlatform: string;
    placeholderEmail: string;
    placeholderUrl: string;
    cancelBtn: string;
    saveBtn: string;
    deleteConfirm: string;
    validationError: string;
    noProjectsYet: string;
  };
  secrets: {
    title: string;
    subtitle: string;
    authTitle: string;
    authSubtitle: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    unlockBtn: string;
    wrongPassword: string;
    serviceName: string;
    ipAddress: string;
    apiToken: string;
    secretKey: string;
    actions: string;
    copied: string;
    copyBtn: string;
    quickLaunch: string;
    addBtn: string;
    modalTitle: string;
    placeholderService: string;
    placeholderIp: string;
    placeholderToken: string;
    placeholderSecretKey: string;
    placeholderUrl: string;
    placeholderUrlLabel: string;
    saveBtn: string;
    cancelBtn: string;
    isEncryptedWarn: string;
    localStorageWarn: string;
    deleteBtn: string;
  };
  automation: {
    title: string;
    subtitle: string;
    selectWebhook: string;
    payloadLabel: string;
    triggerBtn: string;
    responseLogs: string;
    addBtn: string;
    modalTitle: string;
    webhookName: string;
    webhookUrl: string;
    namePlaceholder: string;
    urlPlaceholder: string;
    cancelBtn: string;
    saveBtn: string;
    noWebhooks: string;
    placeholderPayload: string;
    triggering: string;
    triggerSuccess: string;
    triggerError: string;
  };
  calculator: {
    title: string;
    subtitle: string;
    inputLabel: string;
    modelLabel: string;
    resultsTitle: string;
    inputTokens: string;
    outputTokens: string;
    totalTokens: string;
    costUsd: string;
    costEgp: string;
    costEur: string;
    costCny: string;
    baselineLabel: string;
    savingsLabel: string;
    savingHighlight: string;
    placeholder: string;
    calculating: string;
    errExchange: string;
  };
  optimizer: {
    title: string;
    subtitle: string;
    arabPromptLabel: string;
    buttonPrompt: string;
    optimizedResultLabel: string;
    compareTitle: string;
    cardArabic: string;
    cardEnglish: string;
    tokenCount: string;
    costEstimated: string;
    savingsSectionTitle: string;
    copyBtn: string;
    sendN8nBtn: string;
    historyTitle: string;
    promptNoHistory: string;
  };
  emails: {
    title: string;
    subtitle: string;
    addMainEmailBtn: string;
    addAliasBtn: string;
    mainEmailLabel: string;
    aliasLabel: string;
    platformLabel: string;
    copySuccess: string;
    copiedLabel: string;
    copyBtn: string;
    noEmailsYet: string;
    modalTitleMain: string;
    modalTitleAlias: string;
    placeholderMainEmail: string;
    placeholderAliasEmail: string;
    placeholderPlatform: string;
    saveBtn: string;
    cancelBtn: string;
    deleteBtn: string;
  };
  aiHelper: {
    floatingBtn: string;
    modalTitle: string;
    placeholder: string;
    sendBtn: string;
    clearBtn: string;
    failoverStatus: string;
    tryKey: string;
    connectedWith: string;
    responseLabel: string;
    noMessages: string;
    roleUser: string;
    roleAi: string;
  };
}

export interface AdvancedErrorInfo {
  id: string;
  message: string;
  statusCode?: number;
  timestamp: string;
  provider: string;
  maskedKey: string;
  payload?: any;
  responseBody?: string;
  severity: 'critical' | 'warning' | 'info';
  userApproved?: boolean;
}

export interface RepairLog {
  id: string;
  timestamp: string;
  issue: string;
  actionTaken: string;
  status: 'repaired' | 'manual_required' | 'skipped' | 'failed';
  approved?: boolean;
}

export interface AppEnvironment {
  type: 'localhost' | 'huggingface' | 'github_pages' | 'unknown';
  isDevelopment: boolean;
  proxyActive: boolean;
  allowedOrigins: string[];
}
