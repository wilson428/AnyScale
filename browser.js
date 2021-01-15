import { select, selectAll, event } from 'd3-selection';
import { Scale } from './Scale'

import Vex from 'vexflow';

const VF = Vex.Flow;
Vex.Flow.Formatter.DEBUG = true;

export default Scale;