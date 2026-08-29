import { Layout, Typography, Flex, Avatar } from "antd";
import { CompassOutlined } from "@ant-design/icons";

export default function AppHeader() {
  return (
    <Layout.Header
      style={{
        background: "#fff",
        height: "var(--header-height)",
        lineHeight: "normal",
        paddingInline: 24,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Flex align="center" gap={12}>
        <Avatar size={36} style={{ backgroundColor: "var(--color-coral)" }} icon={<CompassOutlined />} />
        <Flex vertical gap={0}>
          <Typography.Text strong>DEYOR</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Build My Trip
          </Typography.Text>
        </Flex>
      </Flex>
    </Layout.Header>
  );
}
