import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Select, Button, Modal, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import planeIconUrl from '../../assets/plane.svg';
import {
  ORIGIN,
  PLANE_HEADING_OFFSET,
  BASE_SCALE,
  MILESTONE_FRACTIONS,
  JOURNEY_ZOOM_MULTIPLIER,
  PREVIEW_TRANSITION_MS,
  PREVIEW_DRAW_MS,
  JOURNEY_ZOOM_MS,
  FLIGHT_DURATION_MS,
  WORLD_ATLAS_URLS,
  scaleForDistance,
} from '../../config/journeyConfig';
import { useJourneyReducer } from '../../hooks/useJourneyReducer';
import useReducedMotion from '../../hooks/useReducedMotion';
import './JourneyGlobe.css';

const W = 680;
const H = 320;
const CX = W / 2;
const CY = H / 2;

// Default modal body, used only if the caller doesn't pass a `steps` prop.
// In the real app, pass the actual StepTripBasics / StepTravelers / etc.
// components here instead — see the `steps` prop below.
function DefaultStepBody({ title, onContinue, isLast }) {
  return (
    <div className="jg-modal-body">
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Text type="secondary">
        Replace this with the real step form component for this stop.
      </Typography.Text>
      <Button type="primary" block onClick={onContinue}>
        {isLast ? 'Generate itinerary' : 'Continue journey'}
      </Button>
    </div>
  );
}

/**
 * JourneyGlobe
 *
 * Flow: user picks a destination from the dropdown -> globe rotates + zooms
 * to preview the route -> "Start journey" zooms in tighter and lays 5
 * milestones along the route -> a plane flies stop-to-stop, opening a modal
 * (one of `steps`) at each stop.
 *
 * Props:
 *  - destinations: [{ id, name, coords: [lng, lat], pricePerNight }]
 *  - steps: optional [{ title, render: ({ onContinue, isLast }) => ReactNode }]
 *           defaults to a 5-entry placeholder if omitted
 *  - onComplete: optional (destination) => void, called after the last stop
 */
export default function JourneyGlobe({ destinations, steps, onComplete }) {
  const svgRef = useRef(null);
  const zoomGroupRef = useRef(null);
  const sphereRef = useRef(null);
  const gratRef = useRef(null);
  const landGRef = useRef(null);
  const arcGRef = useRef(null);
  const ptsGRef = useRef(null);
  const planeGRef = useRef(null);

  // Mutable, non-rendering state — deliberately refs, not useState, because
  // these are mutated every animation frame and must never trigger re-render.
  const projectionRef = useRef(null);
  const pathRef = useRef(null);
  const rafIdRef = useRef(null);
  const autoAngleRef = useRef(0);
  const tokenRef = useRef(0); // race-guard: bumped on every new selection
  const routeNodeRef = useRef(null);

  const [state, dispatch] = useJourneyReducer();
  const [chipText, setChipText] = useState('');
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('Select destination');

  // Read via a ref inside the imperative d3/rAF code below so long-running
  // loops (auto-rotate, flight) always see the latest value, not a stale
  // closure from whichever render started them.
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const activeSteps =
    steps ||
    Array.from({ length: 5 }, (_, i) => ({
      title: ['Trip basics', 'Travelers', 'Interests', 'Duration', 'Review'][i],
    }));

  // ---- one-time setup: projection, path generator, world atlas, auto-rotate ----
  useEffect(() => {
    const projection = d3
      .geoOrthographic()
      .scale(BASE_SCALE)
      .translate([CX, CY])
      .clipAngle(90)
      .rotate([-ORIGIN[0], -20]);
    projectionRef.current = projection;
    pathRef.current = d3.geoPath(projection);

    d3.select(sphereRef.current).attr('cx', CX).attr('cy', CY).attr('r', BASE_SCALE);

    async function loadAtlas() {
      let worldTopo = null;
      for (const url of WORLD_ATLAS_URLS) {
        try {
          const res = await fetch(url);
          worldTopo = await res.json();
          break;
        } catch {
          // try next fallback
        }
      }
      if (!worldTopo) return;
      const countries = topojson.feature(worldTopo, worldTopo.objects.countries);
      d3.select(landGRef.current)
        .selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('fill', '#9CB380')
        .attr('stroke', '#7C9563')
        .attr('stroke-width', 0.4)
        .attr('d', pathRef.current);
      startAutoRotate();
    }
    loadAtlas();

    return () => cancelAutoRotate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redraw() {
    const projection = projectionRef.current;
    const path = pathRef.current;
    d3.select(sphereRef.current).attr('r', projection.scale());
    d3.select(gratRef.current).attr('d', path(d3.geoGraticule10()));
    d3.select(landGRef.current).selectAll('path').attr('d', path);
    const arcPath = d3.select(arcGRef.current).select('path');
    if (!arcPath.empty()) arcPath.attr('d', path);
    d3.select(ptsGRef.current)
      .selectAll('circle')
      .attr('cx', (m) => projection(m.__c)[0])
      .attr('cy', (m) => projection(m.__c)[1]);
  }

  function startAutoRotate() {
    // Guard against a second concurrent loop: React 19 StrictMode
    // double-invokes this mount effect in dev, so loadAtlas() runs twice and
    // can call startAutoRotate() twice. Without this guard both closures
    // schedule themselves forever, and cancelAutoRotate() can only ever
    // cancel whichever one most recently wrote rafIdRef — the other keeps
    // calling redraw() indefinitely and eventually throws once the journey
    // phase replaces the origin/destination circles (which carry a `__c`
    // datum) with milestone circles (which don't).
    if (rafIdRef.current) return;

    function step() {
      // prefers-reduced-motion: freeze rotation but keep the loop alive so
      // it can resume immediately if the OS setting changes mid-session.
      if (!reducedMotionRef.current) {
        autoAngleRef.current += 0.15;
        projectionRef.current.rotate([-ORIGIN[0] + autoAngleRef.current, -20]);
        redraw();
      }
      rafIdRef.current = requestAnimationFrame(step);
    }
    rafIdRef.current = requestAnimationFrame(step);
  }
  function cancelAutoRotate() {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }

  // Looks slightly ahead/behind the given fraction along the route path to
  // get a stable tangent direction (a 1-unit lookahead is too jittery on a
  // curved great-circle path).
  function tangentAngle(routeEl, len, frac) {
    const look = Math.max(3, len * 0.01);
    const l1 = Math.max(0, len * frac - look);
    const l2 = Math.min(len, len * frac + look);
    const a = routeEl.getPointAtLength(l1);
    const b = routeEl.getPointAtLength(l2);
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  }

  function placePlane(x, y, angle) {
    d3.select(planeGRef.current).selectAll('*').remove();
    const g = d3
      .select(planeGRef.current)
      .append('g')
      .attr('transform', `translate(${x},${y}) rotate(${angle + PLANE_HEADING_OFFSET})`);
    g.append('image')
      .attr('href', planeIconUrl)
      .attr('x', -11)
      .attr('y', -11)
      .attr('width', 22)
      .attr('height', 22);
  }

  function handleSelectDestination(index) {
    cancelAutoRotate();
    tokenRef.current += 1;
    const myToken = tokenRef.current;
    const projection = projectionRef.current;
    const path = pathRef.current;

    d3.select(arcGRef.current).selectAll('path').interrupt().remove();
    d3.select(ptsGRef.current).selectAll('circle').interrupt().remove();

    const dest = destinations[index];
    const distRad = d3.geoDistance(ORIGIN, dest.coords);
    const targetScale = scaleForDistance(distRad);
    const targetRotate = [
      -((ORIGIN[0] + dest.coords[0]) / 2),
      -((ORIGIN[1] + dest.coords[1]) / 2),
    ];
    const r0 = projection.rotate();
    const s0 = projection.scale();

    function drawRouteAndMarkers() {
      if (myToken !== tokenRef.current) return;
      const route = { type: 'LineString', coordinates: [ORIGIN, dest.coords] };
      const routeSel = d3
        .select(arcGRef.current)
        .selectAll('path')
        .data([route])
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', '#2F80ED')
        .attr('stroke-width', 1.5)
        .attr('stroke-linecap', 'round')
        .attr('d', path);
      const routeNode = routeSel.node();
      routeNodeRef.current = routeNode;
      const len = routeNode.getTotalLength();

      if (reducedMotionRef.current) {
        // Skip the draw-in reveal entirely — show the finished line immediately.
        routeSel.attr('stroke-dasharray', null).attr('stroke-dashoffset', null);
      } else {
        // Draw-in reveal, THEN clear the dasharray. Leaving a length-coupled
        // dasharray in place is what caused the "line only partially redraws"
        // bug when the globe was zoomed afterward — the dash pattern was
        // still tied to the path's length at reveal time, not its current
        // length. Always clear it once the reveal finishes.
        routeSel
          .attr('stroke-dasharray', len)
          .attr('stroke-dashoffset', len)
          .transition()
          .duration(PREVIEW_DRAW_MS)
          .ease(d3.easeCubicInOut)
          .attr('stroke-dashoffset', 0)
          .on('end', function () {
            d3.select(this).attr('stroke-dasharray', null);
          });
      }

      const markers = [
        { __c: ORIGIN, fill: '#2B3A42', r: 3 },
        { __c: dest.coords, fill: '#2F80ED', r: 4 },
      ];
      d3.select(ptsGRef.current)
        .selectAll('circle')
        .data(markers)
        .join('circle')
        .attr('cx', (m) => projection(m.__c)[0])
        .attr('cy', (m) => projection(m.__c)[1])
        .attr('r', (m) => m.r)
        .attr('fill', (m) => m.fill)
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5);
    }

    if (reducedMotionRef.current) {
      projection.rotate(targetRotate);
      projection.scale(targetScale);
      redraw();
      drawRouteAndMarkers();
    } else {
      d3.transition()
        .duration(PREVIEW_TRANSITION_MS)
        .ease(d3.easeCubicInOut)
        .tween('view', () => {
          const rInterp = d3.interpolate(r0, targetRotate);
          const sInterp = d3.interpolate(s0, targetScale);
          return (t) => {
            if (myToken !== tokenRef.current) return;
            projection.rotate(rInterp(t));
            projection.scale(sInterp(t));
            redraw();
          };
        })
        .on('end', drawRouteAndMarkers);
    }

    setChipText(`Gurugram → ${dest.name}`);
    setCtaLabel('Start journey');
    setCtaEnabled(true);
    dispatch({ type: 'SELECT_DESTINATION', index });
  }

  function handleStartJourney() {
    const grpEl = zoomGroupRef.current;

    function onZoomDone() {
      grpEl.removeEventListener('transitionend', onZoomDone);
      const routeNode = routeNodeRef.current;
      // Fixed, length-INDEPENDENT dash pattern for the journey phase — this
      // is the correct way to draw a dotted line, unlike the length-coupled
      // reveal trick above. It stays correct even if geometry changes later.
      d3.select(arcGRef.current)
        .select('path')
        .attr('stroke-dasharray', '3 9')
        .attr('stroke-width', 1.5)
        .attr('stroke', '#2F80ED');

      const len = routeNode.getTotalLength();
      d3.select(ptsGRef.current).selectAll('circle').remove();
      MILESTONE_FRACTIONS.forEach((f) => {
        const p = routeNode.getPointAtLength(len * f);
        d3.select(ptsGRef.current)
          .append('circle')
          .attr('cx', p.x)
          .attr('cy', p.y)
          .attr('r', 3)
          .attr('fill', '#D8CBB0')
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 1.5);
      });

      const p0 = routeNode.getPointAtLength(0);
      const ang0 = tangentAngle(routeNode, len, 0);
      placePlane(p0.x, p0.y, ang0);

      dispatch({ type: 'OPEN_MILESTONE_MODAL', index: 0 });
    }

    if (reducedMotionRef.current) {
      grpEl.style.transition = 'none';
      grpEl.style.transform = `scale(${JOURNEY_ZOOM_MULTIPLIER})`;
      onZoomDone();
    } else {
      grpEl.style.transformOrigin = `${CX}px ${CY}px`;
      grpEl.style.transition = `transform ${JOURNEY_ZOOM_MS}ms cubic-bezier(.45,.05,.2,1)`;
      grpEl.addEventListener('transitionend', onZoomDone);

      // Double rAF ensures the `transition` property above is committed before
      // we change `transform` — otherwise the browser can skip the transition
      // entirely on the very first change.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          grpEl.style.transform = `scale(${JOURNEY_ZOOM_MULTIPLIER})`;
        });
      });
    }

    dispatch({ type: 'START_JOURNEY' });
  }

  // fromIndex/toIndex (not just a single "next" index) so the same function
  // drives both forward continue-flights and backward back-button flights —
  // the interpolation itself (fromFrac + (toFrac-fromFrac)*t) already works
  // in either direction, it just needs the real starting milestone.
  function flyToMilestone(fromIndex, toIndex, onArrive) {
    const routeNode = routeNodeRef.current;
    const len = routeNode.getTotalLength();
    const toFrac = MILESTONE_FRACTIONS[toIndex];

    if (reducedMotionRef.current) {
      const p = routeNode.getPointAtLength(len * toFrac);
      const ang = tangentAngle(routeNode, len, toFrac);
      d3.select(planeGRef.current)
        .select('g')
        .attr('transform', `translate(${p.x},${p.y}) rotate(${ang + PLANE_HEADING_OFFSET})`);
      onArrive();
      return;
    }

    const fromFrac = MILESTONE_FRACTIONS[fromIndex];
    const start = Date.now();

    function step() {
      const t = Math.min(1, (Date.now() - start) / FLIGHT_DURATION_MS);
      const frac = fromFrac + (toFrac - fromFrac) * t;
      const p = routeNode.getPointAtLength(len * frac);
      const ang = tangentAngle(routeNode, len, frac);
      d3.select(planeGRef.current)
        .select('g')
        .attr('transform', `translate(${p.x},${p.y}) rotate(${ang + PLANE_HEADING_OFFSET})`);
      if (t < 1) requestAnimationFrame(step);
      else onArrive();
    }
    requestAnimationFrame(step);
  }

  function handleContinue() {
    const completedIndex = state.activeModal;
    dispatch({ type: 'COMPLETE_MILESTONE' });
    if (completedIndex < 4) {
      flyToMilestone(completedIndex, completedIndex + 1, () => {
        dispatch({ type: 'OPEN_MILESTONE_MODAL', index: completedIndex + 1 });
      });
    } else {
      const dest = destinations[state.destinationIndex];
      if (onComplete) onComplete(dest);
    }
  }

  // Flies back to the previous milestone's modal. Doesn't touch
  // lastCompleted — the step being revisited was already validly completed,
  // this is just navigating back to it, not undoing it.
  function handleBack() {
    const current = state.activeModal;
    if (current === null || current <= 0) return;
    dispatch({ type: 'OPEN_MILESTONE_MODAL', index: null });
    flyToMilestone(current, current - 1, () => {
      dispatch({ type: 'OPEN_MILESTONE_MODAL', index: current - 1 });
    });
  }

  function handleRestart() {
    d3.select(arcGRef.current).selectAll('path').remove();
    d3.select(ptsGRef.current).selectAll('circle').remove();
    d3.select(planeGRef.current).selectAll('*').remove();
    const grpEl = zoomGroupRef.current;
    grpEl.style.transition = 'none';
    grpEl.style.transform = 'scale(1)';
    projectionRef.current.scale(BASE_SCALE).rotate([-ORIGIN[0], -20]);
    redraw();
    setChipText('');
    setCtaEnabled(false);
    setCtaLabel('Select destination');
    dispatch({ type: 'RESET' });
    startAutoRotate();
  }

  // Milestone marker colors follow reducer state — recomputed whenever
  // lastCompleted / activeModal change (not on every animation frame).
  useEffect(() => {
    d3.select(ptsGRef.current)
      .selectAll('circle')
      .each(function (_, i) {
        const c = d3.select(this);
        if (i <= state.lastCompleted) {
          c.attr('fill', '#2F80ED').attr('stroke', '#FFFFFF').attr('stroke-width', 1.5).attr('r', 4);
        } else if (i === state.activeModal) {
          c.attr('fill', '#2F80ED').attr('stroke', '#2B3A42').attr('stroke-width', 2).attr('r', 4.5);
        } else {
          c.attr('fill', '#D8CBB0').attr('stroke', '#FFFFFF').attr('stroke-width', 1.5).attr('r', 3);
        }
      });
  }, [state.lastCompleted, state.activeModal]);

  const journeyDone = state.phase === 'journey' && state.lastCompleted === 4 && state.activeModal === null;
  const currentStep = state.activeModal !== null ? activeSteps[state.activeModal] : null;

  return (
    <div className="jg-root">
      {state.phase !== 'journey' && (
        <div className="jg-controls">
          <Select
            style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}
            placeholder="Choose your destination"
            value={state.destinationIndex ?? undefined}
            onChange={(index) => handleSelectDestination(Number(index))}
            popupMatchSelectWidth
            options={destinations.map((d, i) => ({
              value: i,
              label: `${d.name} — from ₹${d.pricePerNight.toLocaleString('en-IN')}/night`,
            }))}
          />
        </div>
      )}

      <div className="jg-scene-wrap">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="jg-svg">
          <g ref={zoomGroupRef}>
            <circle ref={sphereRef} fill="#BEE3EF" stroke="#9BC9DA" strokeWidth={1} />
            <path ref={gratRef} fill="none" stroke="#D7ECF2" strokeWidth={0.6} />
            <g ref={landGRef} />
            <g ref={arcGRef} />
            <g ref={ptsGRef} />
            <g ref={planeGRef} />
          </g>
        </svg>
        {/* {(journeyDone || chipText) && (
          <Tag className="jg-chip-top-right">
            {journeyDone ? `Trip planned — ${destinations[state.destinationIndex]?.name} awaits` : chipText}
          </Tag>
        )} */}

        <Modal
          open={Boolean(currentStep)}
          footer={null}
          closable={false}
          mask={{ closable: false }}
          centered
          destroyOnHidden
        >
          {currentStep && (
            <>
              {state.activeModal > 0 && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  style={{ marginBottom: 8, paddingLeft: 0 }}
                />
              )}
              <Typography.Text type="secondary">Stop {state.activeModal + 1} of 5</Typography.Text>
              {currentStep.render ? (
                currentStep.render({ onContinue: handleContinue, isLast: state.activeModal === 4 })
              ) : (
                <DefaultStepBody
                  title={currentStep.title}
                  onContinue={handleContinue}
                  isLast={state.activeModal === 4}
                />
              )}
            </>
          )}
        </Modal>
      </div>

      {state.phase !== 'journey' && (
        <div className="jg-footer">
          <Button type="primary" size="small" disabled={!ctaEnabled} onClick={handleStartJourney}>
            {ctaLabel}
          </Button>
        </div>
      )}
      {journeyDone && (
        <div className="jg-footer">
          <Button size="small" onClick={handleRestart}>
            Restart
          </Button>
        </div>
      )}
    </div>
  );
}
