import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PrimaryButton from "../components/PrimaryButton";
import TicketStack from "../components/TicketStack";
import DrawingCanvas from "../components/DrawingCanvas";
import AudioRecorder, { type RecordedAudio } from "../components/AudioRecorder";
import PhotoCapture, { type CapturedPhoto } from "../components/PhotoCapture";
import { encodeTicket, randomTicketId } from "../lib/ticketCodec";
import { COLOR_HEX, TICKET_COLORS, type DrawPath, type TicketBundle, type TicketColor, type TicketItem } from "../lib/types";

interface Draft {
  bundle: TicketBundle;
  audioBuffers: (Uint8Array | null)[];
  photoBuffers: (Uint8Array | null)[];
}

interface ItemDraft {
  id: string;
  color: TicketColor;
  paths: DrawPath[];
  audio: RecordedAudio | null;
  photo: CapturedPhoto | null;
}

const MAX_ITEMS = 6;

function blankItem(): ItemDraft {
  return { id: randomTicketId(), color: "pink", paths: [], audio: null, photo: null };
}

function draftItemsFrom(draft: Draft): ItemDraft[] {
  return draft.bundle.items.map((item, i) => ({
    id: item.id,
    color: item.color,
    paths: item.paths,
    audio:
      draft.audioBuffers[i] && item.audioType
        ? { bytes: draft.audioBuffers[i]!, mimeType: item.audioType, duration: item.duration, peaks: item.peaks }
        : null,
    photo: draft.photoBuffers[i] && item.photoType ? { bytes: draft.photoBuffers[i]!, mimeType: item.photoType } : null,
  }));
}

export default function Create() {
  const navigate = useNavigate();
  const draft = (useLocation().state as Draft | null) ?? null;

  const [items, setItems] = useState<ItemDraft[]>(() => (draft ? draftItemsFrom(draft) : [blankItem()]));
  const [activeIndex, setActiveIndex] = useState(0);
  const [name, setName] = useState(draft?.bundle.name ?? "");

  const active = items[activeIndex];
  const dateStr = useMemo(() => formatDate(new Date()), []);

  const updateActive = (patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((it, i) => (i === activeIndex ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, blankItem()]);
    setActiveIndex(items.length);
  };

  const removeActive = () => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== activeIndex));
    setActiveIndex((i) => Math.max(0, i - (i === items.length - 1 ? 1 : 0)));
  };

  const hasContent = (it: ItemDraft) => it.paths.length > 0 || it.audio !== null || it.photo !== null;
  const canSubmit = items.some(hasContent);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const finalDrafts = items.some(hasContent) ? items.filter(hasContent) : items;

    const ticketItems: TicketItem[] = finalDrafts.map((it) => ({
      id: it.id,
      color: it.color,
      paths: it.paths,
      audioType: it.audio?.mimeType ?? "",
      duration: it.audio?.duration ?? 0,
      peaks: it.audio?.peaks ?? [],
      photoType: it.photo?.mimeType ?? "",
    }));
    const audioBuffers = finalDrafts.map((it) => it.audio?.bytes ?? null);
    const photoBuffers = finalDrafts.map((it) => it.photo?.bytes ?? null);

    const bundle: TicketBundle = { v: 3, name: name.trim(), date: formatDate(new Date()), items: ticketItems };
    const encoded = encodeTicket(bundle, audioBuffers, photoBuffers);
    navigate(`/share#${encoded}`);
  };

  const previewItems: TicketItem[] = items.map((it) => ({
    id: it.id,
    color: it.color,
    paths: it.paths,
    audioType: it.audio?.mimeType ?? "",
    duration: it.audio?.duration ?? 0,
    peaks: it.audio?.peaks ?? [],
    photoType: it.photo?.mimeType ?? "",
  }));
  const previewAudio = items.map((it) =>
    it.audio ? { bytes: new Uint8Array(0), mimeType: "", duration: it.audio.duration, peaks: it.audio.peaks } : null,
  );
  const previewPhoto = items.map((it) => (it.photo ? { bytes: it.photo.bytes, mimeType: it.photo.mimeType } : null));

  return (
    <div className="mx-auto flex min-h-screen max-w-app flex-col">
      <Header />

      <main className="flex-1 px-6 pb-10 pt-8">
        <div className="text-center">
          <p className="font-sans text-sm font-bold">PREVIEW</p>
          <p className="font-sans text-sm text-ink/50">Your inbox</p>
        </div>

        <div className="mx-auto mt-4 max-w-[240px]">
          <TicketStack
            items={previewItems}
            audioList={previewAudio}
            photoList={previewPhoto}
            dateStr={dateStr}
            headlineTop="You have"
            headlineBottom="a new message!"
            activeIndex={activeIndex}
            onIndexChange={setActiveIndex}
          />
        </div>

        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Edit card ${i + 1}`}
              aria-pressed={i === activeIndex}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink font-mono text-sm ${
                i === activeIndex ? "bg-ink text-paper" : "bg-transparent"
              }`}
            >
              {i + 1}
            </button>
          ))}
          {items.length < MAX_ITEMS && (
            <button
              type="button"
              onClick={addItem}
              aria-label="Add another voiceme card"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ink/50 text-ink/60"
            >
              +
            </button>
          )}
          {items.length > 1 && (
            <button
              type="button"
              onClick={removeActive}
              className="ml-auto shrink-0 font-mono text-xs text-ink/50 underline decoration-dotted underline-offset-4"
            >
              remove card {activeIndex + 1}
            </button>
          )}
        </div>

        <h2 className="mt-6 font-sans text-3xl font-extrabold">
          {items.length > 1 ? `design card ${activeIndex + 1}` : "design your voiceme"}
        </h2>

        <section className="mt-6">
          <p className="font-sans text-sm">color:</p>
          <div className="mt-2 flex gap-3">
            {TICKET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateActive({ color: c })}
                aria-label={`${c} ticket`}
                aria-pressed={active.color === c}
                className="h-9 w-9 rounded-full border-2"
                style={{
                  backgroundColor: COLOR_HEX[c],
                  borderColor: active.color === c ? "#17130f" : "transparent",
                }}
              />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <p className="font-sans text-sm">draw something:</p>
          <div className="mt-2">
            <DrawingCanvas key={active.id} paths={active.paths} onChange={(paths) => updateActive({ paths })} />
          </div>
        </section>

        <section className="mt-7">
          <p className="font-sans text-sm">send voiceme (optional):</p>
          <div className="mt-2">
            <AudioRecorder key={active.id} value={active.audio} onChange={(audio) => updateActive({ audio })} />
          </div>
        </section>

        <section className="mt-7">
          <p className="font-sans text-sm">add a photo (optional):</p>
          <div className="mt-2">
            <PhotoCapture key={active.id} value={active.photo} onChange={(photo) => updateActive({ photo })} />
          </div>
        </section>

        <section className="mt-7">
          <label htmlFor="sender-name" className="font-sans text-sm">
            your name (optional):
          </label>
          <input
            id="sender-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="enter your name"
            className="mt-2 w-full rounded-xl border-2 border-ink bg-transparent px-4 py-3 font-sans placeholder:text-ink/40 focus:outline-none"
          />
        </section>

        {!canSubmit && (
          <p className="mt-6 text-center font-mono text-xs text-ink/50">
            draw something, record a voice note, or add a photo to continue
          </p>
        )}

        <div className="mt-8">
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
            get this as a link
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}
