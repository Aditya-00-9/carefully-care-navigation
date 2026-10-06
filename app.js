const $ = (selector) => document.querySelector(selector);
const symptomBox = $('#symptoms');
const alertBox = $('#inlineAlert');
const continueButton = $('#continue');

symptomBox.addEventListener('input', () => { $('#charCount').textContent = String(symptomBox.value.length); });

let recognition = null;
let recording = false;
let spokenText = '';
$('#mic').addEventListener('click', () => {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) {
    alertBox.textContent = 'Voice input is not available in this browser. You can type your symptoms instead.';
    alertBox.classList.add('show');
    return;
  }
  if (recording) { recognition.stop(); return; }
  recognition = new Speech();
  recognition.lang = $('#language').value;
  recognition.continuous = true;
  recognition.interimResults = true;
  spokenText = symptomBox.value ? `${symptomBox.value} ` : '';
  recognition.onstart = () => {
    recording = true;
    $('#mic').classList.add('is-recording');
    $('#micTitle').textContent = 'Listening… tap when you’re done';
    $('#micHint').textContent = 'Your browser is transcribing your speech';
  };
  recognition.onresult = (event) => {
    let current = '';
    for (let i = event.resultIndex; i < event.results.length; i++) current += event.results[i][0].transcript + (event.results[i].isFinal ? ' ' : '');
    symptomBox.value = (spokenText + current).trim().slice(0, 1200);
    $('#charCount').textContent = String(symptomBox.value.length);
  };
  recognition.onerror = (event) => {
    if (event.error !== 'no-speech') {
      alertBox.textContent = event.error === 'not-allowed' ? 'Microphone permission was declined. Type your symptoms instead.' : 'Voice input stopped. You can continue by typing.';
      alertBox.classList.add('show');
    }
  };
  recognition.onend = () => {
    recording = false;
    $('#mic').classList.remove('is-recording');
    $('#micTitle').textContent = 'Tap to tell us';
    $('#micHint').textContent = 'Speak naturally — we’re listening';
  };
  recognition.start();
});

// Conservative phrase checks are a visible safety net, not a validated triage tool.
const emergencyPhrases = [
  'chest pain', 'severe chest', 'trouble breathing', 'difficulty breathing', 'shortness of breath', 'can’t breathe', 'cannot breathe',
  'face drooping', 'one-sided weakness', 'one side is weak', 'slurred speech', 'fainting', 'unconscious', 'severe bleeding', 'having a seizure', 'overdose',
  'dolor en el pecho', 'dificultad para respirar', 'falta de aire', 'douleur thoracique', 'difficulté à respirer', 'essoufflement',
  'छाती में दर्द', 'सांस लेने में तकलीफ', '胸痛', '呼吸困难', 'ضيق التنفس', 'ألم في الصدر',
];
const symptomGroups = [
  { name: 'Heart or chest care', terms: ['chest', 'heart', 'palpitation', 'heartbeat', 'cardiac', 'chest pressure'] },
  { name: 'Breathing or lung care', terms: ['breath', 'breathing', 'cough', 'lung', 'wheeze', 'respiratory'] },
  { name: 'Neurology', terms: ['headache', 'migraine', 'numb', 'tingling', 'dizz', 'memory', 'tremor', 'weakness'] },
  { name: 'Digestive health', terms: ['stomach', 'abdominal', 'belly', 'nausea', 'vomit', 'bowel', 'diarrh', 'digest', 'constipat'] },
  { name: 'Skin care', terms: ['skin', 'rash', 'itch', 'spot', 'lesion', 'swelling', 'acne'] },
  { name: 'Muscle and joint care', terms: ['back', 'joint', 'muscle', 'knee', 'shoulder', 'neck', 'pain', 'ache', 'sore', 'strain'] },
  { name: 'Mental health', terms: ['anxious', 'anxiety', 'depressed', 'depression', 'panic', 'stress', 'sleep', 'mood'] },
  { name: 'Ear, nose, and throat care', terms: ['ear', 'throat', 'sinus', 'nose', 'hearing', 'swallow'] },
  { name: 'Women’s health', terms: ['period', 'pregnan', 'menstrual', 'pelvic'] },
  { name: 'Urinary health', terms: ['urine', 'urinary', 'bladder', 'kidney', 'pee'] },
  { name: 'Primary care', terms: [] },
];

function planFor(text) {
  const lowered = text.toLocaleLowerCase();
  const best = symptomGroups.slice(0, -1).map((group) => ({ ...group, score: group.terms.reduce((n, term) => n + (lowered.includes(term) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score)[0];
  return best && best.score ? best.name : 'Primary care';
}

function plainSummary(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 460 ? `${cleaned.slice(0, 457)}…` : cleaned;
}

function renderResult(text, urgent, plan) {
  $('#results').hidden = false;
  $('#urgentBanner').hidden = !urgent;
  $('#resultTitle').textContent = urgent ? 'Check for urgent symptoms first.' : 'A place to start, based on what you shared.';
  $('#resultLead').textContent = urgent
    ? 'This page noticed a symptom phrase that can sometimes need immediate assessment. If it is happening now, severe, or rapidly worsening, call your local emergency number. This prompt is incomplete and is not a diagnosis.'
    : 'A short description cannot tell us the cause. A clinician can ask the right follow-up questions and assess you in context.';
  $('#summaryText').textContent = plainSummary(text);
  $('#nextHeading').textContent = urgent ? 'If this is happening now' : `Consider ${plan.toLocaleLowerCase()}`;
  $('#nextText').textContent = urgent
    ? 'If this is happening now, severe, or getting worse, call your local emergency number. Ask someone nearby to stay with you. Do not drive yourself.'
    : `A primary care clinician or local nurse advice service can help assess what you described and decide if specialist care is needed. The category “${plan}” is a broad signpost inferred from keywords, not a medical recommendation.`;
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
}

continueButton.addEventListener('click', async () => {
  alertBox.classList.remove('show');
  const text = symptomBox.value.trim();
  if (text.length < 6) {
    alertBox.textContent = 'Share a little more about what you’re experiencing, or use the microphone to tell us.';
    alertBox.classList.add('show');
    symptomBox.focus();
    return;
  }
  const urgent = emergencyPhrases.some((phrase) => text.toLocaleLowerCase().includes(phrase));
  const plan = planFor(text);
  const useAI = $('#aiConsent').checked && !urgent;
  continueButton.disabled = true;
  continueButton.innerHTML = useAI ? 'Preparing your summary… <span>✳</span>' : 'Putting your notes together… <span>✳</span>';
  let aiResult = null;
  let aiUnavailable = false;
  if (useAI) {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: text, language: $('#language').selectedOptions[0].textContent }),
        signal: AbortSignal.timeout(22000),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The model service is unavailable.');
      aiResult = payload;
    } catch (error) {
      aiUnavailable = true;
      toast(error.message.includes('not configured') ? 'AI isn’t connected yet; keeping your words on this page.' : 'AI unavailable. Your words stay as entered.');
    }
  }
  renderResult(text, urgent, plan);
  if (aiResult) {
    $('#summaryText').textContent = aiResult.translated_summary;
    const list = $('#questionsList');
    list.replaceChildren(...aiResult.questions.map((question) => { const item = document.createElement('li'); item.textContent = question; return item; }));
    toast('Your translated visit note is ready. Your original words remain above.');
  } else if (aiUnavailable && $('#aiConsent').checked) {
    $('#resultLead').textContent += ' AI translation wasn’t available; this summary uses your original words.';
  }
  continueButton.disabled = false;
  continueButton.innerHTML = 'Help me find a next step <span>→</span>';
});

$('#editSymptoms').addEventListener('click', () => { symptomBox.focus(); $('#intake').scrollIntoView({ behavior: 'smooth' }); });
$('#copySummary').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(`What I’m experiencing: ${plainSummary(symptomBox.value)}\n\nThis is my own symptom summary, not a diagnosis.`);
    toast('Original symptom summary copied to clipboard.');
  } catch {
    toast('Clipboard unavailable — select the summary above to copy.');
  }
});
$('#menuButton').addEventListener('click', () => {
  const links = $('.navlinks');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  Object.assign(links.style, { position: 'absolute', top: '57px', left: '0', right: '0', background: 'var(--paper)', padding: '18px 24px', zIndex: '10' });
});
