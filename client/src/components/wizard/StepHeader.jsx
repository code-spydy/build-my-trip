import { Typography } from "antd";

// The journey modal's own eyebrow ("Stop N of 5") already shows step
// numbering, so this only owns the title/description to avoid duplicating it.
export default function StepHeader({ step, title, description }) {
  return (
    <div aria-label={`Step ${step}`}>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        {title}
      </Typography.Title>
      {description && <Typography.Text type="secondary">{description}</Typography.Text>}
    </div>
  );
}
