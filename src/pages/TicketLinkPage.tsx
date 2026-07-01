import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PrimaryButton from "../components/PrimaryButton";
import TicketStack from "../components/TicketStack";
import { useTicketFromHash } from "../lib/useTicketFromHash";

interface Props {
  mode: "share" | "view";
}

export default function TicketLinkPage({ mode }: Props) {
  const { data, error } = useTicketFromHash();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-app flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="font-sans text-lg">{error}</p>
          <PrimaryButton onClick={() => navigate("/create")}>create your voiceme</PrimaryButton>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { bundle, audioBuffers } = data;
  const audioList = bundle.items.map((item, i) => {
    const bytes = audioBuffers[i];
    return bytes && item.audioType ? { bytes, mimeType: item.audioType, duration: item.duration, peaks: item.peaks } : null;
  });
  const displayName = bundle.name || "your name";

  const getShareUrl = () => `${window.location.origin}/t#${window.location.hash.slice(1)}`;

  const handleShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "voicemeup", text: "You have a new voiceme!", url });
        setSent(true);
      } catch {
        /* user cancelled share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setSent(true);
    } catch {
      window.prompt("Copy this link:", url);
      setSent(true);
    }
  };

  const handleBack = () => {
    navigate("/create", { state: { bundle, audioBuffers } });
  };

  const handleCreateNew = () => navigate("/create");

  const topLabel = mode === "share" ? "Your inbox" : "your voiceme";

  let primaryLabel: string;
  let primaryAction: () => void;
  if (mode === "view") {
    primaryLabel = "create a reply voiceme";
    primaryAction = handleCreateNew;
  } else if (sent) {
    primaryLabel = "create new voiceme";
    primaryAction = handleCreateNew;
  } else {
    primaryLabel = "send this as a link";
    primaryAction = handleShare;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-app flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center px-6 pb-10 pt-8 text-center">
        <p className="font-sans text-sm text-ink/50">{topLabel}</p>

        <h1 className="mt-2 font-display text-5xl leading-[0.95] sm:text-6xl">FROM:FROM:</h1>
        <p className="mt-3 font-mono text-2xl">{displayName}</p>
        {bundle.items.length > 1 && (
          <p className="mt-1 font-mono text-xs text-ink/50">
            {activeIndex + 1} of {bundle.items.length} voicemes
          </p>
        )}

        <div className="mt-8 w-full">
          <TicketStack
            items={bundle.items}
            audioList={audioList}
            dateStr={bundle.date}
            activeIndex={activeIndex}
            onIndexChange={setActiveIndex}
          />
        </div>

        <div className="mt-10 flex w-full flex-col gap-3">
          {mode === "share" && sent && (
            <p className="font-mono text-xs text-ink/50">✓ link copied — ready to send</p>
          )}
          <PrimaryButton onClick={primaryAction}>{primaryLabel}</PrimaryButton>
          {mode === "share" && !sent && (
            <PrimaryButton variant="outline" onClick={handleBack}>
              ‹ back, change something
            </PrimaryButton>
          )}
        </div>
      </main>
    </div>
  );
}
