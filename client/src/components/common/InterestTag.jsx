import { Tag } from "antd";
import { INTEREST_META } from "../../utils/constants";

// Single source of interest -> color, reused by the wizard tiles, the result
// view, and mirrored (by value) in the server's PDF color map.
export default function InterestTag({ interest, size = "medium" }) {
  const meta = INTEREST_META[interest];

  if (!meta) return null;

  return (
    <Tag color={meta.color} style={size === "small" ? { fontSize: 10, lineHeight: "16px" } : undefined}>
      {meta.label}
    </Tag>
  );
}
