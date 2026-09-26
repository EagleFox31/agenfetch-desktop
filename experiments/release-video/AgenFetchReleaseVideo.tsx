import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import {agenFetchRelease} from "./data/agenfetch";

const BG = "#121727";
const PANEL = "#252b43";
const PANEL_2 = "#303750";
const TEXT = "#f7f2e8";
const MUTED = "#9aa4bc";
const GOLD = "#eab14a";
const TEAL = "#35d6c9";
const ROSE = "#b33e68";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const fade = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], clamp);

function Glow() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          top: -260,
          left: -240,
          background: "radial-gradient(circle, rgba(53,214,201,.22), rgba(53,214,201,0) 68%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: "50%",
          bottom: -300,
          right: -260,
          background: "radial-gradient(circle, rgba(179,62,104,.2), rgba(179,62,104,0) 70%)"
        }}
      />
    </>
  );
}

function BrandLockup({small = false}: {small?: boolean}) {
  return (
    <div style={{display: "flex", alignItems: "center", gap: small ? 18 : 28}}>
      <Img
        src={staticFile("agenfetch-mark.svg")}
        style={{width: small ? 58 : 108, height: small ? 58 : 108, borderRadius: small ? 16 : 28}}
      />
      <div>
        <div
          style={{
            color: TEXT,
            fontSize: small ? 34 : 64,
            fontWeight: 800,
            letterSpacing: "-0.05em"
          }}
        >
          AgenFetch
        </div>
        <div style={{color: MUTED, fontSize: small ? 18 : 27, marginTop: 3}}>
          Desktop · beta {agenFetchRelease.version}
        </div>
      </div>
    </div>
  );
}

function Intro() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 92}});
  const opacity = interpolate(frame, [0, 12, 128, 150], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        opacity,
        padding: "150px 92px 120px",
        justifyContent: "space-between"
      }}
    >
      <div style={{transform: `translateY(${interpolate(enter, [0, 1], [48, 0])}px)`}}>
        <BrandLockup />
        <div
          style={{
            marginTop: 84,
            color: TEAL,
            fontSize: 24,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".16em"
          }}
        >
          Release {agenFetchRelease.version}
        </div>
        <h1
          style={{
            margin: "28px 0 0",
            maxWidth: 850,
            color: TEXT,
            fontSize: 92,
            lineHeight: 0.98,
            letterSpacing: "-0.06em"
          }}
        >
          {agenFetchRelease.releaseTitle}.
        </h1>
        <p
          style={{
            maxWidth: 820,
            margin: "34px 0 0",
            color: MUTED,
            fontSize: 37,
            lineHeight: 1.35,
            letterSpacing: "-0.02em"
          }}
        >
          {agenFetchRelease.subheadline}
        </p>
      </div>

      <div style={{display: "flex", gap: 18, alignItems: "center"}}>
        <div style={{height: 4, width: 76, borderRadius: 999, background: GOLD}} />
        <span style={{color: MUTED, fontSize: 24}}>{agenFetchRelease.platform}</span>
      </div>
    </AbsoluteFill>
  );
}

function LanguageChip({value, active}: {value: string; active?: boolean}) {
  return (
    <div
      style={{
        padding: "15px 19px",
        borderRadius: 14,
        border: `1px solid ${active ? "rgba(53,214,201,.5)" : "rgba(255,255,255,.08)"}`,
        background: active ? "rgba(53,214,201,.14)" : "#262c43",
        color: active ? "#8ff1e8" : "#8d97af",
        fontSize: 23,
        fontWeight: 800
      }}
    >
      {value}
    </div>
  );
}

function AppMockup() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 18, stiffness: 100}});
  const progress = interpolate(frame, [30, 150], [24, 96], clamp);

  return (
    <div
      style={{
        width: 900,
        borderRadius: 32,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.1)",
        background: PANEL,
        boxShadow: "0 50px 100px rgba(0,0,0,.38)",
        transform: `scale(${interpolate(pop, [0, 1], [0.92, 1])}) translateY(${interpolate(pop, [0, 1], [40, 0])}px)`
      }}
    >
      <div
        style={{
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          background: "#20253a",
          borderBottom: "1px solid rgba(255,255,255,.07)"
        }}
      >
        <div style={{display: "flex", gap: 9}}>
          {[GOLD, "#69748f", "#69748f"].map((c, i) => (
            <div key={i} style={{width: 12, height: 12, borderRadius: 99, background: c}} />
          ))}
        </div>
        <div style={{color: "#9ca6bc", fontSize: 18}}>AgenFetch Desktop — beta 0.3.1</div>
        <div style={{width: 60}} />
      </div>

      <div style={{display: "flex", minHeight: 770}}>
        <aside style={{width: 230, padding: "30px 20px", background: "#1e2337"}}>
          <BrandLockup small />
          <div style={{marginTop: 48, color: "#66718b", fontSize: 17, letterSpacing: ".12em"}}>
            ESPACE LOCAL
          </div>
          {["Télécharger", "Historique", "Sous-titres", "À propos"].map((item) => (
            <div
              key={item}
              style={{
                marginTop: 12,
                padding: "17px 18px",
                borderRadius: 13,
                color: item === "Sous-titres" ? TEXT : "#9ba5bb",
                background: item === "Sous-titres" ? "rgba(255,255,255,.08)" : "transparent",
                boxShadow: item === "Sous-titres" ? `inset 4px 0 ${GOLD}` : undefined,
                fontSize: 22,
                fontWeight: item === "Sous-titres" ? 700 : 500
              }}
            >
              {item}
            </div>
          ))}
          <div
            style={{
              marginTop: 300,
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,.07)",
              color: "#6f7a93",
              fontSize: 16,
              lineHeight: 1.55
            }}
          >
            <span style={{color: GOLD}}>●</span> Tout reste sur ce PC
            <br />
            yt-dlp · FFmpeg
          </div>
        </aside>

        <div style={{flex: 1, padding: "38px 34px", background: PANEL_2}}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>
              <div style={{color: TEXT, fontSize: 36, fontWeight: 800}}>Trouver des sous-titres</div>
              <div style={{marginTop: 7, color: MUTED, fontSize: 20}}>Le bon épisode. La bonne langue.</div>
            </div>
            <div
              style={{
                height: 38,
                padding: "9px 14px",
                borderRadius: 999,
                color: GOLD,
                background: "rgba(234,177,74,.1)",
                fontSize: 16,
                fontWeight: 800
              }}
            >
              BETA 0.3.1
            </div>
          </div>

          <div
            style={{
              marginTop: 34,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: 20,
              borderRadius: 16,
              background: "#363d5b",
              border: "1px solid #48516f"
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                color: TEAL,
                background: "#252a40",
                fontSize: 28
              }}
            >
              ▶
            </div>
            <div style={{flex: 1}}>
              <div style={{color: "#7d88a3", fontSize: 15, letterSpacing: ".1em"}}>FICHIER LOCAL</div>
              <div style={{marginTop: 7, color: TEXT, fontSize: 22, fontWeight: 700}}>
                The Last Horizon.S02E03.1080p.mkv
              </div>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                color: "#c4cada",
                background: "#252a40",
                fontSize: 17
              }}
            >
              Choisir
            </div>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1.4fr .6fr", gap: 16, marginTop: 18}}>
            {[
              ["TITRE DÉTECTÉ", "The Last Horizon"],
              ["ÉPISODE", "S02 · E03"]
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: 15,
                  padding: "18px 20px",
                  background: "#252a40",
                  border: "1px solid #48516f"
                }}
              >
                <div style={{color: "#75809a", fontSize: 14, letterSpacing: ".1em"}}>{label}</div>
                <div style={{marginTop: 8, color: "#dce1ea", fontSize: 21, fontWeight: 700}}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{marginTop: 26, color: "#75809a", fontSize: 15, letterSpacing: ".1em"}}>LANGUES</div>
          <div style={{display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12}}>
            {agenFetchRelease.languages.map((lang, index) => (
              <LanguageChip key={lang} value={lang} active={index < Math.ceil(progress / 18)} />
            ))}
          </div>

          <div
            style={{
              marginTop: 30,
              padding: "20px 22px",
              borderRadius: 16,
              background: "rgba(23,109,100,.16)",
              border: "1px solid rgba(53,214,201,.18)"
            }}
          >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <span style={{color: "#c8d0df", fontSize: 19}}>Recherche multi-catalogues</span>
              <span style={{color: TEAL, fontSize: 18, fontWeight: 800}}>{Math.round(progress)}%</span>
            </div>
            <div style={{height: 7, borderRadius: 999, background: "#20253a", marginTop: 14, overflow: "hidden"}}>
              <div style={{height: "100%", width: `${progress}%`, borderRadius: 999, background: TEAL}} />
            </div>
            <div style={{marginTop: 14, color: "#7e89a4", fontSize: 17}}>
              {agenFetchRelease.providers.join(" · ")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14, 235, 270], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity,
        padding: "120px 76px 110px",
        alignItems: "center"
      }}
    >
      <div style={{width: "100%", marginBottom: 52}}>
        <div style={{color: TEAL, fontSize: 21, fontWeight: 800, letterSpacing: ".14em"}}>NOUVEAU DANS 0.3.1</div>
        <div
          style={{
            marginTop: 16,
            color: TEXT,
            fontSize: 61,
            lineHeight: 1.04,
            fontWeight: 850,
            letterSpacing: "-0.045em"
          }}
        >
          Une recherche. Sept langues.
        </div>
      </div>
      <AppMockup />
    </AbsoluteFill>
  );
}

function MetricsScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, 170, 210], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity, padding: "150px 80px 120px"}}>
      <div style={{color: GOLD, fontSize: 21, fontWeight: 800, letterSpacing: ".14em"}}>CE QUI CHANGE</div>
      <div
        style={{
          marginTop: 22,
          maxWidth: 850,
          color: TEXT,
          fontSize: 72,
          lineHeight: 1.02,
          fontWeight: 850,
          letterSpacing: "-0.055em"
        }}
      >
        Plus de portée.
        <br />
        Sans lâcher le local-first.
      </div>
      <div style={{display: "grid", gap: 20, marginTop: 68}}>
        {agenFetchRelease.highlights.map((item, index) => {
          const local = frame - index * 12;
          const p = spring({frame: Math.max(0, local), fps: 30, config: {damping: 18}});
          return (
            <div
              key={item.value}
              style={{
                padding: "28px 30px",
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.04)",
                transform: `translateX(${interpolate(p, [0, 1], [80, 0])}px)`,
                opacity: p,
                display: "flex",
                alignItems: "baseline",
                gap: 24
              }}
            >
              <div style={{minWidth: 260, color: index === 0 ? TEAL : index === 1 ? GOLD : "#d88aa5", fontSize: 42, fontWeight: 900}}>
                {item.value}
              </div>
              <div style={{color: "#c4cad8", fontSize: 27}}>{item.label}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 46,
          padding: "22px 26px",
          borderRadius: 18,
          background: "#1d2233",
          color: MUTED,
          fontSize: 22,
          lineHeight: 1.45
        }}
      >
        Les clés SubDL et OpenSubtitles sont chiffrées par le stockage sécurisé Windows.
      </div>
    </AbsoluteFill>
  );
}

function Outro() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 17, stiffness: 95}});
  const opacity = fade(frame, 0, 18);

  return (
    <AbsoluteFill style={{opacity, padding: "145px 88px 118px", justifyContent: "space-between"}}>
      <div style={{transform: `translateY(${interpolate(pop, [0, 1], [40, 0])}px)`}}>
        <BrandLockup />
        <div
          style={{
            marginTop: 82,
            color: TEXT,
            fontSize: 84,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: "-0.06em"
          }}
        >
          AgenFetch {agenFetchRelease.version}
          <br />
          est disponible.
        </div>
        <div
          style={{
            display: "inline-flex",
            marginTop: 48,
            padding: "22px 28px",
            borderRadius: 18,
            background: TEAL,
            color: "#102027",
            fontSize: 28,
            fontWeight: 900
          }}
        >
          Télécharger pour Windows
        </div>
      </div>

      <div>
        <div style={{height: 1, background: "rgba(255,255,255,.09)", marginBottom: 28}} />
        <div style={{color: "#cad0db", fontSize: 24, fontWeight: 700}}>{agenFetchRelease.repo}</div>
        <div style={{marginTop: 10, color: MUTED, fontSize: 21}}>{agenFetchRelease.site}</div>
        <div style={{marginTop: 24, color: "#69748c", fontSize: 17, lineHeight: 1.45}}>
          Pour tes contenus, les contenus libres de droits ou ceux pour lesquels tu disposes d’une autorisation.
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function AgenFetchReleaseVideo() {
  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
        overflow: "hidden"
      }}
    >
      <Glow />
      <Sequence from={0} durationInFrames={160}>
        <Intro />
      </Sequence>
      <Sequence from={140} durationInFrames={280}>
        <ProductScene />
      </Sequence>
      <Sequence from={390} durationInFrames={220}>
        <MetricsScene />
      </Sequence>
      <Sequence from={580} durationInFrames={140}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
}
