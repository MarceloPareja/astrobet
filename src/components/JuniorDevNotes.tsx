import React, { useState } from 'react';
import { Code, Coffee, Bug, Terminal, Info, Flame, Shield, Database } from 'lucide-react';

export default function JuniorDevNotes() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Junior Dev Floating Button */}
      <button
        id="dev-notes-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-brand-red to-brand-dark-red text-brand-light px-4 py-3 rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200 glow-red border border-white/10"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-light"></span>
        </span>
        <Coffee className="w-5 h-5" />
        <span className="font-display font-semibold text-sm">Bitácora del Dev Junior ☕</span>
      </button>

      {/* Bitácora Modal/Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-md bg-brand-bg border-l border-white/10 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-brand-red" />
                  <h3 className="font-display font-bold text-xl text-brand-light">Bitácora de "Mateo" (Dev Junior)</h3>
                </div>
                <button
                  id="close-dev-notes"
                  onClick={() => setIsOpen(false)}
                  className="text-brand-gray hover:text-brand-light text-xl p-1"
                >
                  ✕
                </button>
              </div>

              {/* Developer Intro */}
              <div className="bg-brand-gray/10 border border-brand-red/20 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-red/20 flex items-center justify-center text-2xl shrink-0">
                    🧑‍💻
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-light">Mateo G. — Junior Frontend Dev</h4>
                    <p className="text-xs text-brand-light/70">"¡Hola! Este es mi primer gran proyecto con dinero simulado. Mi jefe me pidió un sistema de apuestas de fútbol sólido. He estado tomando 4 cafés al día para terminarlo."</p>
                  </div>
                </div>
              </div>

              {/* Dev Logs */}
              <div className="space-y-4">
                <h5 className="font-display font-semibold text-sm uppercase tracking-wider text-brand-red">Notas de Desarrollo</h5>
                
                {/* Log 1 */}
                <div className="glass-panel-light p-3 rounded-lg border-l-2 border-brand-red">
                  <div className="flex items-center gap-2 mb-1">
                    <Code className="w-4 h-4 text-brand-red" />
                    <span className="text-xs font-mono font-bold">LOG #104: El Ratio Matemático 1:N + Devolución</span>
                  </div>
                  <p className="text-xs text-brand-light/80 leading-relaxed">
                    "¡Actualización de última hora! Mi jefe me pidió que además de pagar la ganancia del ratio (1:N), ¡también le devolvamos al usuario la cantidad original apostada! Así que ahora el premio de una apuesta ganada es: <strong className="text-brand-red">Apuesta + (Apuesta * Ratio)</strong>. Ej: Si apuestas $10 a cuota 1.5, te llevas tus $10 de vuelta más $15 de ganancia ($25 en total). ¡Tuve que rehacer el cálculo en un minuto antes de que me diera taquicardia!"
                  </p>
                </div>

                {/* Log 2 */}
                <div className="glass-panel-light p-3 rounded-lg border-l-2 border-brand-gray">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-brand-gray" />
                    <span className="text-xs font-mono font-bold">LOG #103: Persistencia Segura (¡Sin SQL todavía!)</span>
                  </div>
                  <p className="text-xs text-brand-light/80 leading-relaxed">
                    "Encontré que `localStorage` es genial. No tengo que configurar Docker ni migraciones de base de datos que siempre me dan error en mi laptop de 8GB de RAM. He creado claves para usuarios, apuestas y transacciones. ¡Y sobrevive a las recargas del navegador!"
                  </p>
                </div>

                {/* Log 3 */}
                <div className="glass-panel-light p-3 rounded-lg border-l-2 border-yellow-500">
                  <div className="flex items-center gap-2 mb-1">
                    <Bug className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-mono font-bold">LOG #102: El Secreto del Banco Ficticio</span>
                  </div>
                  <p className="text-xs text-brand-light/80 leading-relaxed">
                    "Para depósitos y retiros, creé una API falsa (AstroBank). Agregué un `setTimeout` de 1.5 segundos para simular que nos estamos conectando con el banco nacional por una pasarela segura y que se vea 'pro'. ¡Es puro humo visual, pero al senior de mi equipo le encantó el spinner!"
                  </p>
                </div>

                {/* Log 4 */}
                <div className="glass-panel-light p-3 rounded-lg border-l-2 border-green-500">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-mono font-bold">LOG #101: Validación de Datos Bancarios</span>
                  </div>
                  <p className="text-xs text-brand-light/80 leading-relaxed">
                    "El registro pide obligatoriamente datos bancarios. Validé que la cuenta tenga dígitos reales o al menos formato válido. Si alguien ingresa un banco falso, se vincula y se simula. ¡Asegúrate de registrarte con datos ficticios para probar!"
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-[11px] text-brand-light/50 font-mono">
              <span>Stack: React + Tailwind v4 + Vite</span>
              <span className="text-brand-red flex items-center gap-1">
                <Flame className="w-3 h-3 animate-pulse" /> Hecho con ❤️ y sudor
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
