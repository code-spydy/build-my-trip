import { Tag } from "antd";

export default function SelectableTile({ icon, label, value, selected, disabled = false, onClick }) {
  return (
    <Tag.CheckableTag
      checked={selected}
      disabled={disabled}
      onChange={() => !disabled && onClick?.(value)}
      style={{ fontSize: 16, padding: "10px 20px", borderRadius: 10 }}
    >
      {icon} {label}
    </Tag.CheckableTag>
  );
}
