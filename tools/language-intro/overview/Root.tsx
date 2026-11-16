import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Overview, TOTAL_FRAMES} from './Overview';

registerRoot(() => <Composition id="Overview" component={Overview} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />);
