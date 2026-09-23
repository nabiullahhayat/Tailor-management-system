import { useEffect, useState } from 'react';
import PageShell from '../components/desktop/PageShell.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { settingsService } from '../services/index.js';
import { notify } from '../utils/toast.js';

export default function SettingsPage() {
  const { appName, language, saveSettings } = useSettings();
  const [form, setForm] = useState({
    appName: '',
    shopName: '',
    shopPhone: '',
    shopAddress: '',
    language: 'pashto',
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
      });
    });
  }, [appName, language]);

  const handleSave = async () => {
    await saveSettings(form);
    notify.success('Settings saved', 'Your shop preferences have been updated');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <PageShell
      title="Settings"
      subtitle="Configure shop profile, language, and app preferences"
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Settings' }]}
    >
      <div className="mx-auto max-w-3xl space-y-6">
          {saved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-success">
              Settings saved successfully.
            </div>
          )}

          <section className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Shop Profile</h3>
            <Input label="App Name" value={form.appName} onChange={(e) => setForm((p) => ({ ...p, appName: e.target.value }))} />
            <Input label="Shop Name" value={form.shopName} onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))} />
            <Input label="Shop Phone" value={form.shopPhone} onChange={(e) => setForm((p) => ({ ...p, shopPhone: e.target.value }))} />
            <Input label="Shop Address" value={form.shopAddress} onChange={(e) => setForm((p) => ({ ...p, shopAddress: e.target.value }))} />
          </section>

          <section className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Language</h3>
            <div className="space-y-3">
              {[
                { value: 'pashto', label: 'Pashto', sub: 'پښتو' },
                { value: 'dari', label: 'Dari', sub: 'دری' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, language: lang.value }))}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left ${
                    form.language === lang.value ? 'border-navy bg-primary-soft' : 'border-black/10 bg-background'
                  }`}
                >
                  <div>
                    <p className="font-bold text-ink">{lang.label}</p>
                    <p className="text-sm text-ink-muted">{lang.sub}</p>
                  </div>
                  {form.language === lang.value && <span className="text-sm font-bold text-navy">Selected</span>}
                </button>
              ))}
            </div>
          </section>

          <Button onClick={handleSave}>Save Settings</Button>
        </div>
    </PageShell>
  );
}
