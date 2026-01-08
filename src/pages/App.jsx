import { useEffect, useState, useRef } from "react";
import { HelpCircle, Settings } from "lucide-react";
import ConfigModal from "../components/ConfigModal";
import HelpModal from "../components/HelpModal";

const SCORE_BASE = 1000;
const SCORE_MULTIPLYER = 28;
const TIME_GAIN = 8;
const sizeClasses = {
  3: "text-3xl",
  4: "text-4xl",
  5: "text-5xl",
  6: "text-6xl",
  7: "text-7xl",
};

const AnimatedDigit = ({ char, syncKey, size = 7, color }) => {
  const [visible, setVisible] = useState(false);
  const lastSync = useRef(syncKey);

  useEffect(() => {
    // Only trigger animation when syncKey actually changes
    if (lastSync.current === syncKey) return;
    lastSync.current = syncKey;
    setVisible(false);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [syncKey]);

  return (
    <span
      style={{ color: color || "#d4e2b6" }}
      className={`
        inline-block font-semibold
        transform transition-all duration-300 ease-out
        ${sizeClasses[size]}
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-125"}
      `}
    >
      {char}
    </span>
  );
};

const AnimatedTimer = ({ value }) => {
  return (
    <div className="flex gap-1">
      {String(value)
        // .padStart(2, "0")
        .split("")
        .map((digit, i) => (
          <AnimatedDigit
            key={`${digit}-${i}`}
            char={digit}
            syncKey={value}
            size={3}
            color="#e2b6b6"
          />
        ))}
    </div>
  );
};

function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [startAnimVisible, setStartAnimVisible] = useState(false);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [valueNow, setValueNow] = useState(0);
  const [sumNow, setSumNow] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [correctFeedback, setCorrectFeedback] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [showGainBadge, setShowGainBadge] = useState(false);
  const [badgeLeaving, setBadgeLeaving] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const bgRef = useRef(null);
  const sfxCorrectRef = useRef(null);
  const sfxClickRef = useRef(null);
  const sfxGameOverRef = useRef(null);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [showScoreBadge, setShowScoreBadge] = useState(false);
  const [scoreBadgeValue, setScoreBadgeValue] = useState(0);
  const [scoreBadgeLeaving, setScoreBadgeLeaving] = useState(false);
  // const [showTimeUp, setShowTimeUp] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameStarted, timeLeft]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      // When countdown hits 0, hide the digits and trigger the 'Começou' overlay.
      setCountdown(null);
      setStartAnimVisible(true);
      return;
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // initialize audio elements once
  useEffect(() => {
    try {
      bgRef.current = new Audio("/sounds/bg.wav");
      bgRef.current.loop = true;
      bgRef.current.volume = 0.24;
    } catch (e) {}
    try {
      sfxCorrectRef.current = new Audio("/sounds/correct.wav");
      sfxClickRef.current = new Audio("/sounds/click.wav");
      sfxGameOverRef.current = new Audio("/sounds/gameover.wav");
    } catch (e) {}
    return () => {
      try {
        bgRef.current && bgRef.current.pause();
      } catch (e) {}
    };
  }, []);

  function playSfx(ref) {
    if (!audioEnabled || !ref || !ref.current) return;
    try {
      ref.current.currentTime = 0;
      void ref.current.play();
    } catch (e) {}
  }

  function playClick() {
    playSfx(sfxClickRef);
  }

  useEffect(() => {
    if (answer === String(sumNow) && !correctFeedback) {
      // Correct answer given -> instant feedback
      playSfx(sfxCorrectRef);
      setCorrectFeedback(true);
      // hide timer briefly
      setHideTimer(true);
      setShowGainBadge(true);
      AddScore(timeLeft);
      setCorrectAnswers((prev) => prev + 1);

      // Capture current sum value for next question
      const newValue = sumNow;

      // After short delay, advance to next question, increment timer and then animate badge out
      setTimeout(() => {
        setAnswer("");
        setSumNow(newValue + newValue);
        setValueNow(newValue);
        UpTimeCorrectSum();
        // start badge exit
        setBadgeLeaving(true);
        // after exit animation, hide badge and restore timer
        setCorrectFeedback(false);
        setTimeout(() => {
          setHideTimer(false);
          setShowGainBadge(false);
          setBadgeLeaving(false);
        }, 360);
      }, 1000);
    }
  }, [answer, sumNow, valueNow, timeLeft]);

  useEffect(() => {
    if (gameOver) playSfx(sfxGameOverRef);
  }, [gameOver]);

  function AddScore(timeLeftNow) {
    const timeRemaining = timeLeftNow;
    const pointsEarned = SCORE_BASE + timeRemaining * SCORE_MULTIPLYER;
    animateScoreIncrease(pointsEarned);
  }

  function animateScoreIncrease(points) {
    if (scoreAnimating) {
      // if already animating, just add points quickly
      setScore((prev) => prev + points);
      return;
    }
    setScoreBadgeValue(points);
    setShowScoreBadge(true);
    setScoreAnimating(true);
    setScoreBadgeLeaving(false);

    const start = score;
    const end = start + points;
    const duration = 520;
    const intervalMs = 40;
    const steps = Math.ceil(duration / intervalMs);
    // let current = start;
    let i = 0;

    const timer = setInterval(() => {
      i++;
      const t = i / steps;
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (end - start) * eased);
      setScore(value);
      if (i >= steps) {
        clearInterval(timer);
        setScore(end);
        // kick the badge exit after a short delay
        setTimeout(() => {
          setScoreBadgeLeaving(true);
          setTimeout(() => {
            setShowScoreBadge(false);
            setScoreBadgeLeaving(false);
            setScoreAnimating(false);
          }, 260);
        }, 220);
      }
    }, intervalMs);
  }

  function UpTimeCorrectSum() {
    // setShowTimeUp(true);
    setTimeLeft((prev) => prev + TIME_GAIN);
    // setTimeout(() => setShowTimeUp(false), 1000);
  }

  function resetGame() {
    setGameOver(false);
    setScore(0);
    setCorrectAnswers(0);
    setAnswer("");
    setTimeLeft(10);
    setGameStarted(false);
    setCountdown(null);
    setStartAnimVisible(false);
    setValueNow(0);
    setSumNow(0);
  }

  // StartOverlay will control its own enter/exit animations and call
  // `onDone` when the exit animation finishes. That ensures `gameStarted`
  // is set only after the overlay fully disappears.
  function startGame() {
    const initalValue = Math.floor(Math.random() * 9) + 2;

    setValueNow(initalValue);
    setSumNow(initalValue + initalValue);
    setCountdown(3);
    setGameStarted(false);
    setAnswer("");
    setStartAnimVisible(false);
    setGameOver(false);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(10);
    // try to play background music when user starts the game
    if (audioEnabled && bgRef.current) {
      try {
        void bgRef.current.play();
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (!bgRef.current) return;
    if (audioEnabled && gameStarted) {
      try {
        void bgRef.current.play();
      } catch (e) {}
    } else {
      try {
        bgRef.current.pause();
      } catch (e) {}
    }
  }, [audioEnabled, gameStarted]);

  const AnimatedTimer = ({ value }) => {
    return (
      <div className="flex gap-1">
        {String(value)
          // .padStart(2, "0")
          .split("")
          .map((digit, i) => (
            <AnimatedDigit
              key={`${digit}-${i}`}
              char={digit}
              syncKey={value}
              size={3}
              color="#e2b6b6"
            />
          ))}
      </div>
    );
  };

  // Small presentational component for animated countdown digits
  const sizeClasses = {
    3: "text-3xl",
    4: "text-4xl",
    5: "text-5xl",
    6: "text-6xl",
    7: "text-7xl",
  };

  const AnimatedDigit = ({ char, syncKey, size = 7, color }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      setVisible(false);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }, [syncKey]);

    return (
      <span
        style={{ color: color || "#d4e2b6" }}
        className={`
        inline-block font-semibold
        transform transition-all duration-300 ease-out
        ${sizeClasses[size]}
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-125"}
      `}
      >
        {char}
      </span>
    );
  };

  // Overlay shown briefly after countdown ends. Controls its own enter/exit
  // animations and notifies parent via `onDone` when exit completes.
  const StartOverlay = ({ onDone }) => {
    const [isClosing, setIsClosing] = useState(false);
    const boxRef = useRef(null);

    // Begin closing after a short visible duration
    useEffect(() => {
      if (!startAnimVisible) return;
      const visibleMs = 600;
      const t = setTimeout(() => setIsClosing(true), visibleMs);
      return () => clearTimeout(t);
    }, []);

    // When closing, wait for animationend (or fallback) then call onDone
    useEffect(() => {
      if (!isClosing) return;
      const el = boxRef.current;
      let fallback = null;

      const finish = () => onDone && onDone();

      const handleAnimEnd = (e) => {
        if (e.target !== el) return;
        el.removeEventListener("animationend", handleAnimEnd);
        finish();
      };

      if (el) {
        el.addEventListener("animationend", handleAnimEnd);
        fallback = setTimeout(() => {
          el.removeEventListener("animationend", handleAnimEnd);
          finish();
        }, 800);
      } else {
        fallback = setTimeout(finish, 500);
      }

      return () => {
        if (el) el.removeEventListener("animationend", handleAnimEnd);
        if (fallback) clearTimeout(fallback);
      };
    }, [isClosing, onDone]);

    if (!startAnimVisible) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-auto">
        <div
          ref={boxRef}
          className={
            "flex flex-col items-center " +
            (isClosing ? "animate-start-out" : "animate-start-in")
          }
        >
          <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#d4e2b6]">
            Começou!
          </div>
        </div>
      </div>
    );
  };

  const [scoreFlash, setScoreFlash] = useState(false);

  // Game Over screen component
  const GameOverScreen = ({ onPlayAgain, onReset }) => {
    const [isVisible, setIsVisible] = useState(true);

    const calculateLevel = () => {
      if (correctAnswers < 3) return "Iniciante";
      if (correctAnswers < 7) return "Aprendiz";
      if (correctAnswers < 12) return "Intermediário";
      if (correctAnswers < 18) return "Avançado";
      return "Mestre";
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-auto">
        <div className="flex flex-col items-center justify-center gap-6 bg-[#539fa2] rounded-3xl p-8 shadow-2xl max-w-sm w-11/12 animate-fadeIn">
          <div className="text-4xl font-extrabold text-[#d4e2b6] text-center">
            Fim de Jogo!
          </div>

          <div className="w-full space-y-4">
            {/* Score */}
            <div className="bg-[#c4dbb4] rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-[#539fa2]">
                Pontuação Final
              </p>
              <p className="text-3xl font-extrabold text-[#539fa2]">{score}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#c4dbb4] rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-[#539fa2]">Acertos</p>
                <p className="text-2xl font-bold text-[#539fa2]">
                  {correctAnswers}
                </p>
              </div>
              <div className="bg-[#c4dbb4] rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-[#539fa2]">Nível</p>
                <p className="text-sm font-bold text-[#539fa2]">
                  {calculateLevel()}
                </p>
              </div>
            </div>

            {/* Level progress */}
            <div className="bg-[#abccb1] rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-[#539fa2] mb-2">
                Sequência Máxima
              </p>
              <p className="text-2xl font-bold text-[#539fa2]">{valueNow}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={onReset}
              className="w-full px-8 py-3 rounded-2xl bg-[#c4dbb4] text-[#539fa2] text-lg font-semibold shadow-lg active:scale-95 transition cursor-pointer hover:bg-[#d4e2b6]"
            >
              Voltar para o início
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                onPlayAgain && onPlayAgain();
              }}
              className="w-full px-8 py-3 rounded-2xl bg-[#c4dbb4] text-[#539fa2] text-lg font-semibold shadow-lg active:scale-95 transition cursor-pointer hover:bg-[#d4e2b6]"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Trigger flash effect when score changes
  useEffect(() => {
    setScoreFlash(true);
    const timer = setTimeout(() => setScoreFlash(false), 500);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="h-screen w-screen flex flex-col justify-between bg-[#539fa2] px-6 py-4">
      <div className="flex justify-between items-center">
        {gameStarted ? (
          <div className="flex justify-center items-center gap-2 relative">
            <p className="text-sm font-medium text-[#d4e2b6]">Pontuação: </p>

            <div className="relative flex items-center">
              <span
                className={`text-lg font-bold text-[#d4e2b6] transition-all duration-300 ${
                  scoreFlash ? "scale-110 text-green-200" : "scale-100"
                }`}
              >
                {score}
              </span>

              {showScoreBadge && (
                <div
                  className={`absolute -top-4 left-2 px-2 py-0.5 rounded-lg bg-yellow-200 text-[#2b3b2f] text-xs font-bold shadow-md transform transition-all duration-300 ${
                    scoreBadgeLeaving ? "badge-exit" : "badge-enter"
                  }`}
                >
                  +{scoreBadgeValue}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div></div>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="w-11 h-11 rounded-full bg-[#c4dbb4] flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
          >
            <HelpCircle size={22} className="text-[#539fa2]" />
          </button>
          <button
            onClick={() => setShowConfig(true)}
            className="w-11 h-11 rounded-full bg-[#c4dbb4] flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
          >
            <Settings size={22} className="text-[#539fa2]" />
          </button>
        </div>
      </div>

      {/* =========================
          CONTEÚDO CENTRAL
      ========================== */}
      <div className="flex flex-col items-center justify-center gap-6 flex-1">
        {/* Contador */}
        {countdown !== null && (
          <>
            <div className="flex items-center gap-2">
              {String(countdown)
                .split("")
                .map((ch, i) => (
                  <AnimatedDigit key={i} char={ch} syncKey={countdown} />
                ))}
            </div>
          </>
        )}
        {/* Tela inicial */}
        {!gameStarted && !startAnimVisible && countdown === null && (
          <>
            <h1 className="text-3xl font-semibold text-[#d4e2b6] text-center">
              Oi Isabel
            </h1>

            <button
              onClick={startGame}
              className="px-12 py-4 rounded-2xl bg-[#c4dbb4] text-[#539fa2] text-xl font-semibold shadow-lg active:scale-95 transition cursor-pointer"
            >
              Iniciar
            </button>
          </>
        )}
        {/* Tela do jogo */}
        {gameStarted && (
          <div className="flex flex-col items-center gap-4">
            {/* <h2 className="text-2xl font-semibold text-[#d4e2b6]">
              Resolva a soma
            </h2> */}

            {/* Conta */}
            <div className="flex flex-col items-center gap-2 text-3xl font-bold text-[#d4e2b6]">
              <div className="flex gap-2">
                <span>{valueNow}</span>
                <span>+</span>
                <span>{valueNow}</span>
                {/* <span>=</span> */}
              </div>

              <input
                type="text"
                readOnly
                value={answer}
                className={`w-66 h-14 text-center text-[#539fa2] rounded-xl bg-[#d4e2b6] text-3xl font-semibold outline-none transition-all duration-300 ${
                  correctFeedback
                    ? "scale-110 bg-green-200 shadow-sm shadow-green-300"
                    : "scale-100"
                }`}
              />
            </div>

            {/* Teclado numérico */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    if (correctFeedback) return;
                    playClick();
                    setAnswer((prev) => prev + n);
                  }}
                  className={`w-20 h-20 rounded-xl text-xl font-semibold shadow active:scale-95 transition ${
                    correctFeedback
                      ? "bg-[#c4dbb4] text-[#539fa2] cursor-not-allowed"
                      : "bg-[#c4dbb4] text-[#539fa2]"
                  }`}
                >
                  {n}
                </button>
              ))}

              {/* Botão limpar */}
              <button
                onClick={() => {
                  if (correctFeedback) return;
                  playClick();
                  setAnswer("");
                }}
                className={`w-20 h-20 rounded-xl text-lg font-semibold shadow active:scale-95 transition ${
                  correctFeedback
                    ? "bg-[#c4dbb4] text-[#539fa2] cursor-not-allowed"
                    : "bg-[#abccb1] text-[#539fa2]"
                }`}
              >
                C
              </button>

              {/* Zero */}
              <button
                onClick={() => {
                  if (correctFeedback) return;
                  playClick();
                  setAnswer((prev) => prev + "0");
                }}
                className={`w-20 h-20 rounded-xl text-xl font-semibold shadow active:scale-95 transition ${
                  correctFeedback
                    ? "bg-[#c4dbb4] text-[#539fa2] cursor-not-allowed"
                    : "bg-[#c4dbb4] text-[#539fa2]"
                }`}
              >
                0
              </button>

              {/* Apagar */}
              <button
                onClick={() => {
                  if (correctFeedback) return;
                  playClick();
                  setAnswer((prev) => prev.slice(0, -1));
                }}
                className={`w-20 h-20 rounded-xl text-lg font-semibold shadow active:scale-95 transition ${
                  correctFeedback
                    ? "bg-[#c4dbb4] text-[#539fa2] cursor-not-allowed"
                    : "bg-[#abccb1] text-[#539fa2]"
                }`}
              >
                ←
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 mt-2">
              <span className="text-sm font-semibold text-[#d4e2b6]">
                Tempo restante:
              </span>
              {!hideTimer ? (
                <AnimatedTimer value={timeLeft} />
              ) : (
                <div className="h-8 flex items-center justify-center">
                  {showGainBadge && (
                    <div
                      className={`px-3 py-1 rounded-xl bg-green-300 text-[#053f36] font-bold shadow-md transform transition-all duration-300 ${
                        badgeLeaving ? "badge-exit" : "badge-enter"
                      }`}
                    >
                      +{TIME_GAIN}s
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start overlay shown briefly after countdown ends */}
        <StartOverlay
          onDone={() => {
            setStartAnimVisible(false);
            setGameStarted(true);
            setTimeLeft(10);
          }}
        />

        {/* Game Over screen */}
        {gameOver && (
          <GameOverScreen
            onPlayAgain={() => {
              setGameOver(false);
              startGame();
            }}
            onReset={resetGame}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#abccb1] space-y-1">
        <p className="font-medium">Jogo das Somas</p>
        <p>Desenvolvido por Winicius © 2025</p>
      </div>

      {/* Modals */}
      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onReset={resetGame}
        onPlayAgain={() => {
          setGameOver(false);
          startGame();
        }}
        gameStarted={gameStarted}
      />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default App;
