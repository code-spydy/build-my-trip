import { useField } from "formik";
import { Select as AntSelect } from "antd";
import FieldCard from "../FieldCard";

export default function SelectField({
  name,
  label,
  description,
  options = [],
  placeholder,
  onValueChange,
  ...rest
}) {
  const [field, meta, helpers] = useField(name);
  const error = meta.touched ? meta.error : undefined;

  return (
    <FieldCard label={label} description={description} error={error}>
      <AntSelect
        style={{ width: "100%" }}
        {...rest}
        id={name}
        value={field.value ?? undefined}
        placeholder={placeholder}
        status={error ? "error" : undefined}
        options={options}
        onChange={(value) => {
          helpers.setValue(value);
          onValueChange?.(value);
        }}
        onBlur={() => helpers.setTouched(true)}
      />
    </FieldCard>
  );
}
