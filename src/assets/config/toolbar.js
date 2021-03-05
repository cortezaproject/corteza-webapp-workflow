export default [
    {
        title: 'Swimlane',
        kind: 'visual',
        ref: 'swimlane'
    },
    {
        kind: 'hr'
    },
    {
        title: 'Trigger (Start)',
        kind: 'trigger',
        ref: 'start',
    },
    {
        title: 'Termination (End)',
        kind: 'termination'
    },
    {
        kind: 'hr'
    },
    {
        title: 'Expressions',
        kind: 'expressions',
    },
    {
        title: 'Function',
        kind: 'function'
    },
    {
        kind: 'hr'
    },
    {
        title: 'Iterator',
        kind: 'iterator'
    },
    {
        title: 'Break',
        kind: 'break'
    },
    {
        title: 'Continue',
        kind: 'continue'
    },
    {
        kind: 'hr'
    },
    {
        title: 'Error Handler',
        kind: 'error-handler'
    },
    {
        title: 'Error',
        kind: 'error'
    },
    {
        kind: 'hr'
    },
    {
        title: 'Gateway (Exclusive)',
        kind: 'gateway',
        ref: 'excl',
    },
    {
        title: 'Gateway (Inclusive)',
        kind: 'gateway',
        ref: 'incl',
    },
    {
        title: 'Gateway (Fork/Join)',
        kind: 'gateway',
        ref: 'fork',
    },
]

// Disabled steps
// Add tp /lib/style too when including, this file only defines the toolbar layout
// [
//     {
//       title: 'Event (Intermediate)',
//       type: 'event',
//       icon: 'icons/event_intermediate.svg',
//       kind: 'eventIntermediate'
//     },
//     {
//       title: 'Event (End)',
//       type: 'event',
//       icon: 'icons/event_end.svg',
//       kind: 'eventEnd'
//     },
//     {
//       title: 'Subprocess',
//       width: 80,
//       height: 80,
//       type: 'symbol',
//       icon: 'icons/subprocess.svg',
//       kind: 'subprocess'
//     },
//     {
//       title: 'Gateway (Inclusive)',
//       type: 'gateway',
//       icon: 'icons/gateway_inclusive.svg',
//       kind: 'gatewayInclusive'
//     },
//     {
//       title: 'Gateway (Parallel)',
//       type: 'gateway',
//       icon: 'icons/gateway_parallel.svg',
//       kind: 'gatewayParallel'
//     }
// ]
