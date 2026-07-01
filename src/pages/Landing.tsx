import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PrimaryButton from "../components/PrimaryButton";
import TicketCard from "../components/TicketCard";
import { sampleDoodlePaths, samplePeaks } from "../lib/sampleDoodle";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-app flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center px-6 pb-10 pt-8 text-center">
        <p className="font-sans text-sm text-ink/50">your voiceme</p>

        <h1 className="mt-2 font-display text-6xl leading-[0.95] sm:text-7xl">Send the voice</h1>
        <p className="mt-3 font-mono text-lg text-ink/80">to someone you care about</p>

        <div className="mt-8 w-full">
          <TicketCard
            color="green"
            ticketId="00001"
            dateStr={formatDate(new Date())}
            paths={sampleDoodlePaths()}
            audio={{ bytes: new Uint8Array(0), mimeType: "", duration: 15, peaks: samplePeaks() }}
          />
        </div>

        <div className="mt-10 w-full">
          <PrimaryButton onClick={() => navigate("/create")}>create your voiceme</PrimaryButton>
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
