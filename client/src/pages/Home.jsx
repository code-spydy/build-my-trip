import { useCallback, useEffect, useState } from "react";
import { Result, Button } from "antd";
import AppHeader from "../components/common/AppHeader";
import WizardShell from "../components/wizard/WizardShell";
import ItineraryResult from "../components/itinerary/ItineraryResult";
import LoadingPlane from "../components/common/LoadingPlane";
import { useWizardState } from "../hooks/useWizardState";
import { WizardProvider } from "../context/WizardContext";
import { fetchDestinations } from "../api/destinations";

export default function Home() {
  const wizard = useWizardState();
  const { state, actions, meta } = wizard;

  // Tracked separately from the wizard's own status — this is "can we even
  // start the wizard" (the destination list loading), not itinerary
  // generation. Conflating the two previously meant a failed fetch just
  // left destinations as [], and WizardShell showed an unexplained,
  // permanent loading spinner with no way to tell "still loading" apart
  // from "never going to load" and no way to retry.
  const [destinationsStatus, setDestinationsStatus] = useState("loading");

  const loadDestinations = useCallback(() => {
    setDestinationsStatus("loading");
    fetchDestinations()
      .then((destinations) => {
        actions.setDestinations(destinations);
        setDestinationsStatus("ready");
      })
      .catch(() => {
        setDestinationsStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  const view = meta.isGenerating
    ? "generating"
    : state.status === "error"
      ? "error"
      : meta.isComplete
        ? "result"
        : "wizard";

  // Only the actual journey/globe view goes fullscreen — the destinations
  // loading/retry states (rendered before the wizard can even start) use the
  // normal centered, padded card like every other non-wizard view.
  const isFullscreenView = destinationsStatus === "ready" && view === "wizard";

  return (
    <>
      <AppHeader />

      <main className={isFullscreenView ? "app-main app-main--fullscreen" : "app-main"}>
        <WizardProvider value={wizard}>
          {destinationsStatus === "loading" && <LoadingPlane />}

          {destinationsStatus === "error" && (
            <Result
              status="error"
              title="Couldn't load destinations"
              subTitle="Check your connection and try again."
              extra={
                <Button type="primary" onClick={loadDestinations}>
                  Retry
                </Button>
              }
            />
          )}

          {destinationsStatus === "ready" && (
            <>
              {view === "generating" && <LoadingPlane />}

              {view === "error" && (
                <Result
                  status="error"
                  title="Something went wrong"
                  subTitle={state.error || "We couldn't generate your itinerary. Please try again."}
                  extra={
                    <Button type="primary" onClick={actions.reset}>
                      Try again
                    </Button>
                  }
                />
              )}

              {view === "result" && <ItineraryResult result={state.result} onReset={actions.reset} />}

              {view === "wizard" && <WizardShell />}
            </>
          )}
        </WizardProvider>
      </main>
    </>
  );
}
