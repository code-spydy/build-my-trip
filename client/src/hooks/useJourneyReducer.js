import { useReducer } from 'react';

// phase: 'select'    -> globe auto-rotates, dropdown + disabled CTA shown
//        'previewed' -> destination chosen, route drawn, CTA enabled
//        'journey'   -> zoomed in, milestones placed, plane flying/parked
const initialState = {
  phase: 'select',
  destinationIndex: null,
  lastCompleted: -1, // index of the last milestone whose modal was completed
  activeModal: null, // index of the milestone currently showing a modal, or null
};

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_DESTINATION':
      return {
        ...state,
        phase: 'previewed',
        destinationIndex: action.index,
        lastCompleted: -1,
        activeModal: null,
      };
    case 'START_JOURNEY':
      return { ...state, phase: 'journey' };
    case 'OPEN_MILESTONE_MODAL':
      return { ...state, activeModal: action.index };
    case 'COMPLETE_MILESTONE':
      // lastCompleted advances to whichever milestone's modal was just closed
      return { ...state, lastCompleted: state.activeModal, activeModal: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useJourneyReducer() {
  return useReducer(reducer, initialState);
}

export { initialState as journeyInitialState };
