import { Spin, Flex } from "antd";

export default function LoadingPlane() {
  return (
    <Flex justify="center" align="center" style={{ padding: "80px 20px" }}>
      <Spin size="large" description="Charting your itinerary…">
        <div style={{ padding: 60 }} />
      </Spin>
    </Flex>
  );
}
