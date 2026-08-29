import { Formik, Form } from "formik";
import { Button, Descriptions, Space } from "antd";
import FormField from "../common/forms";
import StepHeader from "./StepHeader";
import InterestTag from "../common/InterestTag";
import { useWizardContext } from "../../context/WizardContext";
import { reviewSchema } from "../../utils/validationSchemas";
import { formatDate } from "../../utils/date";

export default function StepReview({ onContinue, isLast }) {
  const { state, actions } = useWizardContext();
  const { form } = state;

  const summaryItems = [
    { key: "trip", label: "Trip", children: `${form.tripType} trip · ${form.travelStyle} style` },
    {
      key: "travelers",
      label: "Travelers",
      children: `${form.travelers} travelers · ${form.rooms} rooms · ${form.adultsPerRoom} adults/room`,
    },
    {
      key: "interests",
      label: "Interests",
      children: (
        <Space size="small" wrap>
          {form.interests.map((interest) => (
            <InterestTag key={interest} interest={interest} size="small" />
          ))}
        </Space>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      children: `${form.durationBucket} (${form.days} days) · ${
        form.flexible ? "Flexible dates" : formatDate(form.departureDate)
      }`,
    },
  ];

  return (
    <Formik
      initialValues={{ contact: form.contact }}
      validationSchema={reviewSchema}
      onSubmit={(values) => {
        actions.setContact("name", values.contact.name);
        actions.setContact("phone", values.contact.phone);
        onContinue();
      }}
    >
      <Form>
        <StepHeader
          step={5}
          title="Review & generate"
          description="Almost there — confirm the details."
        />
        <Descriptions column={1} size="small" bordered items={summaryItems} style={{marginBottom: '1rem'}} />
        <FormField type="input" name="contact.name" label="Your name" />
        <FormField type="input" name="contact.phone" label="Phone number" inputType="tel" />
        <Button type="primary" htmlType="submit" block size="large">
          {isLast ? "Generate itinerary" : "Continue journey"}
        </Button>
      </Form>
    </Formik>
  );
}
