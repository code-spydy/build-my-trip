import { Formik, Form } from "formik";
import { Button } from "antd";
import FormField from "../common/forms";
import StepHeader from "./StepHeader";
import { useWizardContext } from "../../context/WizardContext";
import { durationSchema } from "../../utils/validationSchemas";
import { DURATION_RANGES } from "../../utils/constants";

const durationOptions = Object.keys(DURATION_RANGES).map((bucket) => ({
  label: `${bucket} days`,
  value: bucket,
}));

export default function StepDuration({ onContinue }) {
  const { state, actions } = useWizardContext();

  return (
    <Formik
      initialValues={{
        durationBucket: state.form.durationBucket,
        days: state.form.days ?? "",
        flexible: state.form.flexible,
        departureDate: state.form.departureDate ?? "",
      }}
      validationSchema={durationSchema}
      onSubmit={(values) => {
        actions.setField("durationBucket", values.durationBucket);
        actions.setField("days", Number(values.days));
        actions.setField("flexible", values.flexible);
        actions.setField("departureDate", values.flexible ? null : values.departureDate || null);
        onContinue();
      }}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <StepHeader step={4} title="Duration & dates" description="How long, and when." />
          <FormField
            type="select"
            name="durationBucket"
            label="Trip length"
            options={durationOptions}
            onValueChange={(value) => {
              const range = DURATION_RANGES[value];
              if (range) setFieldValue("days", range.min);
            }}
          />
          <FormField type="input" name="days" label="Exact days" inputType="number" min={1} />
          <FormField type="checkbox" name="flexible" label="My dates are flexible" />
          {!values.flexible && (
            <FormField
              type="dateRange"
              name="departureDate"
              label="Departure & return"
              description="Return date follows automatically from the days selected above."
            />
          )}
          <Button type="primary" htmlType="submit" block size="large" style={{ marginTop: "1rem" }}>
            Continue journey
          </Button>
        </Form>
      )}
    </Formik>
  );
}
