import { useState, useEffect, useRef } from "react";

const C = {
  primary: "#5B4FE8",
  primaryLight: "#EEEDFE",
  primaryMid: "#AFA9EC",
  primaryDark: "#3C3489",
  green: "#3B6D11",
  greenLight: "#EAF3DE",
  amber: "#854F0B",
  amberLight: "#FAEEDA",
  text: "#111",
  textSub: "#555",
  textHint: "#999",
  border: "#E8E8E8",
  bg: "#F5F4F2",
  white: "#fff",
  tagColors: {
    "마케팅": { bg: "#EEEDFE", text: "#3C3489" },
    "독서": { bg: "#E1F5EE", text: "#085041" },
    "개발": { bg: "#E6F1FB", text: "#0C447C" },
    "디자인": { bg: "#FBEAF0", text: "#72243E" },
  }
};

const SERIES = [
  { id: 1, name: "그로스 해킹 A-Z", count: 3, goal: 5, color: "#EEEDFE", textColor: "#3C3489" },
  { id: 2, name: "린 스타트업 독서", count: 1, goal: 4, color: "#E1F5EE", textColor: "#085041" },
];

const LOGS = [
  { id: 1, tag: "마케팅", title: "그로스 해킹 — 퍼널 분석 기초", source: "인프런", date: "어제", published: true, seriesId: 1,
    points: ["AARRR 퍼널의 각 단계별 역할과 지표 설정 방법", "활성화율이 리텐션보다 먼저 해결되어야 하는 이유", "코호트 분석으로 이탈 구간을 찾는 실전 방법"],
    memo: "클라이언트 제안서에 바로 쓸 수 있는 내용. 다음 달 콘텐츠 시리즈로 묶으면 좋겠다." },
  { id: 2, tag: "독서", title: "린 스타트업 — 3장 검증된 학습", source: "독서 모임", date: "3일 전", published: false, seriesId: 2,
    points: ["MVP는 최소 기능이 아니라 최소 학습 도구", "허영 지표 vs 실행 지표의 차이", "피벗의 기준: 전략 변경이지 실패가 아님"],
    memo: "독자들이 공감할 만한 '창업 착각 시리즈'로 이어갈 수 있겠다." },
  { id: 3, tag: "마케팅", title: "그로스 해킹 — 리텐션 전략", source: "인프런", date: "5일 전", published: true, seriesId: 1,
    points: ["리텐션 루프 설계 방법", "알림 전략의 올바른 사용법", "D7·D30 리텐션 벤치마크"],
    memo: "SaaS 클라이언트 케이스에 딱 맞는 내용. 사례 중심으로 발행하면 반응 좋을 것 같다." },
];

const AI_DRAFT = {
  title: "그로스 해킹의 시작: 퍼널을 제대로 읽는 법",
  body: `퍼널이 새고 있다면, 먼저 어디서 새는지 알아야 한다.

AARRR 퍼널은 단순한 깔때기가 아니다. 각 단계는 독립적인 문제를 가지고 있고, 해결 순서도 중요하다.

특히 '활성화(Activation)'를 리텐션보다 먼저 해결해야 한다는 논리가 명쾌했다. 새는 바가지에 물을 계속 부어도 소용없듯, 사용자가 첫 경험에서 가치를 느끼지 못하면 어떤 리텐션 전략도 의미가 없다.

코호트 분석으로 이탈 구간을 찾는 방법도 실전적이었다. 가입 시점별로 묶어서 보면 어느 시기 사용자가 어디서 이탈하는지 패턴이 보인다.

다음 글에서는 실제 코호트 분석 세팅 방법을 다룰 예정이다.`
};

const s = {
  phone: { width: 375, background: C.white, display: "flex", flexDirection: "column", minHeight: 720, fontFamily: "'Noto Sans KR', sans-serif", position: "relative", overflow: "hidden" },
  statusBar: { height: 44, background: C.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 },
  appBar: { height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: C.white, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0 },
  scroll: { flex: 1, overflowY: "auto", padding: "16px 20px", background: C.bg },
  tabBar: { height: 60, display: "flex", borderTop: `0.5px solid ${C.border}`, background: C.white, flexShrink: 0 },
  card: { background: C.white, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `0.5px solid ${C.border}`, cursor: "pointer" },
  tag: (t) => ({ display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, marginBottom: 6, background: (C.tagColors[t] || { bg: C.primaryLight }).bg, color: (C.tagColors[t] || { text: C.primaryDark }).text }),
  btnPrimary: { width: "100%", background: C.primary, color: C.white, border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 },
  btnOutline: { width: "100%", background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 12, padding: "13px 0", fontSize: 15, fontWeight: 500, cursor: "pointer", marginBottom: 8 },
  input: { width: "100%", background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  label: { fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5, display: "block" },
};

function StatusBar() {
  return (
    <div style={s.statusBar}>
      <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>9:41</span>
      <span style={{ color: "#fff", fontSize: 12 }}>● ● ●</span>
    </div>
  );
}

function AppBar({ left, title, right }) {
  return (
    <div style={s.appBar}>
      <div style={{ width: 60 }}>{left}</div>
      <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{title}</span>
      <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

function TabBar({ active, navigate }) {
  const tabs = [
    { id: "home", label: "홈", icon: "⌂" },
    { id: "portfolio", label: "포트폴리오", icon: "◈" },
    { id: "my", label: "마이", icon: "○" },
  ];
  return (
    <div style={s.tabBar}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => t.id !== "my" && navigate(t.id)}
          style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active === t.id ? C.primary : C.textHint }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === t.id ? 600 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function IconBtn({ icon, onClick, color }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: color || C.textSub, padding: 4 }}>{icon}</button>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color || C.primary, borderRadius: 2 }} />
    </div>
  );
}

function HomeScreen({ navigate }) {
  return (
    <div style={s.phone}>
      <StatusBar />
      <div style={{ ...s.appBar, justifyContent: "space-between" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>LearnLog</span>
        <IconBtn icon="⌕" color={C.textSub} />
      </div>
      <div style={s.scroll}>
        <div style={{ background: C.primary, borderRadius: 16, padding: "16px 18px", marginBottom: 14, color: C.white }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 10, letterSpacing: "0.5px" }}>MY PORTFOLIO</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>8</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>총 발행 글</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>23</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>총 기록</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>2</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>진행 중 시리즈</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", marginBottom: 8, textTransform: "uppercase" }}>진행 중 시리즈</div>
        {SERIES.map(ser => (
          <div key={ser.id} style={{ ...s.card, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 600, background: ser.color, color: ser.textColor, padding: "2px 7px", borderRadius: 4, display: "inline-block", marginBottom: 5 }}>시리즈</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ser.name}</div>
              </div>
              <span style={{ fontSize: 12, color: C.textHint, fontWeight: 500 }}>{ser.count}/{ser.goal}편</span>
            </div>
            <ProgressBar value={ser.count} max={ser.goal} color={ser.textColor} />
            {ser.count >= ser.goal - 1 && (
              <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, marginTop: 6 }}>✦ {ser.goal}편 완성 시 전자책 묶기 가능해요</div>
            )}
          </div>
        ))}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", margin: "14px 0 8px", textTransform: "uppercase" }}>최근 기록</div>
        {LOGS.map(log => {
          const ser = SERIES.find(s => s.id === log.seriesId);
          return (
            <div key={log.id} style={s.card} onClick={() => navigate("detail", { log })}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <span style={s.tag(log.tag)}>{log.tag}</span>
                {ser && <span style={{ fontSize: 9, color: C.textHint, background: C.bg, padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>{ser.name}</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{log.title}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.textHint }}>{log.date} · {log.source}</span>
                {log.published
                  ? <span style={{ fontSize: 10, color: C.green, fontWeight: 600, background: C.greenLight, padding: "2px 7px", borderRadius: 4 }}>발행 완료</span>
                  : <span style={{ fontSize: 10, color: C.primary, fontWeight: 500, background: C.primaryLight, padding: "2px 7px", borderRadius: 4 }}>미발행</span>}
              </div>
            </div>
          );
        })}
        <div style={{ height: 70 }} />
      </div>

      <button onClick={() => navigate("new")} style={{ position: "absolute", bottom: 76, right: 20, width: 52, height: 52, background: C.primary, border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 26, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>＋</button>
      <TabBar active="home" navigate={navigate} />
    </div>
  );
}

function PortfolioScreen({ navigate }) {
  return (
    <div style={s.phone}>
      <StatusBar />
      <div style={{ ...s.appBar, justifyContent: "space-between" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>포트폴리오</span>
        <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }}>공유 링크</span>
      </div>
      <div style={s.scroll}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { label: "총 발행", value: "8편", color: C.primary },
            { label: "총 기록", value: "23건", color: C.textSub },
            { label: "발행률", value: "35%", color: C.green },
          ].map(m => (
            <div key={m.label} style={{ flex: 1, background: C.white, borderRadius: 12, padding: "12px 10px", border: `0.5px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, color: C.textHint, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", marginBottom: 8, textTransform: "uppercase" }}>시리즈 현황</div>
        {SERIES.map(ser => (
          <div key={ser.id} style={{ ...s.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ser.name}</div>
              <span style={{ fontSize: 11, color: C.textHint }}>{ser.count}/{ser.goal}편</span>
            </div>
            <ProgressBar value={ser.count} max={ser.goal} />
            {ser.count >= ser.goal - 1 && (
              <div style={{ marginTop: 8, background: C.amberLight, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: C.amber, fontWeight: 500 }}>
                ✦ 1편만 더 쓰면 전자책으로 묶을 수 있어요!
              </div>
            )}
          </div>
        ))}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", margin: "14px 0 8px", textTransform: "uppercase" }}>발행 이력</div>
        {LOGS.filter(l => l.published).map(log => (
          <div key={log.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <span style={s.tag(log.tag)}>{log.tag}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{log.title}</div>
              <div style={{ fontSize: 11, color: C.textHint, marginTop: 3 }}>{log.date} · 브런치</div>
            </div>
            <span style={{ fontSize: 18, marginLeft: 8, color: C.textHint }}>↗</span>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </div>
      <TabBar active="portfolio" navigate={navigate} />
    </div>
  );
}

function VoicePanel({ onClose, onDone }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);
  const [processStep, setProcessStep] = useState("");
  const [dotOn, setDotOn] = useState(true);
  const recognitionRef = useRef(null);
  const finalRef = useRef("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (phase !== "recording") return;
    const iv = setInterval(() => setDotOn(v => !v), 500);
    return () => clearInterval(iv);
  }, [phase]);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Chrome 브라우저에서만 음성 인식이 지원됩니다.");
      return;
    }
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;
    finalRef.current = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t + " ";
        else interim += t;
      }
      setTranscript(finalRef.current + interim);
    };
    rec.onerror = () => setPhase("idle");
    rec.start();
    setPhase("recording");
    setTranscript("");
  };

  const stopAndSummarize = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    runSummarize(finalRef.current || transcript);
  };

  const runSummarize = (text) => {
    setTranscript(text);
    setPhase("processing");
    setProgress(0);
    setProcessStep("음성을 텍스트로 변환하는 중...");
    let p = 0;
    const iv = setInterval(() => {
      p += 2.5;
      setProgress(Math.min(p, 100));
      if (p >= 45) setProcessStep("AI가 핵심 내용을 요약하는 중...");
      if (p >= 100) {
        clearInterval(iv);
        const sents = text
          .replace(/[.!?。]+/g, "|")
          .split("|")
          .map(s => s.trim())
          .filter(s => s.length > 6);
        onDone({
          points: [sents[0] || "", sents[1] || "", sents[2] || ""],
          memo: sents.slice(3, 5).join(" ") || text.slice(0, 100),
        });
      }
    }, 40);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhase("processing");
    setProgress(0);
    setProcessStep(`"${file.name}" 변환 중...`);
    let p = 0;
    const iv = setInterval(() => {
      p += 1;
      setProgress(Math.min(p, 100));
      if (p >= 50) setProcessStep("AI가 핵심 내용을 요약하는 중...");
      if (p >= 100) {
        clearInterval(iv);
        onDone({
          points: [
            "AARRR 퍼널의 각 단계별 역할과 지표 설정 방법",
            "활성화율이 리텐션보다 먼저 해결되어야 하는 이유",
            "코호트 분석으로 이탈 구간을 찾는 실전 방법",
          ],
          memo: "클라이언트 제안서에 바로 쓸 수 있는 내용. 다음 달 콘텐츠 시리즈로 묶으면 좋겠다.",
        });
      }
    }, 50);
  };

  if (phase === "idle") return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>음성으로 자동 기록</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={startRecording} style={{ flex: 1, background: C.primary, color: C.white, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          🎙 녹음 시작
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          📁 파일 올리기
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: C.textHint, fontSize: 12, cursor: "pointer", padding: 0 }}>닫기</button>
    </div>
  );

  if (phase === "recording") return (
    <div style={{ background: C.white, borderRadius: 14, border: `1.5px solid #e33`, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: dotOn ? "#e33" : "transparent", border: "1.5px solid #e33", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e33" }}>녹음 중</span>
        <span style={{ fontSize: 11, color: C.textHint, marginLeft: "auto" }}>말씀하세요</span>
      </div>
      <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", minHeight: 72, fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 12 }}>
        {transcript || <span style={{ color: C.textHint }}>음성을 인식하는 중...</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={stopAndSummarize} style={{ flex: 2, background: C.primary, color: C.white, border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>완료 → AI 요약</button>
        <button onClick={() => { if (recognitionRef.current) recognitionRef.current.stop(); onClose(); }} style={{ flex: 1, background: C.bg, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 0", fontSize: 13, cursor: "pointer" }}>취소</button>
      </div>
    </div>
  );

  if (phase === "processing") return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 16px", marginBottom: 14, textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>AI가 요약하고 있어요</div>
      <div style={{ fontSize: 12, color: C.textHint, marginBottom: 16 }}>{processStep}</div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: C.primary, borderRadius: 3, transition: "width 0.05s" }} />
      </div>
      <div style={{ fontSize: 12, color: C.primary, marginTop: 8, fontWeight: 500 }}>{Math.round(progress)}%</div>
    </div>
  );

  return null;
}

function NewScreen({ navigate }) {
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(["", "", ""]);
  const [memo, setMemo] = useState("");
  const [tag, setTag] = useState("마케팅");
  const [seriesId, setSeriesId] = useState(1);
  const [showVoice, setShowVoice] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const tags = ["마케팅", "독서", "개발", "디자인"];

  const handleVoiceDone = ({ points: p, memo: m }) => {
    setPoints([p[0] || "", p[1] || "", p[2] || ""]);
    setMemo(m || "");
    setAutoFilled(true);
    setShowVoice(false);
  };

  return (
    <div style={s.phone}>
      <StatusBar />
      <AppBar
        left={<IconBtn icon="✕" onClick={() => navigate("home")} />}
        title="새 기록"
        right={<span onClick={() => navigate("home")} style={{ fontSize: 14, color: C.primary, fontWeight: 600, cursor: "pointer" }}>저장</span>}
      />
      <div style={s.scroll}>

        {/* 음성 자동 기록 배너 */}
        {!showVoice && !autoFilled && (
          <div style={{ background: C.primaryLight, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.primaryDark, marginBottom: 2 }}>✦ 음성으로 자동 기록</div>
              <div style={{ fontSize: 11, color: C.primary }}>녹음하거나 파일을 올리면 AI가 요약해요</div>
            </div>
            <button onClick={() => setShowVoice(true)} style={{ background: C.primary, color: C.white, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>시작하기</button>
          </div>
        )}

        {showVoice && <VoicePanel onClose={() => setShowVoice(false)} onDone={handleVoiceDone} />}

        {autoFilled && (
          <div style={{ background: C.greenLight, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: C.green, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✓ AI가 핵심 포인트와 메모를 자동으로 채웠어요</span>
            <button onClick={() => setShowVoice(true)} style={{ background: "none", border: "none", color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0 }}>다시</button>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>강의 / 스터디 제목 *</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="오늘 배운 강의 이름" />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>날짜</label>
            <input style={s.input} defaultValue="2026.05.23" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={s.label}>출처</label>
            <input style={s.input} placeholder="인프런, 유데미..." />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>태그</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.map(t => (
              <button key={t} onClick={() => setTag(t)} style={{ ...s.tag(t), cursor: "pointer", border: tag === t ? `1.5px solid ${C.primary}` : "1.5px solid transparent", padding: "4px 10px", fontSize: 11 }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>시리즈에 추가</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SERIES.map(ser => (
              <button key={ser.id} onClick={() => setSeriesId(ser.id)} style={{ background: seriesId === ser.id ? C.primaryLight : C.white, border: `1px solid ${seriesId === ser.id ? C.primary : C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: 13, color: seriesId === ser.id ? C.primaryDark : C.text, fontWeight: seriesId === ser.id ? 600 : 400 }}>{ser.name}</span>
                <span style={{ fontSize: 11, color: C.textHint }}>{ser.count}/{ser.goal}편</span>
              </button>
            ))}
            <button style={{ background: C.white, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textHint, cursor: "pointer" }}>+ 새 시리즈 만들기</button>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>
            핵심 포인트 (최대 3개)
            {autoFilled && <span style={{ fontSize: 10, color: C.green, fontWeight: 600, marginLeft: 6 }}>✦ AI 자동완성</span>}
          </label>
          {points.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, flexShrink: 0 }} />
              <input style={{ ...s.input, marginBottom: 0, background: autoFilled && p ? C.primaryLight : C.white }} value={p} onChange={e => { const n = [...points]; n[i] = e.target.value; setPoints(n); }} placeholder={`포인트 ${i + 1}`} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>
            느낀 점 / 콘텐츠 각도
            {autoFilled && <span style={{ fontSize: 10, color: C.green, fontWeight: 600, marginLeft: 6 }}>✦ AI 자동완성</span>}
          </label>
          <textarea style={{ ...s.input, height: 80, resize: "none", lineHeight: 1.6, background: autoFilled && memo ? C.primaryLight : C.white }} value={memo} onChange={e => setMemo(e.target.value)} placeholder="독자에게 어떻게 풀어낼지, 어떤 사례와 연결할지..." />
        </div>
        <button style={s.btnPrimary} onClick={() => navigate("home")}>저장하기</button>
      </div>
    </div>
  );
}

function DetailScreen({ navigate, log }) {
  const ser = SERIES.find(s => s.id === log.seriesId);
  return (
    <div style={s.phone}>
      <StatusBar />
      <AppBar left={<IconBtn icon="←" onClick={() => navigate("home")} />} title="기록 상세" right={<IconBtn icon="✎" color={C.textSub} />} />
      <div style={s.scroll}>
        <div style={{ ...s.card, cursor: "default", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={s.tag(log.tag)}>{log.tag}</span>
            {ser && <span style={{ fontSize: 9, color: C.textHint, background: C.bg, padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>{ser.name} · {ser.count}/{ser.goal}편</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5, lineHeight: 1.4 }}>{log.title}</div>
          <div style={{ fontSize: 12, color: C.textHint }}>{log.date} · {log.source}</div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", marginBottom: 10, textTransform: "uppercase" }}>핵심 포인트</div>
        {log.points.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{p}</span>
          </div>
        ))}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", margin: "16px 0 8px", textTransform: "uppercase" }}>콘텐츠 각도 메모</div>
        <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, marginBottom: 24, background: C.white, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.border}` }}>{log.memo}</div>

        <button style={s.btnPrimary} onClick={() => navigate("draft", { log })}>
          ✦ AI로 브런치 초안 생성
        </button>
        <button style={s.btnOutline}>직접 작성하기</button>
      </div>
    </div>
  );
}

function DraftScreen({ navigate, log }) {
  const [generating, setGenerating] = useState(true);
  const [editTitle, setEditTitle] = useState(AI_DRAFT.title);
  const [editBody, setEditBody] = useState(AI_DRAFT.body);
  const [platform, setPlatform] = useState("브런치");
  const [series, setSeries] = useState("그로스 해킹 A-Z");
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("edit");

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(iv); setGenerating(false); return 100; } return p + 4; });
    }, 60);
    return () => clearInterval(iv);
  }, []);

  if (generating) {
    return (
      <div style={s.phone}>
        <StatusBar />
        <AppBar left={<IconBtn icon="←" onClick={() => navigate("detail", { log })} />} title="초안 생성 중" right={null} />
        <div style={{ ...s.scroll, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 64, height: 64, background: C.primaryLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 30 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>AI가 초안을 작성하고 있어요</div>
          <div style={{ fontSize: 13, color: C.textHint, marginBottom: 28, textAlign: "center" }}>기록과 콘텐츠 각도를 분석해<br />브런치 독자에게 맞는 글을 만드는 중...</div>
          <div style={{ width: "80%", height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: C.primary, borderRadius: 3, transition: "width 0.1s" }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.primary, fontWeight: 500 }}>{Math.min(progress, 100)}%</div>
        </div>
      </div>
    );
  }

  const checklist = [
    { label: "제목이 독자의 호기심을 끄나요?", ok: editTitle.trim().length > 10 },
    { label: "본문이 충분히 작성됐나요?", ok: editBody.trim().length > 80 },
    { label: "플랫폼과 시리즈를 확인했나요?", ok: true },
  ];
  const allClear = checklist.every(c => c.ok);

  return (
    <div style={s.phone}>
      <StatusBar />
      <AppBar
        left={<IconBtn icon="←" onClick={() => tab === "preview" ? setTab("edit") : navigate("detail", { log })} />}
        title={tab === "edit" ? "초안 편집" : "미리보기 · 검토"}
        right={tab === "edit"
          ? <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }}>재생성</span>
          : <span onClick={() => setTab("edit")} style={{ fontSize: 12, color: C.textSub, cursor: "pointer" }}>편집</span>
        }
      />

      {/* 탭 스위처 */}
      <div style={{ display: "flex", background: C.white, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0 }}>
        {[{ key: "edit", label: "✎ 편집" }, { key: "preview", label: "◎ 미리보기" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, border: "none", background: "none", cursor: "pointer",
            padding: "11px 0", fontSize: 13,
            fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? C.primary : C.textHint,
            borderBottom: `2px solid ${tab === t.key ? C.primary : "transparent"}`,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={s.scroll}>
        {tab === "edit" ? (
          <>
            <div style={{ background: C.primaryLight, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.primary, marginBottom: 4 }}>✦ AI 초안 완성 — 자유롭게 편집하세요</div>
              <div style={{ fontSize: 11, color: C.primaryDark, lineHeight: 1.5 }}>핵심 포인트와 콘텐츠 각도를 반영해 브런치 스타일로 작성했어요.</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>제목</label>
              <input style={s.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>본문</label>
              <textarea style={{ ...s.input, height: 200, resize: "none", lineHeight: 1.7, fontSize: 13 }} value={editBody} onChange={e => setEditBody(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>발행 플랫폼</label>
                <select style={{ ...s.input }} value={platform} onChange={e => setPlatform(e.target.value)}>
                  <option>브런치</option>
                  <option>미디엄</option>
                  <option>벨로그</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>시리즈</label>
                <select style={{ ...s.input }} value={series} onChange={e => setSeries(e.target.value)}>
                  <option>그로스 해킹 A-Z</option>
                  <option>없음</option>
                </select>
              </div>
            </div>
            <button style={s.btnPrimary} onClick={() => setTab("preview")}>미리보기로 검토하기 →</button>
          </>
        ) : (
          <>
            {/* 브런치 스타일 미리보기 */}
            <div style={{ background: C.white, borderRadius: 14, padding: "18px 16px", marginBottom: 12, border: `0.5px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                <span style={s.tag("마케팅")}>마케팅</span>
                <span style={{ fontSize: 10, color: C.textHint }}>{series}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1.45, marginBottom: 14 }}>{editTitle}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: `0.5px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.primaryDark, flexShrink: 0 }}>이</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>이유진</div>
                  <div style={{ fontSize: 11, color: C.textHint }}>2026.05.23 · {platform}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>
                {editBody.split("\n").map((line, i) =>
                  line.trim()
                    ? <p key={i} style={{ margin: "0 0 14px 0" }}>{line}</p>
                    : <br key={i} />
                )}
              </div>
              <div style={{ display: "flex", gap: 16, paddingTop: 14, borderTop: `0.5px solid ${C.border}`, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: C.textHint }}>♡ 좋아요</span>
                <span style={{ fontSize: 12, color: C.textHint }}>✎ 댓글</span>
                <span style={{ fontSize: 12, color: C.textHint, marginLeft: "auto" }}>↗ 공유</span>
              </div>
            </div>

            {/* 발행 전 체크리스트 */}
            <div style={{ background: allClear ? C.greenLight : C.amberLight, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: allClear ? C.green : C.amber, marginBottom: 10 }}>
                {allClear ? "✓ 발행 준비 완료" : "! 발행 전 확인해주세요"}
              </div>
              {checklist.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < checklist.length - 1 ? 7 : 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: item.ok ? C.green : C.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: C.white, fontWeight: 700 }}>
                    {item.ok ? "✓" : "!"}
                  </div>
                  <span style={{ fontSize: 12, color: item.ok ? C.text : C.amber }}>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              style={{ ...s.btnPrimary, opacity: allClear ? 1 : 0.5 }}
              onClick={() => allClear && navigate("success")}
            >{platform}에 발행하기 →</button>
            <button style={s.btnOutline} onClick={() => setTab("edit")}>수정하러 돌아가기</button>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ navigate }) {
  return (
    <div style={s.phone}>
      <StatusBar />
      <div style={s.appBar}>
        <div style={{ width: 60 }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}> </span>
        <IconBtn icon="✕" onClick={() => navigate("home")} />
      </div>
      <div style={{ ...s.scroll, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24 }}>
        <div style={{ width: 72, height: 72, background: C.greenLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 34, color: C.green }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>브런치에 발행됐어요!</div>
        <div style={{ fontSize: 14, color: C.textSub, textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>포트폴리오가 한 편 더 쌓였어요.<br />꾸준한 발행이 콘텐츠 자산이 됩니다.</div>

        <div style={{ width: "100%", background: C.white, borderRadius: 14, padding: "14px 16px", border: `0.5px solid ${C.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.textHint, marginBottom: 5 }}>발행된 글</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>그로스 해킹의 시작: 퍼널을 제대로 읽는 법</div>
          <div style={{ fontSize: 12, color: C.primary }}>brunch.co.kr/@me · 그로스 해킹 A-Z 시리즈</div>
        </div>

        <div style={{ width: "100%", background: C.amberLight, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 8 }}>✦ 그로스 해킹 A-Z 시리즈 — 4/5편</div>
          <ProgressBar value={4} max={5} color={C.amber} />
          <div style={{ fontSize: 11, color: C.amber, marginTop: 8 }}>1편만 더 발행하면 전자책으로 묶을 수 있어요!</div>
        </div>

        <button style={{ ...s.btnOutline, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
          ↗ 브런치에서 보기
        </button>
        <button style={s.btnPrimary} onClick={() => navigate("new")}>다음 기록 시작하기</button>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", color: C.textHint, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>홈으로 돌아가기</button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [params, setParams] = useState({});

  const navigate = (to, p = {}) => { setParams(p); setScreen(to); };

  const screenMap = {
    home: <HomeScreen navigate={navigate} />,
    portfolio: <PortfolioScreen navigate={navigate} />,
    new: <NewScreen navigate={navigate} />,
    detail: <DetailScreen navigate={navigate} log={params.log || LOGS[0]} />,
    draft: <DraftScreen navigate={navigate} log={params.log || LOGS[0]} />,
    success: <SuccessScreen navigate={navigate} />,
  };

  const allScreens = [
    { key: "home", label: "S01 홈" },
    { key: "new", label: "S02 새 기록" },
    { key: "detail", label: "S03 상세" },
    { key: "draft", label: "S04 AI 초안" },
    { key: "success", label: "S05 발행 완료" },
    { key: "portfolio", label: "+ 포트폴리오" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 12, letterSpacing: "0.5px" }}>
        LearnLog — 인터랙티브 프로토타입 v1.1 (크리에이터 타겟)
      </div>
      <div style={{ border: "8px solid #222", borderRadius: 40, overflow: "hidden", background: "#222" }}>
        {screenMap[screen] || screenMap.home}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {allScreens.map(({ key, label }) => (
          <button key={key} onClick={() => navigate(key)} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, border: `1px solid ${screen === key ? "#5B4FE8" : "#ddd"}`, background: screen === key ? "#EEEDFE" : "transparent", color: screen === key ? "#3C3489" : "#666", cursor: "pointer", fontWeight: screen === key ? 600 : 400 }}>{label}</button>
        ))}
      </div>
    </div>
  );
}
