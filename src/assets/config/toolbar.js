export default [
    {
        title: 'Swimlane',
        kind: 'visual',
        ref: 'swimlane'
    },
    {
        kind: 'break'
    },
    {
        kind: 'line'
    },
    {
        title: 'Expressions',
        kind: 'expressions',
    },
    {
        kind: 'break'
    },
    {
        title: 'Function',
        kind: 'function'
    },
    {
        kind: 'break'
    },
    {
        title: 'Iterator',
        kind: 'iterator'
    },
    {
        kind: 'break'
    },
    {
        kind: 'line'
    },
    {
        title: 'Trigger (Start)',
        kind: 'trigger',
        ref: 'start',
    },
    {
        kind: 'break'
    },
    {
        title: 'Error',
        kind: 'error-handler'
    },
    {
        kind: 'break'
    },
    {
        kind: 'line'
    },
    {
        title: 'Gateway (Exclusive)',
        kind: 'gateway',
        ref: 'excl',
    }
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
