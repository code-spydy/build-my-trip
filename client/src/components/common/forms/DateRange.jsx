import { useField, useFormikContext } from "formik";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import FieldCard from "../FieldCard";

const { RangePicker } = DatePicker;

// A range picker whose end date is always derived from the sibling `days`
// field (already chosen earlier in the same step), not independently
// editable — picking a start date locks the end date to
// (start + days - 1), so the visible range always matches whatever
// duration the user already selected, instead of letting the two drift out
// of sync. `name` still stores just the start date (ISO string), matching
// the existing `departureDate` field/API contract — no new wizard state.
export default function DateRangeField({ name, label, description }) {
  const [field, meta, helpers] = useField(name);
  const { values } = useFormikContext();
  const error = meta.touched ? meta.error : undefined;

  const days = Number(values.days) || 1;
  const start = field.value ? dayjs(field.value) : null;
  const end = start ? start.add(Math.max(days - 1, 0), "day") : null;

  return (
    <FieldCard label={label} description={description} error={error}>
      <RangePicker
        style={{ width: "100%" }}
        value={[start, end]}
        allowEmpty={[true, true]}
        disabled={[false, true]}
        disabledDate={(date) => date.isBefore(dayjs().startOf("day"))}
        onChange={(dates) => {
          const nextStart = dates?.[0];
          const value = nextStart ? nextStart.format("YYYY-MM-DD") : null;
          // setValue and setTouched each independently trigger Formik's
          // (async) validation when called separately — two validation
          // passes racing meant the second one could resolve using a stale
          // `values` snapshot from before this update and re-apply the old
          // "no date chosen" error even though a date was clearly picked.
          // shouldValidate:false on setTouched keeps this to a single,
          // correctly-ordered validation pass.
          helpers.setValue(value, true);
          helpers.setTouched(true, false);
        }}
      />
    </FieldCard>
  );
}
