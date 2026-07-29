import { useState } from 'react';
import { QUIZ_QUESTIONS, DREAM_SUGGESTIONS, catInfo, makeMilestones } from '../data';

export default function QuizModal({ onFinish, onClose }) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(null);

  const isQuestion = step < QUIZ_QUESTIONS.length;
  const question = isQuestion ? QUIZ_QUESTIONS[step] : null;

  const choose = (opt) => {
    const nextCategory = opt.category || category;
    if (step + 1 >= QUIZ_QUESTIONS.length) {
      setCategory(nextCategory);
      setStep(step + 1);
    } else {
      setStep(step + 1);
      setCategory(nextCategory);
    }
  };

  const resultCat = category || 'default';
  const info = catInfo(resultCat);
  const suggestion = DREAM_SUGGESTIONS[resultCat] || DREAM_SUGGESTIONS.default;
  const milestonePreview = makeMilestones(resultCat, 0, suggestion.title).map((m) => m.text);
  const resultText = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'a fresh';

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {isQuestion ? (
          <>
            <div className="eyebrow" style={{ marginBottom: 10 }}>✨ Dream Discovery · Question {step + 1} of {QUIZ_QUESTIONS.length}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>{question.text}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {question.options.map((o, i) => (
                <div key={i} onClick={() => choose(o)} className="quiz-option">{o.label}</div>
              ))}
            </div>
            <div onClick={onClose} className="quiz-skip">Skip for now</div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>{info.emoji}</div>
              <div className="eyebrow" style={{ color: info.color, marginBottom: 8 }}>Your Dream Match · {resultText}</div>
            </div>
            <div className="quiz-suggestion-card">
              <div style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: 6 }}>{suggestion.title}</div>
              <div style={{ fontSize: '.8rem', color: '#a99bc2', lineHeight: 1.5 }}>{suggestion.description}</div>
            </div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Your Starter Milestones</div>
            <div style={{ marginBottom: 20 }}>
              {milestonePreview.map((ms, i) => (
                <div key={i} style={{ fontSize: '.8rem', color: '#f5f0ff', padding: '5px 0' }}>⭕ {ms}</div>
              ))}
            </div>
            <div onClick={() => onFinish(resultCat, suggestion.title, suggestion.description)} className="btn-primary" style={{ marginBottom: 10 }}>
              🚀 Add This Dream
            </div>
            <div onClick={onClose} style={{ textAlign: 'center', fontSize: '.8rem', color: '#a99bc2', cursor: 'pointer' }}>Maybe later</div>
          </>
        )}
      </div>
    </div>
  );
}
