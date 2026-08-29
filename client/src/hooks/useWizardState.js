import { useReducer, useRef } from "react";
import { ACTIONS, WIZARD_STEPS } from "../utils/constants";

const initialForm = {
  destinationId: null,

  tripType: null,
  travelStyle: null,

  travelers: 1,
  rooms: 1,
  adultsPerRoom: 1,

  interests: [],

  durationBucket: null,
  days: null,
  departureDate: null,
  flexible: false,

  contact: {
    name: "",
    phone: "",
  },
};

const initialState = {
  currentStep: 0,
  status: "idle",

  form: initialForm,

  destinations: [],

  errors: {},

  result: null,

  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FIELD:
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value,
        },
        errors: {
          ...state.errors,
          [action.field]: undefined,
        },
      };

    case ACTIONS.SET_CONTACT:
      return {
        ...state,
        form: {
          ...state.form,
          contact: {
            ...state.form.contact,
            [action.field]: action.value,
          },
        },
        errors: {
          ...state.errors,
          [`contact.${action.field}`]: undefined,
        },
      };

    case ACTIONS.TOGGLE_INTEREST: {
      const exists = state.form.interests.includes(action.value);

      return {
        ...state,
        form: {
          ...state.form,
          interests: exists
            ? state.form.interests.filter(
                (interest) => interest !== action.value
              )
            : [...state.form.interests, action.value],
        },
        errors: {
          ...state.errors,
          interests: undefined,
        },
      };
    }

    case ACTIONS.NEXT_STEP:
      return {
        ...state,
        currentStep: Math.min(
          state.currentStep + 1,
          WIZARD_STEPS.length - 1
        ),
      };

    case ACTIONS.PREV_STEP:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };

    case ACTIONS.GO_TO_STEP:
      return {
        ...state,
        currentStep: Math.max(
          0,
          Math.min(action.index, WIZARD_STEPS.length - 1)
        ),
      };

    case ACTIONS.SET_ERRORS:
      return {
        ...state,
        errors: action.errors || {},
      };

    case ACTIONS.START_GENERATING:
      return {
        ...state,
        status: "generating",
        error: null,
        errors: {},
      };

    case ACTIONS.SET_RESULT:
      return {
        ...state,
        status: "done",
        result: action.result,
        error: null,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        status: "error",
        error: action.error,
      };

    case ACTIONS.SET_DESTINATIONS:
      return {
        ...state,
        destinations: action.destinations,
      };

    case ACTIONS.RESET:
      return {
        ...initialState,
        destinations: state.destinations,
      };

    default:
      return state;
  }
}

export function useWizardState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // React batches dispatch() and only applies it on the next render, so code
  // that dispatches and then synchronously needs the *result* in the same
  // tick (e.g. WizardShell.handleComplete, called immediately after
  // StepReview's onSubmit dispatches setContact) would otherwise read stale
  // state. Mirror every dispatch through the same pure `reducer` into a ref
  // so `getState()` is always accurate regardless of React's render timing.
  // (Every state change goes through dispatchAndMirror below, so the ref
  // never needs re-syncing from `state` during render.)
  const stateRef = useRef(state);

  function dispatchAndMirror(action) {
    stateRef.current = reducer(stateRef.current, action);
    dispatch(action);
  }

  const setField = (field, value) => {
    dispatchAndMirror({
      type: ACTIONS.SET_FIELD,
      field,
      value,
    });
  };

  const setContact = (field, value) => {
    dispatchAndMirror({
      type: ACTIONS.SET_CONTACT,
      field,
      value,
    });
  };

  const toggleInterest = (value) => {
    dispatchAndMirror({
      type: ACTIONS.TOGGLE_INTEREST,
      value,
    });
  };

  const nextStep = () => {
    dispatchAndMirror({
      type: ACTIONS.NEXT_STEP,
    });
  };

  const previousStep = () => {
    dispatchAndMirror({
      type: ACTIONS.PREV_STEP,
    });
  };

  const goToStep = (index) => {
    dispatchAndMirror({
      type: ACTIONS.GO_TO_STEP,
      index,
    });
  };

  const setErrors = (errors) => {
    dispatchAndMirror({
      type: ACTIONS.SET_ERRORS,
      errors,
    });
  };

  const startGenerating = () => {
    dispatchAndMirror({
      type: ACTIONS.START_GENERATING,
    });
  };

  const setResult = (result) => {
    dispatchAndMirror({
      type: ACTIONS.SET_RESULT,
      result,
    });
  };

  const setError = (error) => {
    dispatchAndMirror({
      type: ACTIONS.SET_ERROR,
      error,
    });
  };

  const setDestinations = (destinations) => {
    dispatchAndMirror({
      type: ACTIONS.SET_DESTINATIONS,
      destinations,
    });
  };

  const reset = () => {
    dispatchAndMirror({
      type: ACTIONS.RESET,
    });
  };

  const isGenerating = state.status === "generating";
  const isComplete = state.status === "done";

  return {
    state,
    dispatch,
    // Synchronous "latest state" accessor — see the dispatchAndMirror note
    // above. Use this instead of the `state` closure when a callback fires
    // immediately after a dispatch in the same tick (e.g. onComplete
    // handlers chained off a child's onSubmit).
    getState: () => stateRef.current,

    actions: {
      setField,
      setContact,
      toggleInterest,
      nextStep,
      previousStep,
      goToStep,
      setErrors,
      startGenerating,
      setResult,
      setError,
      setDestinations,
      reset,
    },

    meta: {
      isFirstStep: state.currentStep === 0,
      isLastStep: state.currentStep === WIZARD_STEPS.length - 1,
      isGenerating,
      isComplete,
    },
  };
}

export { initialState, initialForm, reducer };
