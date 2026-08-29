import { Flex, Typography } from "antd";
import ActivityItem from "./ActivityItem";

// Renders one day's content — the numbered marker itself is drawn by the
// parent Timeline via its `dot` prop.
export default function ItineraryDay({ day }) {
  return (
    <Flex vertical gap={8} style={{ paddingBottom: 20 }}>
      <Typography.Text strong style={{ fontSize: 15 }}>
        Day {day.day} — {day.title}
      </Typography.Text>
      <Flex vertical gap={6}>
        {day.activities.map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </Flex>
    </Flex>
  );
}
