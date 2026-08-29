import { useField } from "formik";
import { Radio as AntRadio } from "antd";
import FieldCard from "../FieldCard";

export default function RadioField({ name, label, description, options = [], ...rest }) {
  const [field, meta, helpers] = useField(name);
  const error = meta.touched ? meta.error : undefined;

  return (
    <FieldCard label={label} description={description} error={error}>
      <AntRadio.Group
        {...rest}
        optionType="button"
        buttonStyle="solid"
        style={{ display: "flex", width: "100%" }}
        value={field.value ?? undefined}
        onChange={(e) => helpers.setValue(e.target.value)}
        onBlur={() => helpers.setTouched(true)}
      >
        {options.map((option) => (
          <AntRadio.Button key={option.value} value={option.value} style={{ flex: 1, textAlign: "center" }}>
            {option.label}
          </AntRadio.Button>
        ))}
      </AntRadio.Group>
    </FieldCard>
  );
}
