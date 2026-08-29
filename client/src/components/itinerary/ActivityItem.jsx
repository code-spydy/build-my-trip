import { Space, Typography } from "antd";
import InterestTag from "../common/InterestTag";

export default function ActivityItem({ activity }) {
  if (activity.isLeisure) {
    return (
      <Typography.Text italic type="secondary">
        {activity.description || activity.name}
      </Typography.Text>
    );
  }

  return (
    <Space size="small">
      <InterestTag interest={activity.interest} size="small" />
      <Typography.Text>
        {activity.name}
        {activity.isRepeat && (
          <Typography.Text type="warning"> · Encore</Typography.Text>
        )}
      </Typography.Text>
    </Space>
  );
}
