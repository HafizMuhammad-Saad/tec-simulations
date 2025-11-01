import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FractionState {
  numerator: number;
  denominator: number;
  visualMode: 'circle' | 'rectangle';
  showComparison: boolean;
  compareNumerator: number;
  compareDenominator: number;
}

interface FractionContextType extends FractionState {
  setNumerator: (value: number) => void;
  setDenominator: (value: number) => void;
  setVisualMode: (mode: 'circle' | 'rectangle') => void;
  toggleComparison: () => void;
  setCompareNumerator: (value: number) => void;
  setCompareDenominator: (value: number) => void;
  getDecimal: (num: number, den: number) => string;
  getSimplified: (num: number, den: number) => string;
}

// ============================================================================
// UTILITIES
// ============================================================================

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const simplifyFraction = (numerator: number, denominator: number): [number, number] => {
  const divisor = gcd(numerator, denominator);
  return [numerator / divisor, denominator / divisor];
};

const COLORS = {
  primary: '#4A90E2',
  secondary: '#50C878',
  background: '#F5F7FA',
  accent: '#FF6B6B',
  text: '#2C3E50',
  border: '#BDC3C7',
  filled: '#4A90E2',
  unfilled: '#E8EEF2',
};

// ============================================================================
// CONTEXT
// ============================================================================

const FractionContext = createContext<FractionContextType | null>(null);

const FractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(4);
  const [visualMode, setVisualMode] = useState<'circle' | 'rectangle'>('circle');
  const [showComparison, setShowComparison] = useState(false);
  const [compareNumerator, setCompareNumerator] = useState(1);
  const [compareDenominator, setCompareDenominator] = useState(2);

  const toggleComparison = () => setShowComparison(prev => !prev);

  const getDecimal = (num: number, den: number) => {
    return (num / den).toFixed(3);
  };

  const getSimplified = (num: number, den: number) => {
    const [simpleNum, simpleDen] = simplifyFraction(num, den);
    if (simpleNum === num && simpleDen === den) return 'simplified';
    return `${simpleNum}/${simpleDen}`;
  };

  return (
    <FractionContext.Provider
      value={{
        numerator,
        denominator,
        visualMode,
        showComparison,
        compareNumerator,
        compareDenominator,
        setNumerator,
        setDenominator,
        setVisualMode,
        toggleComparison,
        setCompareNumerator,
        setCompareDenominator,
        getDecimal,
        getSimplified,
      }}
    >
      {children}
    </FractionContext.Provider>
  );
};

const useFraction = () => {
  const context = useContext(FractionContext);
  if (!context) throw new Error('useFraction must be used within FractionProvider');
  return context;
};

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ============================================================================
// CANVAS VISUALIZATION COMPONENT
// ============================================================================

const FractionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<Map<number, { progress: number; delay: number }>>(new Map());
  const lastUpdateRef = useRef<number>(0);
  
  const {
    numerator,
    denominator,
    visualMode,
    showComparison,
    compareNumerator,
    compareDenominator,
  } = useFraction();

  // Initialize animation state when values change
  useEffect(() => {
    animationStateRef.current.clear();
    const maxSegments = showComparison 
      ? Math.max(denominator, compareDenominator)
      : denominator;
    
    for (let i = 0; i < maxSegments; i++) {
      animationStateRef.current.set(i, { progress: 0, delay: i * 50 });
    }
    lastUpdateRef.current = performance.now();
  }, [numerator, denominator, compareNumerator, compareDenominator, visualMode, showComparison]);

  // Animation loop
  const drawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showComparison) {
      drawComparison(ctx, canvas.width, canvas.height);
    } else {
      drawSingleFraction(ctx, canvas.width, canvas.height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numerator, denominator, compareNumerator, compareDenominator, visualMode, showComparison]);

  useEffect(() => {
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastUpdateRef.current;
      lastUpdateRef.current = currentTime;

      let needsUpdate = false;
      
      animationStateRef.current.forEach((state) => {
        if (state.delay > 0) {
          state.delay = Math.max(0, state.delay - deltaTime);
          needsUpdate = true;
        } else if (state.progress < 1) {
          state.progress = Math.min(1, state.progress + deltaTime / 300);
          needsUpdate = true;
        }
      });

      drawCanvas();

      if (needsUpdate) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [numerator, denominator, compareNumerator, compareDenominator, visualMode, showComparison, drawCanvas]);

  // const draw = () => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext('2d');
  //   if (!ctx) return;

  //   // Clear canvas
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);

  //   if (showComparison) {
  //     drawComparison(ctx, canvas.width, canvas.height);
  //   } else {
  //     drawSingleFraction(ctx, canvas.width, canvas.height);
  //   }
  // };

  const drawSingleFraction = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    if (visualMode === 'circle') {
      drawCircleFraction(ctx, centerX, centerY, numerator, denominator, 140);
    } else {
      drawRectangleFraction(ctx, centerX, centerY, numerator, denominator, 300, 180);
    }
  };

  const drawComparison = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const leftX = width / 3;
    const rightX = (width / 3) * 2;
    const centerY = height / 2;

    if (visualMode === 'circle') {
      drawCircleFraction(ctx, leftX, centerY, numerator, denominator, 110);
      drawCircleFraction(ctx, rightX, centerY, compareNumerator, compareDenominator, 110);
    } else {
      drawRectangleFraction(ctx, leftX, centerY, numerator, denominator, 220, 140);
      drawRectangleFraction(ctx, rightX, centerY, compareNumerator, compareDenominator, 220, 140);
    }

    // Draw labels
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText(`${numerator}/${denominator}`, leftX, centerY + 160);
    ctx.fillText(`${compareNumerator}/${compareDenominator}`, rightX, centerY + 160);
  };

  const drawCircleFraction = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    num: number,
    den: number,
    radius: number
  ) => {
    // Draw background circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 3;
    ctx.stroke();

    const angleStep = (Math.PI * 2) / den;

    for (let i = 0; i < den; i++) {
      const startAngle = i * angleStep - Math.PI / 2;
      const endAngle = startAngle + angleStep;
      const isFilled = i < num;

      // Get animation progress
      const animState = animationStateRef.current.get(i);
      const progress = animState && animState.delay === 0 ? easeOutCubic(animState.progress) : 0;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius - 2, startAngle, endAngle, false);
      ctx.closePath();

      if (isFilled) {
        ctx.fillStyle = COLORS.filled;
        ctx.globalAlpha = progress;
      } else {
        ctx.fillStyle = COLORS.unfilled;
        ctx.globalAlpha = 1;
      }
      
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw divider line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(startAngle) * radius,
        y + Math.sin(startAngle) * radius
      );
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawRectangleFraction = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    num: number,
    den: number,
    width: number,
    height: number
  ) => {
    const startX = x - width / 2;
    const startY = y - height / 2;

    // Draw background rectangle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(startX, startY, width, height);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, width, height);

    const boxWidth = width / den;

    for (let i = 0; i < den; i++) {
      const boxX = startX + i * boxWidth;
      const isFilled = i < num;

      // Get animation progress
      const animState = animationStateRef.current.get(i);
      const progress = animState && animState.delay === 0 ? easeOutBack(animState.progress) : 0;

      // Calculate animated dimensions
      const animatedWidth = (boxWidth - 6) * progress;
      const animatedHeight = (height - 6) * progress;
      const offsetX = (boxWidth - 6 - animatedWidth) / 2;
      const offsetY = (height - 6 - animatedHeight) / 2;

      // Draw box
      if (isFilled) {
        ctx.fillStyle = COLORS.filled;
        if (progress > 0) {
          ctx.fillRect(
            boxX + 3 + offsetX,
            startY + 3 + offsetY,
            animatedWidth,
            animatedHeight
          );
        }
      } else {
        ctx.fillStyle = COLORS.unfilled;
        ctx.fillRect(boxX + 3, startY + 3, boxWidth - 6, height - 6);
      }

      // Draw divider line
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(boxX, startY);
        ctx.lineTo(boxX, startY + height);
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        width: '100%',
        maxWidth: '800px',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        borderRadius: '12px',
        backgroundColor: COLORS.background,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    />
  );
};

// ============================================================================
// CONTROL PANEL COMPONENT
// ============================================================================

const ControlPanel: React.FC = () => {
  const {
    numerator,
    denominator,
    visualMode,
    showComparison,
    compareNumerator,
    compareDenominator,
    setNumerator,
    setDenominator,
    setVisualMode,
    toggleComparison,
    setCompareNumerator,
    setCompareDenominator,
    getDecimal,
    getSimplified,
  } = useFraction();

  return (
    <div style={styles.controlPanel}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Fraction 1</h3>
        
        <div style={styles.control}>
          <label style={styles.label}>
            Numerator: <span style={styles.value}>{numerator}</span>
          </label>
          <input
            type="range"
            min="0"
            max={denominator}
            value={numerator}
            onChange={(e) => setNumerator(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.control}>
          <label style={styles.label}>
            Denominator: <span style={styles.value}>{denominator}</span>
          </label>
          <input
            type="range"
            min="1"
            max="12"
            value={denominator}
            onChange={(e) => {
              const newDen = Number(e.target.value);
              setDenominator(newDen);
              if (numerator > newDen) setNumerator(newDen);
            }}
            style={styles.slider}
          />
        </div>

        <div style={styles.info}>
          <div style={styles.infoRow}>
            <strong>Fraction:</strong> {numerator}/{denominator}
          </div>
          <div style={styles.infoRow}>
            <strong>Decimal:</strong> {getDecimal(numerator, denominator)}
          </div>
          <div style={styles.infoRow}>
            <strong>Simplified:</strong> {getSimplified(numerator, denominator)}
          </div>
        </div>
      </div>

      {showComparison && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Fraction 2</h3>
          
          <div style={styles.control}>
            <label style={styles.label}>
              Numerator: <span style={styles.value}>{compareNumerator}</span>
            </label>
            <input
              type="range"
              min="0"
              max={compareDenominator}
              value={compareNumerator}
              onChange={(e) => setCompareNumerator(Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.control}>
            <label style={styles.label}>
              Denominator: <span style={styles.value}>{compareDenominator}</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={compareDenominator}
              onChange={(e) => {
                const newDen = Number(e.target.value);
                setCompareDenominator(newDen);
                if (compareNumerator > newDen) setCompareNumerator(newDen);
              }}
              style={styles.slider}
            />
          </div>

          <div style={styles.info}>
            <div style={styles.infoRow}>
              <strong>Fraction:</strong> {compareNumerator}/{compareDenominator}
            </div>
            <div style={styles.infoRow}>
              <strong>Decimal:</strong> {getDecimal(compareNumerator, compareDenominator)}
            </div>
            <div style={styles.infoRow}>
              <strong>Simplified:</strong> {getSimplified(compareNumerator, compareDenominator)}
            </div>
          </div>
        </div>
      )}

      <div style={styles.buttonGroup}>
        <button
          onClick={() => setVisualMode('circle')}
          style={{
            ...styles.button,
            ...(visualMode === 'circle' ? styles.buttonActive : {}),
          }}
        >
          🔵 Circle
        </button>
        <button
          onClick={() => setVisualMode('rectangle')}
          style={{
            ...styles.button,
            ...(visualMode === 'rectangle' ? styles.buttonActive : {}),
          }}
        >
          ⬜ Rectangle
        </button>
        <button
          onClick={toggleComparison}
          style={{
            ...styles.button,
            ...(showComparison ? styles.buttonActive : {}),
          }}
        >
          {showComparison ? '👁️ Hide' : '👁️ Show'} Comparison
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: COLORS.background,
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    color: COLORS.text,
    fontSize: '2.5rem',
    marginBottom: '10px',
    fontWeight: '600',
  },
  subtitle: {
    color: '#7F8C8D',
    fontSize: '1.1rem',
    fontWeight: '400',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '30px',
    alignItems: 'start',
  },
  controlPanel: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '25px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '1.3rem',
    marginBottom: '15px',
    fontWeight: '600',
  },
  control: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: COLORS.text,
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  value: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
  },
  info: {
    backgroundColor: COLORS.background,
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
  },
  infoRow: {
    marginBottom: '8px',
    color: COLORS.text,
    fontSize: '0.95rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  button: {
    flex: '1',
    padding: '12px 20px',
    border: `2px solid ${COLORS.border}`,
    borderRadius: '8px',
    backgroundColor: 'white',
    color: COLORS.text,
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  buttonActive: {
    backgroundColor: COLORS.primary,
    color: 'white',
    borderColor: COLORS.primary,
  },
};

// Apply responsive styles
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  if (mediaQuery.matches) {
    styles.content = {
      ...styles.content,
      gridTemplateColumns: '1fr',
    };
  }
}

// ============================================================================
// MAIN APP
// ============================================================================

const BuildFractions: React.FC = () => {
  return (
    <FractionProvider>
      <div style={styles.app}>
        <header style={styles.header}>
          <h1 style={styles.title}>🧮 Build a Fraction</h1>
          <p style={styles.subtitle}>
            Explore fractions visually through interactive simulations
          </p>
        </header>

        <div style={styles.content} className='flex flex-col md:flex-row'>
          <FractionCanvas />
          <ControlPanel />
        </div>
      </div>
    </FractionProvider>
  );
};

export default BuildFractions;