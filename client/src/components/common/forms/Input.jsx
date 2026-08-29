import { useField } from "formik";
import { Input as AntInput } from "antd";
import FieldCard from "../FieldCard";

// `inputType` (not `type`) for the HTML input type, since `type` is already
// claimed by the index.jsx dispatcher (input/select/radio/checkbox).
export default function InputField({
  name,
  label,
  description,
  placeholder,
  inputType = "text",
  ...rest
}) {
  const [field, meta] = useField(name);
  const error = meta.touched ? meta.error : undefined;

  return (
    <FieldCard label={label} description={description} error={error}>
      <AntInput
        style={{ width: "100%" }}
        {...field}
        {...rest}
        id={name}
        type={inputType}
        placeholder={placeholder}
        status={error ? "error" : undefined}
      />
    </FieldCard>
  );
}
