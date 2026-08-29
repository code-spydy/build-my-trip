import { useMemo } from "react";
import JourneyGlobe from "../journey/JourneyGlobe";
import StepTripBasics from "./StepTripBasics";
import StepTravelers from "./StepTravelers";
import StepInterests from "./StepInterests";
import StepDuration from "./StepDuration";
import StepReview from "./StepReview";
import { useWizardContext } from "../../context/WizardContext";
import { withCoords } from "../../utils/destinationCoords";
import { generateItinerary } from "../../api/itinerary";

export default function WizardShell() {
  const { state, actions, getState } = useWizardContext();

  const destinations = useMemo(() => withCoords(state.destinations), [state.destinations]);

  // JourneyGlobe owns step/milestone progression itself (its own reducer) —
  // this just supplies the real form content for each of its 5 stops.
  const steps = useMemo(
    () => [
      {
        title: "Trip Basics",
        render: ({ onContinue }) => <StepTripBasics onContinue={onContinue} />,
      },
      {
        title: "Travelers & Rooms",
        render: ({ onContinue }) => <StepTravelers onContinue={onContinue} />,
      },
      {
        title: "Interests",
        render: ({ onContinue }) => <StepInterests onContinue={onContinue} />,
      },
      {
        title: "Duration & Dates",
        render: ({ onContinue }) => <StepDuration onContinue={onContinue} />,
      },
      {
        title: "Review & Generate",
        render: ({ onContinue, isLast }) => <StepReview onContinue={onContinue} isLast={isLast} />,
      },
    ],
    []
  );

  async function handleComplete(destination) {
    actions.setField("destinationId", destination.id);
    actions.startGenerating();

    // getState(), not the `state` closure — this runs synchronously right
    // after StepReview's onSubmit dispatched setContact, before React has
    // re-rendered, so `state.form` here would still be stale.
    const payload = { ...getState().form, destinationId: destination.id };

    try {
      const result = await generateItinerary(payload);
      actions.setResult(result);
    } catch (error) {
      actions.setError(error.userMessage || "Failed to generate your itinerary. Please try again.");
    }
  }

  // Home.jsx only ever mounts WizardShell once destinationsStatus === "ready",
  // so `destinations` is guaranteed non-empty here.
  return <JourneyGlobe destinations={destinations} steps={steps} onComplete={handleComplete} />;
}
