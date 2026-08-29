import InputField from "./Input";
import SelectField from "./Select";
import RadioField from "./Radio";
import CheckboxField from "./Checkbox";
import DateRangeField from "./DateRange";

// Single reusable entry point: <FormField type="input" name="..." ... />.
// type picks which Formik-bound widget renders; everything else forwards
// straight through to it.
export default function FormField({ type, ...props }) {
  switch (type) {
    case "input":
      return <InputField {...props} />;
    case "select":
      return <SelectField {...props} />;
    case "radio":
      return <RadioField {...props} />;
    case "checkbox":
      return <CheckboxField {...props} />;
    case "dateRange":
      return <DateRangeField {...props} />;
    default:
      return null;
  }
}
