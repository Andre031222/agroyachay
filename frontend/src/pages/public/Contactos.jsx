import React, { useRef, useEffect, useState } from 'react';
import { notify } from '../../utils/swal';
import { WaveCanvas } from './Landing';
import { useLanguage } from '../../context/LanguageContext';

const Fade = ({ children, delay = 0, fromRight = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = fromRight ? 'translateX(40px)' : 'translateX(-40px)';
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'none'; obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, fromRight]);
  return <div ref={ref}>{children}</div>;
};

const Ic = {
  arrow:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  mail:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  chat:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  clock:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  form:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
};

const field =
  'w-full h-11 px-3.5 rounded-xl text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

const CHANNEL_ICONS = [Ic.form, Ic.mail, Ic.chat];
const CHANNEL_RINGS = [
  'ring-emerald-500/15 group-hover:ring-emerald-500/40',
  'ring-black/5 dark:ring-white/10 group-hover:ring-emerald-500/30',
  'ring-black/5 dark:ring-white/10 group-hover:ring-emerald-500/30',
];
const CHANNEL_CHIPS = [
  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/15',
  'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-blue-500/15',
  'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-violet-500/15',
];

const TIER_ICONS = [Ic.mail, Ic.chat, Ic.shield];
const TIER_CHIPS = [
  'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 ring-black/5 dark:ring-white/10',
  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/15',
  'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-violet-500/15',
];

const Contactos = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const { t, tList } = useLanguage();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      notify.warning(t('contact.requiredFields'));
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      notify.success(t('contact.sent'));
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 800);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-gray-50 to-teal-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute -top-32 right-[-8rem] w-[30rem] h-[30rem] rounded-full bg-teal-400/10 dark:bg-teal-400/10 blur-[140px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-slide-up">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.04] tracking-tight">
                {t('contact.heroTitleLine1')}<br />
                <span className="text-emerald-500 dark:text-emerald-400">{t('contact.heroTitleLine2')}</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-gray-500 dark:text-gray-400 max-w-lg">
                {t('contact.heroDescription')}
              </p>

              <div className="mt-10 space-y-3">
                {tList('contact.channels').map((m, i) => (
                  <div
                    key={i}
                    className={`group flex items-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] ring-1 ${CHANNEL_RINGS[i]} transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 cursor-default`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1 ${CHANNEL_CHIPS[i]} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                      {CHANNEL_ICONS[i]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">{m.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate && onNavigate('planes')}
                className="group mt-10 inline-flex items-center gap-2 h-12 pl-6 pr-2 rounded-full ring-1 ring-black/8 dark:ring-white/12 text-sm font-medium text-gray-700 dark:text-gray-100 bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                {t('contact.viewSupportPlans')}
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  {Ic.arrow}
                </span>
              </button>
            </div>
            <Fade fromRight>
              <div className="relative rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.3)]">
                <div className="relative overflow-hidden rounded-[calc(1rem-0.375rem)] bg-[#04140d] px-7 py-8 text-white">
                  <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-emerald-500/25 blur-[110px]" />
                  <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-teal-400/15 blur-[120px]" />

                  <div className="relative">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-white">{t('contact.formTitle')}</h2>
                    <p className="mt-1.5 text-sm text-emerald-100/60">{t('contact.formSubtitle')}</p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="ct-name" className="block text-xs font-medium text-emerald-100/70 mb-1.5">{t('contact.name')}</label>
                          <input
                            id="ct-name"
                            type="text" name="name" value={formData.name} onChange={handleChange}
                            placeholder={t('contact.namePlaceholder')} required
                            className={field}
                          />
                        </div>
                        <div>
                          <label htmlFor="ct-phone" className="block text-xs font-medium text-emerald-100/70 mb-1.5">{t('contact.phone')}</label>
                          <input
                            id="ct-phone"
                            type="tel" name="phone" value={formData.phone} onChange={handleChange}
                            placeholder={t('contact.phonePlaceholder')}
                            className={field}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="ct-email" className="block text-xs font-medium text-emerald-100/70 mb-1.5">{t('contact.email')}</label>
                        <input
                          id="ct-email"
                          type="email" name="email" value={formData.email} onChange={handleChange}
                          placeholder={t('contact.emailPlaceholder')} required
                          className={field}
                        />
                      </div>
                      <div>
                        <label htmlFor="ct-subject" className="block text-xs font-medium text-emerald-100/70 mb-1.5">{t('contact.subject')}</label>
                        <select
                          id="ct-subject"
                          name="subject" value={formData.subject} onChange={handleChange}
                          className={field + ' text-gray-900 dark:text-white'}
                        >
                          <option value="">{t('contact.selectSubject')}</option>
                          {tList('contact.subjects').map(option => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="ct-message" className="block text-xs font-medium text-emerald-100/70 mb-1.5">{t('contact.message')}</label>
                        <textarea
                          id="ct-message"
                          name="message" value={formData.message} onChange={handleChange}
                          rows="4" placeholder={t('contact.messagePlaceholder')} required
                          className={field + ' h-auto py-3 resize-none'}
                        />
                      </div>
                      <button
                        type="submit" disabled={sending}
                        className="group relative w-full h-12 mt-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-60 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] flex items-center justify-center gap-2"
                      >
                        {sending ? t('contact.sending') : (
                          <>
                            <span>{t('contact.send')}</span>
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[calc(50%+1px)] group-hover:scale-105">
                              {Ic.arrow}
                            </span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-emerald-100/40 text-center">
                        {t('contact.responseNote')}
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('contact.supportTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl">
                {t('contact.supportDescription')}
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-3 gap-5">
            {tList('contact.supportTiers').map(({ plan, items }, i) => {
              const highlight = i === 1;
              return (
              <Fade key={plan} delay={i * 80} fromRight={i === 2}>
                <div className={`group h-full rounded-2xl p-1.5 ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${highlight ? 'bg-white/70 dark:bg-white/[0.04] ring-emerald-500/30 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.3)]' : 'bg-white/60 dark:bg-white/[0.03] ring-black/5 dark:ring-white/10'}`}>
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-11 h-11 rounded-xl ring-1 ${TIER_CHIPS[i]} flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                        {TIER_ICONS[i]}
                      </div>
                      <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white">{t('contact.planPrefix')} {plan}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2.5">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                            {Ic.check}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Fade>
              );
            })}
          </div>
        </div>
      </section>

      <WaveCanvas flip />
      <section className="py-20 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('contact.availabilityTitle')}
              </h2>
            </div>
          </Fade>

          <div className="grid lg:grid-cols-2 gap-6">
            <Fade>
              <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                      {Ic.clock}
                    </div>
                    <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white">{t('contact.generalSupport')}</h3>
                  </div>
                  <div className="space-y-3">
                    {tList('contact.schedule').map((item, i, arr) => (
                      <div key={i} className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{item.day}</span>
                        <span className={`text-sm font-medium ${i < arr.length - 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Fade>

            <Fade fromRight>
              <div className="group h-full rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-emerald-500/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.3)]">
                <div className="relative h-full overflow-hidden rounded-[calc(1rem-0.375rem)] bg-[#04140d] p-6 text-white">
                  <div aria-hidden className="pointer-events-none absolute -top-24 -right-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-[110px]" />
                  <div className="relative">
                    <p className="font-display text-2xl font-semibold tracking-tight text-white mb-2">{t('contact.noSchedule')}</p>
                    <p className="text-emerald-100/60 text-sm mb-7 leading-relaxed">
                      {t('contact.noScheduleDescription')}
                    </p>
                    <ul className="space-y-3">
                      {tList('contact.priorityItems').map((item, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-emerald-50/90">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/25 text-emerald-300 flex items-center justify-center">
                            {Ic.check}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('contact.faqTitle')}
              </h2>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 gap-4">
            {tList('contact.faqs').map((faq, i) => (
              <Fade key={i} delay={i * 60} fromRight={i % 2 === 1}>
                <div className="group rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:ring-emerald-500/30">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25 text-emerald-600 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug tracking-tight">{faq.q}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pl-11">{faq.a}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-[140px]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <Fade>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-6">
              {t('contact.ctaTitleLine1')}<br /><span className="text-emerald-300">{t('contact.ctaTitleLine2')}</span>
            </h2>
            <p className="text-emerald-100/70 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              {t('contact.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative inline-flex items-center justify-center gap-2 h-12 pl-8 pr-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                {t('contact.goToForm')}
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  {Ic.arrow}
                </span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('planes')}
                className="inline-flex items-center justify-center h-12 px-10 rounded-full ring-1 ring-white/25 text-white font-medium text-sm hover:bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                {t('contact.viewSupportPlans')}
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default Contactos;
