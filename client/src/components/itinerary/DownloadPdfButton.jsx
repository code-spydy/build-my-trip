import { useState } from "react";
import { Button } from "antd";
import { downloadItineraryPdf } from "../../api/itinerary";

// Mobile Safari can open a blob URL in-tab instead of triggering a download,
// even with the `download` attribute set — fall back to window.open there.
function isMobileSafari() {
  const ua = window.navigator.userAgent;
  return /iP(hone|od|ad)/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

export default function DownloadPdfButton({ payload, disabled = false }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await downloadItineraryPdf(payload);
      const blobUrl = URL.createObjectURL(blob);

      if (isMobileSafari()) {
        window.open(blobUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "deyor-itinerary.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
      console.error("PDF download failed", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="primary" size="large" block disabled={disabled} loading={loading} onClick={handleDownload}>
      Download PDF
    </Button>
  );
}
