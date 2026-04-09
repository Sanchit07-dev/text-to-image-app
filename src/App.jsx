import { useEffect, useState } from 'react';
import { HfInference } from '@huggingface/inference';
import heroImage from './assets/hero.png';
import './App.css';

const hfToken = import.meta.env.VITE_HF_TOKEN;
const hf = new HfInference(hfToken);

const modeCopy = {
  image: {
    eyebrow: 'Visual reasoning',
    title: 'Turn a calm idea into striking imagery.',
    description:
      'Shape a scene with atmosphere, detail, and intent. The canvas stays minimal so the prompt can do the talking.',
    placeholder:
      'Quiet reading room at sunrise, warm oak textures, soft mist beyond the windows, editorial photography',
    helper: 'Best with mood, setting, lighting, material, and style cues.',
    cta: 'Render image',
    emptyTitle: 'Image preview',
    emptyText: 'Your generated artwork will settle in here once the render is ready.',
    statusLabel: 'Image mode',
  },
  text: {
    eyebrow: 'Language synthesis',
    title: 'Ask for grounded writing with a polished tone.',
    description:
      'Draft ideas, explain concepts, or explore a direction. The interface stays quiet so the response feels focused.',
    placeholder:
      'Write a concise product concept for a wellness AI that feels warm, competent, and futuristic.',
    helper: 'Best with tone, audience, length, and outcome expectations.',
    cta: 'Generate text',
    emptyTitle: 'Text response',
    emptyText: 'Your response will appear here with comfortable spacing for reading.',
    statusLabel: 'Text mode',
  },
};

const promptSuggestions = {
  image: [
    'Meditation pod overlooking a rainy city, cinematic glass reflections',
    'Nordic tea room with diffused daylight and tactile stone surfaces',
    'Wearable AI companion on a walnut desk, luxury editorial lighting',
  ],
  text: [
    'Summarize the benefits of mindful work habits in 5 sentences',
    'Write a launch tagline set for a calm productivity app',
    'Explain neural style transfer to a curious beginner',
  ],
};

function App() {
  const [mode, setMode] = useState('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [generatedText, setGeneratedText] = useState(null);
  const [error, setError] = useState(null);

  const currentMode = modeCopy[mode];
  const activeSuggestions = promptSuggestions[mode];

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const resetResults = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }

    setGeneratedText(null);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    resetResults();

    try {
      if (mode === 'image') {
        const blob = await hf.textToImage({
          model: 'black-forest-labs/FLUX.1-schnell',
          inputs: prompt,
        });

        if (!blob) throw new Error('Failed to generate image. Please try again or use a different prompt.');
        
        setImageUrl(URL.createObjectURL(blob));
      } else {
        const completion = await hf.chatCompletion({
          model: 'meta-llama/Llama-3.2-1B-Instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        });

        if (!completion?.choices?.[0]?.message?.content) {
          throw new Error('Failed to generate text.');
        }

        setGeneratedText(completion.choices[0].message.content.trim());
      }
    } catch (generationError) {
      console.error(generationError);
      let errorMessage = generationError.message || `An error occurred while generating the ${mode}.`;
      if (errorMessage.includes('Invalid username or password') || errorMessage.includes('401')) {
         errorMessage = 'Hugging Face API Key is missing or invalid. Please update it in your .env file.';
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setPrompt('');
    setError(null);
    resetResults();
  };

  const renderOutput = () => {
    if (isGenerating) {
      return (
        <div className="result-shell result-loading">
          <div className="loader-wrapper">
            <div className="pulse-dots" aria-hidden="true">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p className="pulse-text">Composing your {mode === 'image' ? 'scene' : 'response'}...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="result-shell result-error">
          <div className="state-icon">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v3" />
              <path d="M12 16h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <h3>Generation paused</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (mode === 'image' && imageUrl) {
      return (
        <div className="result-shell image-result">
          <div className="image-container show">
            <img src={imageUrl} alt={prompt} />
          </div>
        </div>
      );
    }

    if (mode === 'text' && generatedText) {
      return (
        <div className="result-shell text-result">
          <div className="text-container show">
            <p>{generatedText}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="result-shell result-empty">
        <div className="state-icon">
          {mode === 'image' ? (
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          ) : (
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </div>
        <div className="empty-copy">
          <h3>{currentMode.emptyTitle}</h3>
          <p>{currentMode.emptyText}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <div className="ambient-layer" aria-hidden="true">
        <div className="ambient-orb orb-one"></div>
        <div className="ambient-orb orb-two"></div>
        <div className="ambient-grid"></div>
      </div>

      <main className="app-frame">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">{currentMode.eyebrow}</p>
            <h1>Quiet tools for vivid outputs.</h1>
            <p className="hero-text">
              A more soothing creative console for text and image generation, tuned for focus, clarity, and confidence.
            </p>
          </div>

          <div className="hero-card">
            <div className="hero-card-top">
              <span className="status-pill">Adaptive studio</span>
              <span className="status-pill muted">{currentMode.statusLabel}</span>
            </div>
            <img src={heroImage} alt="Abstract soothing interface preview" className="hero-image" />
            <div className="hero-card-footer">
              <div>
                <strong>{currentMode.title}</strong>
                <p>{currentMode.description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="workspace-panel">
          <header className="workspace-header">
            <div>
              <p className="section-kicker">Workspace</p>
              <h2>Prompt with intention</h2>
            </div>

            <div className="mode-toggle" role="tablist" aria-label="Generation mode">
              <button
                className={mode === 'image' ? 'active' : ''}
                onClick={() => handleModeChange('image')}
                type="button"
              >
                Image
              </button>
              <button
                className={mode === 'text' ? 'active' : ''}
                onClick={() => handleModeChange('text')}
                type="button"
              >
                Text
              </button>
            </div>
          </header>

          <form className="composer-card" onSubmit={handleGenerate}>
            <label className="input-label" htmlFor="prompt">
              Describe the outcome
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={currentMode.placeholder}
              disabled={isGenerating}
              className="prompt-input"
              rows={5}
            />

            <div className="composer-footer">
              <div className="input-meta">
                <span>{currentMode.helper}</span>
                <span>{prompt.trim().length} characters</span>
              </div>

              <button
                type="submit"
                className={`generate-btn ${isGenerating ? 'generating' : ''}`}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? 'Thinking...' : currentMode.cta}
              </button>
            </div>
          </form>

          <div className="suggestion-row" aria-label="Prompt suggestions">
            {activeSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-chip"
                onClick={() => setPrompt(suggestion)}
                disabled={isGenerating}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <section className="result-card">
            <div className="result-header">
              <div>
                <p className="section-kicker">Output</p>
                <h2>{mode === 'image' ? 'Rendered preview' : 'Generated response'}</h2>
              </div>
              <span className={`result-badge ${imageUrl || generatedText ? 'ready' : ''}`}>
                {isGenerating ? 'In progress' : imageUrl || generatedText ? 'Ready' : 'Waiting'}
              </span>
            </div>
            {renderOutput()}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
