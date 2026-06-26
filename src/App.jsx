import { useState, useEffect, useRef } from "react";
import { supabase, isConfigured, uploadImage, uploadAudio } from "./lib/supabase";
import { summarizeText, generateDraft } from "./lib/ai";

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
  red: "#e33",
  tagColors: {
    "마케팅": { bg: "#EEEDFE", text: "#3C3489" },
    "독서": { bg: "#E1F5EE", text: "#085041" },
    "개발": { bg: "#E6F1FB", text: "#0C447C" },
    "디자인": { bg: "#FBEAF0", text: "#72243E" },
  },
};

const s = {
  phone: { width: 375, background: C.white, display: "flex", flexDirection: "column", height: 720, fontFamily: "'Noto Sans KR', sans-serif", position: "relative" },
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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff < 7) return `${diff}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

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
    { id: "courses", label: "강의별", icon: "📚" },
    { id: "portfolio", label: "포트폴리오", icon: "◈" },
  ];
  return (
    <div style={s.tabBar}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => navigate(t.id)}
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

function VoicePanel({ onClose, onDone }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);
  const [processStep, setProcessStep] = useState("");
  const [dotOn, setDotOn] = useState(true);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioBlobRef = useRef(null);
  const finalRef = useRef("");
  const fileInputRef = useRef(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (phase !== "recording") return;
    const iv = setInterval(() => setDotOn(v => !v), 500);
    return () => clearInterval(iv);
  }, [phase]);

  const startRecording = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Chrome 브라우저에서만 음성 인식이 지원됩니다."); return; }

    // MediaRecorder로 오디오 파일 캡처
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("마이크 접근 권한이 필요합니다.");
      return;
    }
    const chunks = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mr.onstop = () => {
      audioBlobRef.current = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorderRef.current = mr;
    audioBlobRef.current = null;
    mr.start();

    // SpeechRecognition으로 실시간 텍스트 변환
    // onend마다 새 인스턴스 생성 — 같은 인스턴스 재사용 시 InvalidStateError 발생
    const startRecognition = () => {
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.continuous = true;
      rec.interimResults = true;
      recognitionRef.current = rec;
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalRef.current += t + " ";
          else interim += t;
        }
        setTranscript(finalRef.current + interim);
      };
      rec.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        isRecordingRef.current = false;
        setPhase("idle");
      };
      rec.onend = () => {
        if (isRecordingRef.current) {
          setTimeout(startRecognition, 150);
        }
      };
      try { rec.start(); } catch {}
    };

    finalRef.current = "";
    isRecordingRef.current = true;
    startRecognition();
    setPhase("recording");
    setTranscript("");
  };

  const stopAll = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const stopAndSummarize = () => {
    stopAll();
    // MediaRecorder.onstop은 비동기이므로 짧게 대기 후 요약 시작
    setTimeout(() => runSummarize(finalRef.current || transcript), 200);
  };

  const runSummarize = async (text) => {
    setTranscript(text);
    setPhase("processing");
    setProgress(0);
    setProcessStep("AI가 핵심 내용을 분석하는 중...");

    let p = 0;
    const iv = setInterval(() => {
      p += 2;
      setProgress(Math.min(p, 85));
      if (p >= 40) setProcessStep("AI가 핵심 내용을 요약하는 중...");
    }, 80);

    try {
      const result = await summarizeText(text);
      clearInterval(iv);
      setProgress(100);
      setTimeout(() => onDone({ points: result.points || [], memo: result.memo || "", audioBlob: audioBlobRef.current }), 300);
    } catch {
      clearInterval(iv);
      const sents = text.replace(/[.!?。]+/g, "|").split("|").map(s => s.trim()).filter(s => s.length > 6);
      setProgress(100);
      setTimeout(() => onDone({
        points: [sents[0] || "", sents[1] || "", sents[2] || ""],
        memo: sents.slice(3, 5).join(" ") || text.slice(0, 100),
        audioBlob: audioBlobRef.current,
      }), 300);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    audioBlobRef.current = file;
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
          points: ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
          memo: "파일에서 추출한 내용을 직접 편집해주세요.",
          audioBlob: file,
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
    <div style={{ background: C.white, borderRadius: 14, border: `1.5px solid ${C.red}`, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: dotOn ? C.red : "transparent", border: `1.5px solid ${C.red}`, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.red }}>녹음 중</span>
        <span style={{ fontSize: 10, color: C.textHint, background: C.bg, padding: "2px 7px", borderRadius: 4, marginLeft: "auto" }}>💾 파일 저장 중</span>
      </div>
      <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", minHeight: 72, fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 12 }}>
        {transcript || <span style={{ color: C.textHint }}>음성을 인식하는 중...</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={stopAndSummarize} style={{ flex: 2, background: C.primary, color: C.white, border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>완료 → AI 요약</button>
        <button onClick={() => { stopAll(); onClose(); }} style={{ flex: 1, background: C.bg, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 0", fontSize: 13, cursor: "pointer" }}>취소</button>
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

function HomeScreen({ logs, series, navigate }) {
  const seriesWithCount = series.map(ser => ({
    ...ser,
    count: logs.filter(l => l.series_id === ser.id).length,
  }));
  const publishedCount = logs.filter(l => l.published).length;
  const recentLogs = logs.slice(0, 10);

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
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{publishedCount}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>총 발행 글</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{logs.length}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>총 기록</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{series.length}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>진행 중 시리즈</div>
            </div>
          </div>
        </div>

        {seriesWithCount.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", marginBottom: 8, textTransform: "uppercase" }}>진행 중 시리즈</div>
            {seriesWithCount.map(ser => (
              <div key={ser.id} style={{ ...s.card, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, background: ser.color, color: ser.text_color, padding: "2px 7px", borderRadius: 4, display: "inline-block", marginBottom: 5 }}>시리즈</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ser.name}</div>
                  </div>
                  <span style={{ fontSize: 12, color: C.textHint, fontWeight: 500 }}>{ser.count}/{ser.goal}편</span>
                </div>
                <ProgressBar value={ser.count} max={ser.goal} color={ser.text_color} />
                {ser.count >= ser.goal - 1 && (
                  <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, marginTop: 6 }}>✦ {ser.goal}편 완성 시 전자책 묶기 가능해요</div>
                )}
              </div>
            ))}
          </>
        )}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", margin: "14px 0 8px", textTransform: "uppercase" }}>최근 기록</div>
        {recentLogs.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.textHint, fontSize: 13 }}>
            아직 기록이 없어요.<br />+ 버튼으로 첫 번째 기록을 남겨보세요!
          </div>
        )}
        {recentLogs.map(log => {
          const ser = series.find(s => s.id === log.series_id);
          return (
            <div key={log.id} style={s.card} onClick={() => navigate("detail", { log })}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <span style={s.tag(log.tag)}>{log.tag}</span>
                {ser && <span style={{ fontSize: 9, color: C.textHint, background: C.bg, padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>{ser.name}</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{log.title}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.textHint }}>{formatDate(log.created_at)} · {log.source || ""}</span>
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

function CoursesScreen({ logs, navigate }) {
  const [expandedTitle, setExpandedTitle] = useState(null);

  // 강의/스터디 제목별 그룹핑 — 최근 기록 순 정렬
  const grouped = {};
  logs.forEach(log => {
    const key = log.title || "제목 없음";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });
  // 각 그룹의 최신 created_at 기준으로 정렬
  const titles = Object.keys(grouped).sort((a, b) => {
    const latestA = grouped[a][0]?.created_at || "";
    const latestB = grouped[b][0]?.created_at || "";
    return latestB.localeCompare(latestA);
  });

  return (
    <div style={s.phone}>
      <StatusBar />
      <div style={{ ...s.appBar, justifyContent: "space-between" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>강의별 기록</span>
        <span style={{ fontSize: 11, color: C.textHint }}>{titles.length}개 강의</span>
      </div>
      <div style={s.scroll}>
        {titles.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.textHint, fontSize: 13, lineHeight: 2 }}>
            아직 기록이 없어요.<br />+ 버튼으로 첫 기록을 남겨보세요.
          </div>
        )}
        {titles.map(title => {
          const sessions = grouped[title];
          const isExpanded = expandedTitle === title;
          const audioCount = sessions.filter(l => l.audio_url).length;
          const tags = [...new Set(sessions.map(l => l.tag).filter(Boolean))];
          const latestDate = sessions[0]?.created_at;

          return (
            <div key={title} style={{ marginBottom: 10 }}>
              {/* 강의 요약 카드 */}
              <div
                onClick={() => setExpandedTitle(isExpanded ? null : title)}
                style={{ background: C.white, borderRadius: 14, padding: "14px 16px", border: `0.5px solid ${isExpanded ? C.primary : C.border}`, cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, paddingRight: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4, marginBottom: 5 }}>{title}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {tags.map(t => <span key={t} style={s.tag(t)}>{t}</span>)}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: isExpanded ? C.primary : C.textHint, flexShrink: 0 }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.textHint }}>
                  <span>📋 {sessions.length}회 기록</span>
                  {audioCount > 0 && <span>🎙 {audioCount}개 녹음</span>}
                  <span style={{ marginLeft: "auto" }}>{formatDate(latestDate)}</span>
                </div>
              </div>

              {/* 펼쳐진 세션 목록 */}
              {isExpanded && (
                <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: `2px solid ${C.primary}` }}>
                  {sessions.map((log, idx) => (
                    <div
                      key={log.id}
                      style={{ background: C.white, borderRadius: 10, padding: "12px 14px", marginBottom: 6, border: `0.5px solid ${C.border}` }}
                    >
                      {/* 세션 헤더 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.primaryDark, flexShrink: 0 }}>
                          {sessions.length - idx}
                        </div>
                        <span style={{ fontSize: 12, color: C.textSub, fontWeight: 500 }}>{formatDate(log.created_at)}</span>
                        {log.source && <span style={{ fontSize: 11, color: C.textHint }}>· {log.source}</span>}
                        {log.published && (
                          <span style={{ marginLeft: "auto", fontSize: 10, color: C.green, fontWeight: 600, background: C.greenLight, padding: "1px 6px", borderRadius: 4 }}>발행</span>
                        )}
                      </div>

                      {/* 녹음 파일 */}
                      {log.audio_url ? (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: C.textHint, marginBottom: 4 }}>🎙 녹음</div>
                          <audio
                            controls
                            src={log.audio_url}
                            style={{ width: "100%", height: 32 }}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: C.textHint, marginBottom: 6 }}>녹음 없음</div>
                      )}

                      {/* 핵심 포인트 */}
                      {(log.points || []).length > 0 && (
                        <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, marginBottom: 8 }}>
                          {(log.points || []).slice(0, 2).map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: 6 }}>
                              <span style={{ color: C.primary, flexShrink: 0 }}>·</span>
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => navigate("detail", { log })}
                        style={{ background: C.primaryLight, border: "none", color: C.primaryDark, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}
                      >
                        상세 보기 →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: 70 }} />
      </div>
      <button onClick={() => navigate("new")} style={{ position: "absolute", bottom: 76, right: 20, width: 52, height: 52, background: C.primary, border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 26, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>＋</button>
      <TabBar active="courses" navigate={navigate} />
    </div>
  );
}

function PortfolioScreen({ logs, series, navigate }) {
  const publishedLogs = logs.filter(l => l.published);
  const publishRate = logs.length > 0 ? Math.round((publishedLogs.length / logs.length) * 100) : 0;
  const seriesWithCount = series.map(ser => ({
    ...ser,
    count: logs.filter(l => l.series_id === ser.id).length,
  }));

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
            { label: "총 발행", value: `${publishedLogs.length}편`, color: C.primary },
            { label: "총 기록", value: `${logs.length}건`, color: C.textSub },
            { label: "발행률", value: `${publishRate}%`, color: C.green },
          ].map(m => (
            <div key={m.label} style={{ flex: 1, background: C.white, borderRadius: 12, padding: "12px 10px", border: `0.5px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, color: C.textHint, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {seriesWithCount.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", marginBottom: 8, textTransform: "uppercase" }}>시리즈 현황</div>
            {seriesWithCount.map(ser => (
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
          </>
        )}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", margin: "14px 0 8px", textTransform: "uppercase" }}>발행 이력</div>
        {publishedLogs.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.textHint, fontSize: 13 }}>아직 발행된 글이 없어요.</div>
        )}
        {publishedLogs.map(log => (
          <div key={log.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("detail", { log })}>
            <div style={{ flex: 1 }}>
              <span style={s.tag(log.tag)}>{log.tag}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{log.title}</div>
              <div style={{ fontSize: 11, color: C.textHint, marginTop: 3 }}>{formatDate(log.created_at)} · 브런치</div>
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

function NewScreen({ series, navigate, onSave }) {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [points, setPoints] = useState(["", "", ""]);
  const [memo, setMemo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [tag, setTag] = useState("마케팅");
  const [seriesId, setSeriesId] = useState(series[0]?.id || null);
  const [showVoice, setShowVoice] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const imageFileRef = useRef(null);
  const tags = ["마케팅", "독서", "개발", "디자인"];

  const handleVoiceDone = ({ points: p, memo: m, audioBlob: blob }) => {
    setPoints([p[0] || "", p[1] || "", p[2] || ""]);
    setMemo(m || "");
    setAutoFilled(true);
    setShowVoice(false);
    if (blob) {
      setAudioBlob(blob);
      setAudioPreviewUrl(URL.createObjectURL(blob));
    }
  };

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      alert("이미지 업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { alert("제목을 입력해주세요."); return; }
    setSaving(true);
    try {
      let audio_url = null;
      if (audioBlob) {
        audio_url = await uploadAudio(audioBlob);
      }
      await onSave({
        title: title.trim(),
        source: source.trim() || null,
        points: points.filter(p => p.trim()),
        memo: memo.trim() || null,
        image_url: imageUrl.trim() || null,
        reference_url: referenceUrl.trim() || null,
        audio_url,
        tag,
        series_id: seriesId || null,
        published: false,
      });
      navigate("home");
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.phone}>
      <StatusBar />
      <AppBar
        left={<IconBtn icon="✕" onClick={() => navigate("home")} />}
        title="새 기록"
        right={null}
      />
      <div style={s.scroll}>
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
          <div style={{ background: C.greenLight, borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: C.green, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✓ AI가 핵심 포인트와 메모를 자동으로 채웠어요</span>
            <button onClick={() => setShowVoice(true)} style={{ background: "none", border: "none", color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0 }}>다시</button>
          </div>
        )}
        {audioPreviewUrl && (
          <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>🎙 녹음 파일 (저장 시 함께 보관)</div>
            <audio controls src={audioPreviewUrl} style={{ width: "100%", height: 36 }} />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>강의 / 스터디 제목 *</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="오늘 배운 강의 이름" />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>날짜</label>
            <input style={s.input} defaultValue={new Date().toLocaleDateString("ko-KR")} readOnly />
          </div>
          <div style={{ flex: 1 }}>
            <label style={s.label}>출처</label>
            <input style={s.input} value={source} onChange={e => setSource(e.target.value)} placeholder="인프런, 유데미..." />
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
            {series.map(ser => (
              <button key={ser.id} onClick={() => setSeriesId(ser.id)} style={{ background: seriesId === ser.id ? C.primaryLight : C.white, border: `1px solid ${seriesId === ser.id ? C.primary : C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: 13, color: seriesId === ser.id ? C.primaryDark : C.text, fontWeight: seriesId === ser.id ? 600 : 400 }}>{ser.name}</span>
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
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>
            느낀 점 / 콘텐츠 각도
            {autoFilled && <span style={{ fontSize: 10, color: C.green, fontWeight: 600, marginLeft: 6 }}>✦ AI 자동완성</span>}
          </label>
          <textarea style={{ ...s.input, height: 80, resize: "none", lineHeight: 1.6, background: autoFilled && memo ? C.primaryLight : C.white }} value={memo} onChange={e => setMemo(e.target.value)} placeholder="독자에게 어떻게 풀어낼지, 어떤 사례와 연결할지..." />
        </div>

        <button onClick={() => setShowExtra(v => !v)} style={{ width: "100%", background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textHint, cursor: "pointer", marginBottom: showExtra ? 10 : 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span>{showExtra ? "▲" : "▼"}</span>
          <span>이미지 · 링크 추가 (선택)</span>
        </button>
        {showExtra && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>이미지</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input style={{ ...s.input, flex: 1, marginBottom: 0 }} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://... 이미지 URL" />
                <button onClick={() => imageFileRef.current?.click()} disabled={uploading} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 12px", fontSize: 12, color: C.textSub, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {uploading ? "업로드 중..." : "📁 파일"}
                </button>
                <input ref={imageFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
              </div>
              {imageUrl && <img src={imageUrl} alt="미리보기" style={{ width: "100%", borderRadius: 8, maxHeight: 150, objectFit: "cover" }} onError={() => setImageUrl("")} />}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>관련 링크 / URL</label>
              <input style={s.input} value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} placeholder="참고 자료나 출처 URL" />
            </div>
          </>
        )}
      </div>
      <div style={{ padding: "10px 20px 16px", background: C.white, borderTop: `0.5px solid ${C.border}`, flexShrink: 0 }}>
        <button style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

function DetailScreen({ navigate, log, series, onDelete }) {
  const ser = series.find(s => s.id === log.series_id);
  const serCount = ser ? 0 : 0;

  const handleDelete = async () => {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await onDelete(log.id);
    navigate("home");
  };

  return (
    <div style={s.phone}>
      <StatusBar />
      <AppBar
        left={<IconBtn icon="←" onClick={() => navigate("home")} />}
        title="기록 상세"
        right={<IconBtn icon="🗑" onClick={handleDelete} color={C.textHint} />}
      />
      <div style={s.scroll}>
        <div style={{ ...s.card, cursor: "default", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={s.tag(log.tag)}>{log.tag}</span>
            {ser && <span style={{ fontSize: 9, color: C.textHint, background: C.bg, padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>{ser.name}</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5, lineHeight: 1.4 }}>{log.title}</div>
          <div style={{ fontSize: 12, color: C.textHint }}>{formatDate(log.created_at)} · {log.source || ""}</div>
          {log.reference_url && (
            <a href={log.reference_url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10, fontSize: 12, color: C.primary, textDecoration: "underline" }}>
              참고 링크 보기
            </a>
          )}
        </div>
        {log.image_url && (
          <div style={{ ...s.card, padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <img src={log.image_url} alt="대표 이미지" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 200 }} />
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", marginBottom: 10, textTransform: "uppercase" }}>핵심 포인트</div>
        {(log.points || []).map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{p}</span>
          </div>
        ))}

        <div style={{ fontSize: 11, fontWeight: 600, color: C.textHint, letterSpacing: "0.5px", margin: "16px 0 8px", textTransform: "uppercase" }}>콘텐츠 각도 메모</div>
        <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, marginBottom: 24, background: C.white, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.border}` }}>{log.memo || "메모 없음"}</div>

        <button style={s.btnPrimary} onClick={() => navigate("draft", { log })}>
          ✦ AI로 브런치 초안 생성
        </button>
        <button style={s.btnOutline}>직접 작성하기</button>
      </div>
    </div>
  );
}

function DraftScreen({ navigate, log, series, onPublish }) {
  const [generating, setGenerating] = useState(true);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [platform, setPlatform] = useState("브런치");
  const [seriesName, setSeriesName] = useState("");
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("edit");
  const [publishing, setPublishing] = useState(false);

  const ser = series.find(s => s.id === log.series_id);

  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += 3;
      setProgress(Math.min(p, 90));
      if (p >= 90) clearInterval(iv);
    }, 60);

    generateDraft(log)
      .then(result => {
        clearInterval(iv);
        setProgress(100);
        setEditTitle(result.title || log.title);
        setEditBody(result.body || "");
        setGenerating(false);
      })
      .catch(() => {
        clearInterval(iv);
        setProgress(100);
        setEditTitle(log.title);
        setEditBody(`${log.title}에 대해 배운 내용을 정리했습니다.\n\n${(log.points || []).join("\n\n")}\n\n${log.memo || ""}`);
        setGenerating(false);
      });

    setSeriesName(ser?.name || "없음");
    return () => clearInterval(iv);
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish(log.id);
      navigate("success", { log: { ...log, published: true }, draftTitle: editTitle });
    } catch (err) {
      alert("발행 실패: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

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
          ? <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setGenerating(true); setProgress(0); }}>재생성</span>
          : <span onClick={() => setTab("edit")} style={{ fontSize: 12, color: C.textSub, cursor: "pointer" }}>편집</span>
        }
      />
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
                <select style={{ ...s.input }} value={seriesName} onChange={e => setSeriesName(e.target.value)}>
                  <option>{ser?.name || "없음"}</option>
                  <option>없음</option>
                </select>
              </div>
            </div>
            <button style={s.btnPrimary} onClick={() => setTab("preview")}>미리보기로 검토하기 →</button>
          </>
        ) : (
          <>
            <div style={{ background: C.white, borderRadius: 14, padding: "18px 16px", marginBottom: 12, border: `0.5px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                <span style={s.tag(log.tag)}>{log.tag}</span>
                <span style={{ fontSize: 10, color: C.textHint }}>{seriesName}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1.45, marginBottom: 14 }}>{editTitle}</div>
              {log.image_url && (
                <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                  <img src={log.image_url} alt="대표 이미지" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 210 }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: `0.5px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.primaryDark, flexShrink: 0 }}>이</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>이유진</div>
                  <div style={{ fontSize: 11, color: C.textHint }}>{new Date().toLocaleDateString("ko-KR")} · {platform}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>
                {editBody.split("\n").map((line, i) =>
                  line.trim() ? <p key={i} style={{ margin: "0 0 14px 0" }}>{line}</p> : <br key={i} />
                )}
              </div>
              {log.reference_url && (
                <div style={{ marginTop: 16, fontSize: 13, color: C.primary }}>
                  참고 링크: <a href={log.reference_url} target="_blank" rel="noreferrer" style={{ color: C.primary, textDecoration: "underline" }}>{log.reference_url}</a>
                </div>
              )}
              <div style={{ display: "flex", gap: 16, paddingTop: 14, borderTop: `0.5px solid ${C.border}`, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: C.textHint }}>♡ 좋아요</span>
                <span style={{ fontSize: 12, color: C.textHint }}>✎ 댓글</span>
                <span style={{ fontSize: 12, color: C.textHint, marginLeft: "auto" }}>↗ 공유</span>
              </div>
            </div>

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
              style={{ ...s.btnPrimary, opacity: (allClear && !publishing) ? 1 : 0.5 }}
              onClick={handlePublish}
              disabled={!allClear || publishing}
            >{publishing ? "발행 중..." : `${platform}에 발행하기 →`}</button>
            <button style={s.btnOutline} onClick={() => setTab("edit")}>수정하러 돌아가기</button>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ navigate, log, draftTitle, series }) {
  const ser = series.find(s => s.id === log?.series_id);
  const serCount = 0;

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
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{draftTitle || log?.title}</div>
          {ser && <div style={{ fontSize: 12, color: C.primary }}>brunch.co.kr/@me · {ser.name} 시리즈</div>}
        </div>

        {ser && (
          <div style={{ width: "100%", background: C.amberLight, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 8 }}>✦ {ser.name} 시리즈</div>
            <div style={{ fontSize: 11, color: C.amber }}>계속 발행하면 전자책으로 묶을 수 있어요!</div>
          </div>
        )}

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
  const [logs, setLogs] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = (to, p = {}) => { setParams(p); setScreen(to); };

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    if (!isConfigured) {
      loadDemoData();
      setLoading(false);
      return;
    }
    try {
      const [logsRes, seriesRes] = await Promise.all([
        supabase.from("logs").select("*").order("created_at", { ascending: false }),
        supabase.from("series").select("*").order("created_at"),
      ]);
      if (logsRes.error) throw logsRes.error;
      if (seriesRes.error) throw seriesRes.error;
      setLogs(logsRes.data || []);
      setSeries(seriesRes.data || []);
    } catch (e) {
      console.warn("Supabase 연결 실패, 샘플 데이터 사용:", e.message);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  }

  function loadDemoData() {
    setSeries([
      { id: "demo-1", name: "그로스 해킹 A-Z", goal: 5, color: "#EEEDFE", text_color: "#3C3489" },
      { id: "demo-2", name: "린 스타트업 독서", goal: 4, color: "#E1F5EE", text_color: "#085041" },
    ]);
    setLogs([
      { id: "demo-log-1", tag: "마케팅", title: "그로스 해킹 — 퍼널 분석 기초", source: "인프런", created_at: new Date(Date.now() - 86400000).toISOString(), published: true, series_id: "demo-1", points: ["AARRR 퍼널의 각 단계별 역할과 지표 설정 방법", "활성화율이 리텐션보다 먼저 해결되어야 하는 이유", "코호트 분석으로 이탈 구간을 찾는 실전 방법"], memo: "클라이언트 제안서에 바로 쓸 수 있는 내용." },
      { id: "demo-log-2", tag: "독서", title: "린 스타트업 — 3장 검증된 학습", source: "독서 모임", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), published: false, series_id: "demo-2", points: ["MVP는 최소 기능이 아니라 최소 학습 도구", "허영 지표 vs 실행 지표의 차이", "피벗의 기준: 전략 변경이지 실패가 아님"], memo: "독자들이 공감할 만한 창업 착각 시리즈로 이어갈 수 있겠다." },
    ]);
  }

  async function handleSave(logData) {
    if (!isConfigured) {
      const newLog = { ...logData, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
      setLogs(prev => [newLog, ...prev]);
      return;
    }
    const { data, error } = await supabase.from("logs").insert([logData]).select();
    if (error) throw error;
    setLogs(prev => [data[0], ...prev]);
  }

  async function handleDelete(logId) {
    if (!isConfigured) {
      setLogs(prev => prev.filter(l => l.id !== logId));
      return;
    }
    const { error } = await supabase.from("logs").delete().eq("id", logId);
    if (error) throw error;
    setLogs(prev => prev.filter(l => l.id !== logId));
  }

  async function handlePublish(logId) {
    if (!isConfigured) {
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, published: true } : l));
      return;
    }
    const { error } = await supabase.from("logs").update({ published: true }).eq("id", logId);
    if (error) throw error;
    setLogs(prev => prev.map(l => l.id === logId ? { ...l, published: true } : l));
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12 }}>
        <div style={{ fontSize: 28 }}>✦</div>
        <div style={{ fontSize: 14, color: "#555" }}>LearnLog 불러오는 중...</div>
      </div>
    );
  }

  const screenMap = {
    home: <HomeScreen logs={logs} series={series} navigate={navigate} />,
    courses: <CoursesScreen logs={logs} navigate={navigate} />,
    portfolio: <PortfolioScreen logs={logs} series={series} navigate={navigate} />,
    new: <NewScreen series={series} navigate={navigate} onSave={handleSave} />,
    detail: <DetailScreen navigate={navigate} log={params.log || logs[0] || {}} series={series} onDelete={handleDelete} />,
    draft: <DraftScreen navigate={navigate} log={params.log || logs[0] || {}} series={series} onPublish={handlePublish} />,
    success: <SuccessScreen navigate={navigate} log={params.log} draftTitle={params.draftTitle} series={series} />,
  };

  const allScreens = [
    { key: "home", label: "S01 홈" },
    { key: "new", label: "S02 새 기록" },
    { key: "detail", label: "S03 상세" },
    { key: "draft", label: "S04 AI 초안" },
    { key: "success", label: "S05 발행 완료" },
    { key: "courses", label: "+ 강의별" },
    { key: "portfolio", label: "+ 포트폴리오" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 12, letterSpacing: "0.5px" }}>
        LearnLog — 인터랙티브 프로토타입 v2.0 (크리에이터 타겟)
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
