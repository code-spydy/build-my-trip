import { Formik, Form } from "formik";
import { Button } from "antd";
import FormField from "../common/forms";
import StepHeader from "./StepHeader";
import { useWizardContext } from "../../context/WizardContext";
import { travelersSchema } from "../../utils/validationSchemas";

export default function StepTravelers({ onContinue }) {
  const { state, actions } = useWizardContext();

  return (
    <Formik
      initialValues={{
        travelers: state.form.travelers,
        rooms: state.form.rooms,
        adultsPerRoom: state.form.adultsPerRoom,
      }}
      validationSchema={travelersSchema}
      onSubmit={(values) => {
        actions.setField("travelers", Number(values.travelers));
        actions.setField("rooms", Number(values.rooms));
        actions.setField("adultsPerRoom", Number(values.adultsPerRoom));
        onContinue();
      }}
    >
      <Form>
        <StepHeader
          step={2}
          title="Travelers & rooms"
          description="Help us size the stay."
        />
        <FormField type="input" name="travelers" label="Travelers" inputType="number" min={1} />
        <FormField type="input" name="rooms" label="Rooms" inputType="number" min={1} />
        <FormField
          type="input"
          name="adultsPerRoom"
          label="Adults per room"
          inputType="number"
          min={1}
        />
        <Button type="primary" htmlType="submit" block size="large">
          Continue journey
        </Button>
      </Form>
    </Formik>
  );
}
