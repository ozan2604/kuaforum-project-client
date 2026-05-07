import React, { useState } from 'react';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const TEMPLATES = [
  { name: 'AppointmentCreated',             label: 'Randevu Oluşturuldu',           desc: 'Müşteriye → talep alındı bildirimi' },
  { name: 'AppointmentAutoConfirmed',       label: 'Randevu Otomatik Onaylandı',    desc: 'Müşteriye → otomatik onay (background)' },
  { name: 'AppointmentConfirmed',           label: 'Randevu Onaylandı',             desc: 'Müşteriye → salon/çalışan onayladı' },
  { name: 'AppointmentRejected',            label: 'Randevu Reddedildi',            desc: 'Müşteriye → salon reddetti' },
  { name: 'AppointmentCancelledByShop',     label: 'Randevu İptal (Salon)',         desc: 'Müşteriye → salon iptal etti' },
  { name: 'AppointmentCancelledByCustomer', label: 'Randevu İptal (Müşteri)',       desc: 'Salona → müşteri iptal etti' },
  { name: 'AppointmentCompleted',           label: 'Randevu Tamamlandı',            desc: 'Müşteriye → hizmet bitti, teşekkürler' },
  { name: 'SalonApplicationApproved',       label: 'Salon Başvurusu Onaylandı',     desc: 'Başvuru sahibine → tebrik' },
  { name: 'SalonApplicationRejected',       label: 'Salon Başvurusu Reddedildi',    desc: 'Başvuru sahibine → red bildirimi' },
  { name: 'EmployeeAdded',                  label: 'Çalışan Eklendi (Yeni)',        desc: 'Yeni çalışana → geçici şifresiyle' },
  { name: 'EmployeeAddedExisting',          label: 'Çalışan Eklendi (Mevcut)',      desc: 'Var olan kullanıcıya → eklendi bildirimi' },
  { name: 'EmployeeRemoved',                label: 'Çalışan Silindi',               desc: 'Çalışana → kaydı sonlandırıldı' },
  { name: 'EmployeeRestored',               label: 'Çalışan Geri Yüklendi',         desc: 'Çalışana → yeniden aktif edildi' },
  { name: 'PasswordChanged',               label: 'Şifre Değiştirildi',             desc: 'Kullanıcıya → güvenlik bildirimi' },
] as const;

type TemplateStatus = 'idle' | 'loading' | 'success' | 'error';

export const SmsTestPage: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<string, TemplateStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const sendTest = async (templateName: string) => {
    setStatuses(s => ({ ...s, [templateName]: 'loading' }));
    setMessages(m => ({ ...m, [templateName]: '' }));

    try {
      const res = await api.post(`/sms-test/send/${templateName}`);
      setStatuses(s => ({ ...s, [templateName]: 'success' }));
      setMessages(m => ({ ...m, [templateName]: res.data?.message ?? 'Gönderildi' }));
    } catch (err: any) {
      setStatuses(s => ({ ...s, [templateName]: 'error' }));
      const errMsg = err?.response?.data?.error ?? err?.message ?? 'Bilinmeyen hata';
      setMessages(m => ({ ...m, [templateName]: errMsg }));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS Test Paneli</h1>
        <p className="text-sm text-gray-500 mt-1">
          Her şablonu tek tık ile test numarasına gönderir.
          <code className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs">appsettings.json → NetGsm.TestPhoneOverride</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map(({ name, label, desc }) => {
          const status = statuses[name] ?? 'idle';
          const msg = messages[name] ?? '';

          return (
            <div key={name} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                <code className="text-xs text-indigo-500">{name}</code>
              </div>

              {msg && (
                <p className={`text-xs rounded px-2 py-1.5 break-all ${
                  status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {msg}
                </p>
              )}

              <button
                onClick={() => sendTest(name)}
                disabled={status === 'loading'}
                className="mt-auto flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-4 h-4" />}
                {status === 'error'   && <XCircle className="w-4 h-4" />}
                {status === 'idle'    && <Send className="w-4 h-4" />}
                {status === 'loading' ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
