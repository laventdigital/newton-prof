"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  layer: number;
  type: string;
  type_a?: string;
  text_a: string;
  type_b?: string;
  text_b?: string;
  dimension?: string;
  options?: { label: string; value: number }[];
  code_a?: string;
  code_b?: string;
}

interface LayerMeta {
  id: number;
  name: string;
  questions: number;
  instruction: string;
  header: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [layers, setLayers] = useState<LayerMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    import("@/data/questions").then((mod) => {
      const layer1 = shuffleArray(mod.QUESTIONS.filter((q: Question) => q.layer === 1));
      const layer2 = shuffleArray(mod.QUESTIONS.filter((q: Question) => q.layer === 2));
      const layer3 = shuffleArray(mod.QUESTIONS.filter((q: Question) => q.layer === 3));
      setQuestions([...layer1, ...layer2, ...layer3]);
      setLayers(mod.LAYERS);
      setLoading(false);
    });
  }, []);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progress = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;

  const currentLayer = currentQuestion
    ? layers.find((l) => l.id === currentQuestion.layer)
    : null;

  const getLayerProgress = () => {
    if (!currentQuestion) return { current: 0, total: 0 };
    const layerQuestions = questions.filter((q) => q.layer === currentQuestion.layer);
    const layerStart = questions.indexOf(layerQuestions[0]);
    return {
      current: currentIndex - layerStart + 1,
      total: layerQuestions.length,
    };
  };

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAnimating(false);
      }, 200);
    }
  }, [currentIndex, totalQuestions]);

  const handleAnswer = useCallback((questionId: string, value: string | number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (currentIndex < totalQuestions - 1) {
      goNext();
    }
  }, [currentIndex, totalQuestions, goNext, answers]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        ...(q.type === "forced_choice"
          ? { choice: answers[q.id] as string }
          : { value: answers[q.id] as number }),
      }));

      const res = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          location: "astana_almaty",
          grantPref: "specialty_first",
        }),
      });

      const data = await res.json();
      const report = data.report || data;
      if (data.resultId) {
        localStorage.setItem(`result_${data.resultId}`, JSON.stringify(report));
        router.push(`/results/${data.resultId}`);
      } else {
        const id = crypto.randomUUID();
        localStorage.setItem(`result_${id}`, JSON.stringify(report));
        router.push(`/results/${id}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Ошибка при отправке. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount >= questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const layerProgress = getLayerProgress();

  // Auto-submit when all questions answered
  useEffect(() => {
    if (allAnswered && !submitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🧪</div>
          <p className="text-[#E8E4F0]/60">Загружаем тест...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="w-full px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto">
          {/* Layer indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((l) => (
                <div
                  key={l}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    currentQuestion?.layer === l
                      ? "bg-[#A855F7] text-white"
                      : currentQuestion && currentQuestion.layer > l
                      ? "bg-[#A855F7]/20 text-[#C084FC]"
                      : "bg-[#251E3A] text-[#E8E4F0]/40"
                  }`}
                >
                  Этап {l}
                </div>
              ))}
            </div>
            <span className="text-sm text-[#E8E4F0]/40">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div
              className="progress-bar-fill bg-gradient-to-r from-[#A855F7] to-[#F472B6]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {currentLayer && (
            <div className="text-center mb-8">
              <h2
                style={{ fontFamily: "var(--font-heading)" }}
                className="text-xl font-bold text-white mb-2"
              >
                {currentLayer.header}
              </h2>
              <p className="text-sm text-[#E8E4F0]/50">
                {currentLayer.instruction} ({layerProgress.current}/{layerProgress.total})
              </p>
            </div>
          )}

          <div
            className={`transition-all duration-200 ${
              animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            {currentQuestion?.type === "forced_choice" && (
              <div className="space-y-4">
                <button
                  onClick={() => handleAnswer(currentQuestion.id, "a")}
                  className={`w-full card p-6 text-left transition-all hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5 active:scale-[0.98] ${
                    answers[currentQuestion.id] === "a"
                      ? "border-[#A855F7] bg-[#A855F7]/10"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-[#A855F7]/20 flex items-center justify-center text-[#C084FC] font-bold text-sm">
                      A
                    </span>
                    <span className="text-white text-lg leading-relaxed">
                      {currentQuestion.text_a}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer(currentQuestion.id, "b")}
                  className={`w-full card p-6 text-left transition-all hover:border-[#60A5FA]/50 hover:bg-[#60A5FA]/5 active:scale-[0.98] ${
                    answers[currentQuestion.id] === "b"
                      ? "border-[#60A5FA] bg-[#60A5FA]/10"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA] font-bold text-sm">
                      B
                    </span>
                    <span className="text-white text-lg leading-relaxed">
                      {currentQuestion.text_b}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {currentQuestion?.type === "scale_3" && (
              <div className="space-y-4">
                <div className="card p-6 mb-6">
                  <p className="text-white text-lg text-center leading-relaxed">
                    {currentQuestion.text_a}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {currentQuestion.options?.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                      className={`card p-4 text-center transition-all hover:border-[#A855F7]/50 active:scale-[0.98] ${
                        answers[currentQuestion.id] === opt.value
                          ? "border-[#A855F7] bg-[#A855F7]/10"
                          : ""
                      }`}
                    >
                      <span className="text-2xl block mb-2">{opt.label.split(" ")[0]}</span>
                      <span className="text-sm text-[#E8E4F0]/70">
                        {opt.label.split(" ").slice(1).join(" ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-30"
            >
              Назад
            </button>

            {isLastQuestion && allAnswered ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary !py-3 !px-8 disabled:opacity-50"
              >
                {submitting ? "Считаем результат..." : "Получить результат"}
              </button>
            ) : answers[currentQuestion?.id] !== undefined && !isLastQuestion ? (
              <button onClick={goNext} className="btn-secondary !py-2 !px-4 text-sm">
                Далее
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
