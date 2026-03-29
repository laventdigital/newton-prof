import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span style={{ fontFamily: 'var(--font-heading)' }} className="font-bold text-lg text-white">
            Profi<span className="text-[#C084FC]">Test</span> KZ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm !py-2 !px-4">
            Войти
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#251E3A] border border-[rgba(255,255,255,0.06)] mb-8 text-sm text-[#E8E4F0]/70">
            <span>🧪</span> Научная методология Holland RIASEC
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)' }} className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Узнай свою{" "}
            <span className="gradient-text">профессию</span>
            <br />
            за 15 минут
          </h1>

          <p className="text-lg sm:text-xl text-[#E8E4F0]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Пройди бесплатный тест профориентации и получи персональный отчёт
            с топ-5 специальностями, грантами ЕНТ и планом действий
          </p>

          <Link href="/auth/register" className="btn-primary inline-block text-lg">
            Пройти тест бесплатно
          </Link>

          <p className="mt-4 text-sm text-[#E8E4F0]/40">
            53 вопроса &middot; 15 минут &middot; без подвоха
          </p>
        </div>

        {/* How it works */}
        <div className="w-full max-w-5xl mx-auto mt-24 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <div className="card p-8 text-center fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="text-4xl mb-4">📝</div>
            <h3 style={{ fontFamily: 'var(--font-heading)' }} className="font-semibold text-white text-lg mb-2">1. Пройди тест</h3>
            <p className="text-[#E8E4F0]/60 text-sm leading-relaxed">
              53 вопроса о твоих интересах, способностях и ценностях.
              Просто выбирай, что ближе — без правильных ответов
            </p>
          </div>

          <div className="card p-8 text-center fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="text-4xl mb-4">📊</div>
            <h3 style={{ fontFamily: 'var(--font-heading)' }} className="font-semibold text-white text-lg mb-2">2. Получи результат</h3>
            <p className="text-[#E8E4F0]/60 text-sm leading-relaxed">
              Узнай свой тип личности, топ-5 специальностей с % совпадения,
              AI-устойчивость и конкретный план
            </p>
          </div>

          <div className="card p-8 text-center fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="text-4xl mb-4">🚀</div>
            <h3 style={{ fontFamily: 'var(--font-heading)' }} className="font-semibold text-white text-lg mb-2">3. Действуй</h3>
            <p className="text-[#E8E4F0]/60 text-sm leading-relaxed">
              Получи связку ЕНТ, список вузов, информацию о грантах МОН 2024
              и советы, что прокачать уже сейчас
            </p>
          </div>
        </div>

        {/* Trust bar */}
        <div className="w-full max-w-3xl mx-auto mb-20 px-4">
          <div className="card p-6 flex flex-wrap items-center justify-center gap-6 text-sm text-[#E8E4F0]/50">
            <span className="flex items-center gap-2">
              <span className="text-[#C084FC] font-bold text-lg">62</span> специальности
            </span>
            <span className="w-px h-4 bg-[rgba(255,255,255,0.06)]" />
            <span className="flex items-center gap-2">
              <span className="text-[#34D399] font-bold text-lg">50</span> вузов КЗ
            </span>
            <span className="w-px h-4 bg-[rgba(255,255,255,0.06)]" />
            <span className="flex items-center gap-2">
              <span className="text-[#60A5FA] font-bold text-lg">13</span> связок ЕНТ
            </span>
            <span className="w-px h-4 bg-[rgba(255,255,255,0.06)]" />
            <span className="flex items-center gap-2">
              <span className="text-[#F472B6] font-bold text-lg">МОН</span> гранты 2024
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#E8E4F0]/40">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span style={{ fontFamily: 'var(--font-heading)' }} className="font-bold">
              Profi<span className="text-[#C084FC]">Test</span> KZ
            </span>
          </div>
          <p>Бесплатная платформа профориентации для школьников Казахстана</p>
        </div>
      </footer>
    </div>
  );
}
