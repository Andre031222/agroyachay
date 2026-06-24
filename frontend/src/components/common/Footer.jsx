import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Sprout } from 'lucide-react';

const linkClass =
  'group inline-flex items-center gap-2.5 text-sm text-emerald-100/55 ' +
  'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-emerald-50 hover:translate-x-0.5';

const dotClass =
  'h-1 w-1 rounded-full bg-emerald-400/50 ' +
  'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-150 group-hover:bg-emerald-300';

const chipClass =
  'flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] ring-1 ring-white/10 text-emerald-200/80 ' +
  'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-500/15 hover:ring-emerald-300/30 hover:text-emerald-100 hover:-translate-y-0.5';

const Footer = () => {
  return (
    <footer className="relative mt-auto overflow-hidden bg-[#04140d] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-300/25">
                <Sprout className="w-6 h-6 text-emerald-300" />
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-white">AgroYachay</h3>
            </div>
            <p className="text-sm leading-relaxed text-emerald-100/55">
              Transformando la agricultura peruana con tecnología inteligente e IoT
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Servicios
            </h4>
            <ul className="mt-5 space-y-3">
              <li>
                <Link to="/cultivos" className={linkClass}>
                  <span className={dotClass}></span>
                  Gestión de Cultivos
                </Link>
              </li>
              <li>
                <Link to="/monitoreo" className={linkClass}>
                  <span className={dotClass}></span>
                  Monitoreo IoT
                </Link>
              </li>
              <li>
                <Link to="/clima" className={linkClass}>
                  <span className={dotClass}></span>
                  Monitoreo Climático
                </Link>
              </li>
              <li>
                <Link to="/plagas" className={linkClass}>
                  <span className={dotClass}></span>
                  Detección de Plagas
                </Link>
              </li>
              <li>
                <Link to="/prediccion" className={linkClass}>
                  <span className={dotClass}></span>
                  Predicción de Cosechas
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className={linkClass}>
                  <span className={dotClass}></span>
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Empresa
            </h4>
            <ul className="mt-5 space-y-3">
              <li>
                <Link to="/dashboard" className={linkClass}>
                  <span className={dotClass}></span>
                  Inicio
                </Link>
              </li>
              <li>
                <a href="#acerca" className={linkClass}>
                  <span className={dotClass}></span>
                  Acerca de Nosotros
                </a>
              </li>
              <li>
                <Link to="/asesoria" className={linkClass}>
                  <span className={dotClass}></span>
                  Asesoría Especializada
                </Link>
              </li>
              <li>
                <a href="#blog" className={linkClass}>
                  <span className={dotClass}></span>
                  Blog
                </a>
              </li>
              <li>
                <a href="#soporte" className={linkClass}>
                  <span className={dotClass}></span>
                  Soporte
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Contacto
            </h4>
            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-3">
                <span className={chipClass}>
                  <Mail className="w-4 h-4" />
                </span>
                <div className="pt-1.5">
                  <a
                    href="mailto:info@agroyachay.pe"
                    className="text-sm text-emerald-100/55 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-emerald-50"
                  >
                    info@agroyachay.pe
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className={chipClass}>
                  <Phone className="w-4 h-4" />
                </span>
                <div className="pt-1.5">
                  <a
                    href="tel:+51999999999"
                    className="text-sm text-emerald-100/55 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-emerald-50"
                  >
                    +51 999 999 999
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className={chipClass}>
                  <MapPin className="w-4 h-4" />
                </span>
                <div className="pt-1.5">
                  <span className="text-sm text-emerald-100/55">
                    Puno, Perú
                  </span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-emerald-100/40">
            © 2025 AgroYachay. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
