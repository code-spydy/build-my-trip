import { Avatar, Button, Flex, Timeline, Typography } from "antd";
import ItineraryDay from "./ItineraryDay";
import CostSummary from "./CostSummary";
import DownloadPdfButton from "./DownloadPdfButton";
import { useWizardContext } from "../../context/WizardContext";

export default function ItineraryResult({ result, onReset }) {
  const { state } = useWizardContext();

  if (!result) return null;

  // The server is stateless — the PDF endpoint needs the full original
  // payload again, not just the generated result.
  const payload = { ...state.form, destinationId: result.destination.id };

  const timelineItems = result.itineraryDays.map((day) => ({
    key: day.day,
    dot: (
      <Avatar size={28} style={{ backgroundColor: "var(--color-dark)", padding: '14px' }}>
        {day.day}
      </Avatar>
    ),
    children: <ItineraryDay day={day} />,
  }));

  // No maxWidth/padding here — `.app-main` (the parent, see app.css) already
  // constrains and pads the page; a second, narrower box nested inside it
  // was compounding padding on every side and squeezing the timeline into
  // less room than the page actually had.
  return (
    <Flex vertical gap="large">
      <Flex vertical align="center">
        <Typography.Text type="secondary">Your itinerary</Typography.Text>
        <Typography.Title level={2} style={{ marginTop: 0 }}>
          {result.destination.name}
        </Typography.Title>
      </Flex>

      <Timeline items={timelineItems} />

      <CostSummary cost={result.cost} />

      <Flex gap="small" vertical={false} wrap>
        <DownloadPdfButton payload={payload} />
        <Button size="large" onClick={onReset}>
          Plan another trip
        </Button>
      </Flex>
    </Flex>
  );
}
