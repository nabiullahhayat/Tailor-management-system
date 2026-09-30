import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import AppIconMark from '../components/ui/AppIconMark.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../services/index.js';
import { fallbackLetterFromAppName } from '../utils/appIcon.js';
import { APP_LANGUAGES } from '../i18n/languages.js';
import { notify } from '../utils/toast.js';

const ACCEPT_ICON = 'image/png,image/jpeg,image/webp,image/gif';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { appName, language, appIconUrl, saveSettings, uploadAppIcon, removeAppIcon } = useSettings();
  const { logout, refreshCredentials } = useAuth();
  const navigate = useNavigate();
  const [iconUploading, setIconUploading] = useState(false);
  const [form, setForm] = useState({
    appName: '',
    shopName: '',
    shopPhone: '',
    shopAddress: '',
    language: 'pashto',
    adminEmail: '',
    adminPassword: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsService.get().then((settings) => {
      setForm({
        appName: settings.appName || appName,
        shopName: settings.shopName || '',
        shopPhone: settings.shopPhone || '',
        shopAddress: settings.shopAddress || '',
        language: settings.language || language,
        adminEmail: settings.adminEmail || '',
        adminPassword: settings.adminPassword || '',
      });
    });
  }, [appName, language]);

  const handleSave = async () => {
    const payload = { ...form };
    if (!payload.adminPassword?.trim()) {
      delete payload.adminPassword;
    }
    await saveSettings(payload);
    await refreshCredentials();
    notify.success(t('settings.savedToast'), t('settings.savedToastDesc'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleIconPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify.warning(t('toasts.invalidFile'), t('toasts.invalidFileDesc'));
      return;
    }
    setIconUploading(true);
    try {
      await uploadAppIcon(file);
      notify.success(t('toasts.appIconUpdated'), t('toasts.appIconUpdatedDesc'));
    } catch (err) {
      notify.error(t('toasts.uploadFailed'), err.message || t('toasts.couldNotSaveIcon'));
    } finally {
      setIconUploading(false);
    }
  };

  const handleRemoveIcon = async () => {
    setIconUploading(true);
    try {
      await removeAppIcon();
      notify.success(t('toasts.appIconRemoved'), t('toasts.appIconRemovedDesc'));
    } catch (err) {
      notify.error(t('toasts.couldNotRemoveIcon'), err.message);
    } finally {
      setIconUploading(false);
    }
  };

  return (
    <PageShell
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('settings.title') }]}
      actions={
        <Button type="button" onClick={handleSave}>
          {t('common.saveSettings')}
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {saved && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-success dark:border-emerald-800/50 dark:bg-emerald-950/35">
            {t('settings.saved')}
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={t('settings.shopProfile')} subtitle={t('settings.shopProfileHint')} />
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                <Input
                  label={t('settings.appName')}
                  value={form.appName}
                  onChange={(e) => setForm((p) => ({ ...p, appName: e.target.value }))}
                  className="mb-3"
                />
                <Input
                  label={t('settings.shopName')}
                  value={form.shopName}
                  onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))}
                  className="mb-3"
                />
                <Input
                  label={t('settings.shopPhone')}
                  value={form.shopPhone}
                  onChange={(e) => setForm((p) => ({ ...p, shopPhone: e.target.value }))}
                  className="mb-3"
                />
                <Input
                  label={t('settings.shopAddress')}
                  value={form.shopAddress}
                  onChange={(e) => setForm((p) => ({ ...p, shopAddress: e.target.value }))}
                  className="mb-3"
                />
              </div>

              <div className="mt-2 border-t border-primary-soft/60 pt-5">
                <SectionTitle title={t('settings.loginCredentials')} subtitle={t('settings.loginCredentialsHint')} />
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Input
                    label={t('settings.adminEmail')}
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
                    className="mb-3"
                  />
                  <PasswordInput
                    label={t('settings.adminPassword')}
                    value={form.adminPassword}
                    onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
                    className="mb-3"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  {t('auth.signOut')}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-5">
            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={t('settings.appIcon')} subtitle={t('settings.appIconHint')} />
              <div className="flex items-center gap-4">
                <AppIconMark
                  appIconUrl={appIconUrl}
                  fallbackLetter={fallbackLetterFromAppName(form.appName || appName)}
                  className="h-12 w-12"
                  letterClassName="text-lg font-extrabold text-white"
                />
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-accent px-3.5 py-2 text-sm font-bold text-white transition hover:bg-accent/90">
                    {iconUploading ? t('settings.saving') : t('settings.uploadImage')}
                    <input
                      type="file"
                      accept={ACCEPT_ICON}
                      className="hidden"
                      disabled={iconUploading}
                      onChange={handleIconPick}
                    />
                  </label>
                  {appIconUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={iconUploading}
                      onClick={handleRemoveIcon}
                    >
                      {t('settings.remove')}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={t('settings.backup')} subtitle={t('settings.backupHint')} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline">
                  {t('settings.backupBtn')}
                </Button>
                <Button type="button" variant="outline">
                  {t('settings.uploadBackup')}
                </Button>
              </div>
            </div>

            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={t('settings.language')} />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(APP_LANGUAGES).map(([value, lang]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, language: value }));
                      saveSettings({ language: value });
                    }}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                      form.language === value
                        ? 'border-accent bg-primary-soft ring-1 ring-accent/20'
                        : 'border-black/10 bg-background hover:border-black/20 dark:border-white/25 dark:bg-surface dark:hover:border-white/40'
                    }`}
                  >
                    <p className="text-sm font-bold text-ink">{lang.native}</p>
                    <p className="text-xs text-ink-muted">{lang.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
