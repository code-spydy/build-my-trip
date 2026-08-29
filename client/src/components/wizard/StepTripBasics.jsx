import { Formik, Form } from "formik";
import { Button } from "antd";
import FormField from "../common/forms";
import StepHeader from "./StepHeader";
import { useWizardContext } from "../../context/WizardContext";
import { tripBasicsSchema } from "../../utils/validationSchemas";
import { TRIP_TYPES, TRAVEL_STYLES } from "../../utils/constants";

// Destination is chosen via the globe before the journey starts, so this
// step only covers the remaining Trip Basics fields.
const tripTypeOptions = Object.values(TRIP_TYPES).map((value) => ({ label: value, value }));
const travelStyleOptions = Object.values(TRAVEL_STYLES).map((value) => ({ label: value, value }));

export default function StepTripBasics({ onContinue }) {
  const { state, actions } = useWizardContext();

  return (
    <Formik
      initialValues={{
        tripType: state.form.tripType,
        travelStyle: state.form.travelStyle,
      }}
      validationSchema={tripBasicsSchema}
      onSubmit={(values) => {
        actions.setField("tripType", values.tripType);
        actions.setField("travelStyle", values.travelStyle);
        onContinue();
      }}
    >
      <Form>
        <StepHeader
          step={1}
          title="Trip basics"
          description="Tell us the shape of this trip."
        />
        <FormField type="radio" name="tripType" label="Trip type" options={tripTypeOptions} />
        <FormField
          type="radio"
          name="travelStyle"
          label="Travel style"
          options={travelStyleOptions}
        />
        <Button type="primary" htmlType="submit" block size="large">
          Continue journey
        </Button>
      </Form>
    </Formik>
  );
}
