import { Form } from "antd";

export default function FieldCard({ label, description, error, children }) {
  return (
    <Form.Item
      label={label}
      layout="vertical"
      validateStatus={error ? "error" : undefined}
      help={error || description}
      style={{ marginBottom: 20 }}
    >
      {children}
    </Form.Item>
  );
}
