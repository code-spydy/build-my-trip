import { Formik, Form } from "formik";
import { Button, Flex, Typography } from "antd";
import StepHeader from "./StepHeader";
import SelectableTile from "../common/SelectableTile";
import { useWizardContext } from "../../context/WizardContext";
import { INTEREST_META } from "../../utils/constants";
import { interestsSchema } from "../../utils/validationSchemas";

// A multi-select of tiles, not a text/select/radio/checkbox field — stays
// outside components/common/forms — but still validated through the same
// shared Yup schema as every other step (interestsSchema), not a
// hand-rolled duplicate of the same "at least 1" rule.
const INTEREST_ICONS = {
  adventure: "⛰",
  culture: "🏛",
  leisure: "🌿",
  attractions: "✨",
};

export default function StepInterests({ onContinue }) {
  const { state, actions } = useWizardContext();

  return (
    <Formik
      // The wizard reducer (via actions.toggleInterest) is the real source
      // of truth for `interests` — enableReinitialize keeps Formik's own
      // copy (and therefore validation) in sync with it on every tile click,
      // since each click produces a new state.form.interests array.
      initialValues={{ interests: state.form.interests }}
      enableReinitialize
      validationSchema={interestsSchema}
      onSubmit={() => onContinue()}
    >
      {({ errors, submitCount }) => (
        <Form>
          <StepHeader step={3} title="Interests" description="Pick what should shape your days." />
          <Flex wrap gap="small">
            {Object.entries(INTEREST_META).map(([key, meta]) => (
              <SelectableTile
                key={key}
                icon={INTEREST_ICONS[key]}
                label={meta.label}
                value={key}
                selected={state.form.interests.includes(key)}
                onClick={() => actions.toggleInterest(key)}
              />
            ))}
          </Flex>
          {submitCount > 0 && errors.interests && (
            <Typography.Text type="danger">{errors.interests}</Typography.Text>
          )}
          <Button type="primary" htmlType="submit" block size="large">
            Continue journey
          </Button>
        </Form>
      )}
    </Formik>
  );
}
