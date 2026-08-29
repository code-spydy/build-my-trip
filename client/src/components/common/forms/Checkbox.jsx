import { useField } from "formik";
import { Checkbox as AntCheckbox } from "antd";
import FieldCard from "../FieldCard";

export default function CheckboxField({ name, label, description, ...rest }) {
  const [field, meta, helpers] = useField({ name, type: "checkbox" });
  const error = meta.touched ? meta.error : undefined;

  return (
    <FieldCard description={description} error={error}>
      <AntCheckbox
        {...rest}
        id={name}
        checked={Boolean(field.value)}
        onChange={(e) => helpers.setValue(e.target.checked)}
        onBlur={() => helpers.setTouched(true)}
      >
        {label}
      </AntCheckbox>
    </FieldCard>
  );
}
