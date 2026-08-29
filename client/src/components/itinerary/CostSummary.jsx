import { Card, Flex, Statistic, Typography } from "antd";
import { formatCurrency } from "../../utils/formatters";

export default function CostSummary({ cost }) {
  if (!cost) return null;

  return (
    <Card title="The investment" size="small">
      <Flex vertical gap={8}>
        <Flex justify="space-between">
          <Typography.Text>Accommodation</Typography.Text>
          <Typography.Text>{formatCurrency(cost.accommodation, cost.currency)}</Typography.Text>
        </Flex>
        <Flex justify="space-between">
          <Typography.Text>Activities</Typography.Text>
          <Typography.Text>{formatCurrency(cost.activities, cost.currency)}</Typography.Text>
        </Flex>
        <Statistic
          title="Estimated total"
          value={cost.total}
          formatter={() => formatCurrency(cost.total, cost.currency)}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Estimates only. Excludes flights, visas, and personal expenses.
        </Typography.Text>
      </Flex>
    </Card>
  );
}
