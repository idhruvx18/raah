/**
 * RAAH Scenario Definitions
 */

export const SCENARIOS = [
  {
    id: 'village_road',
    number: '01',
    title: 'Unmarked Village Road',
    description: 'Narrow, unstructured rural road with no lane markings. Mixed animal and pedestrian traffic. Unpredictable surface conditions.',
    hazards: ['No lane markings', 'Animal crossings', 'Pedestrians', 'Narrow clearance'],
    difficulty: 4,
    trafficDensity: 2,
    environment: 'rural',
    color: '#6B7B5C',
    bgGrad: ['#E8EDE0', '#D4DBC8'],
  },
  {
    id: 'intersection',
    number: '02',
    title: 'Unsignalized Intersection',
    description: 'Busy four-way intersection with no traffic signals. Multiple vehicles approaching from all directions simultaneously.',
    hazards: ['No signals', 'Multiple approach vectors', 'Right-of-way conflicts', 'High-speed merges'],
    difficulty: 5,
    trafficDensity: 5,
    environment: 'urban',
    color: '#5C6B7A',
    bgGrad: ['#E0E5EE', '#CDD4DF'],
  },
  {
    id: 'highway_merge',
    number: '03',
    title: 'Highway Merge',
    description: 'High-speed highway entry with a short merge lane. Vehicles approaching at speed from behind.',
    hazards: ['High relative velocity', 'Short merge window', 'Blind spots', 'Lane pressure'],
    difficulty: 4,
    trafficDensity: 4,
    environment: 'highway',
    color: '#7A6B5C',
    bgGrad: ['#EEE8E0', '#DFD4CC'],
  },
  {
    id: 'dense_market',
    number: '04',
    title: 'Dense Market Area',
    description: 'Chaotic urban bazaar with vehicles, motorcycles, pedestrians and street vendors occupying every available space.',
    hazards: ['Extreme density', 'Unpredictable pedestrians', 'Motorcycle swarms', 'Parked vehicle occlusion'],
    difficulty: 5,
    trafficDensity: 5,
    environment: 'urban_dense',
    color: '#7A5C40',
    bgGrad: ['#EEE0D4', '#DFCCBB'],
  },
  {
    id: 'cattle_crossing',
    number: '05',
    title: 'Cattle Crossing',
    description: 'Rural highway with a herd of cattle crossing. Unpredictable movement patterns and variable group size.',
    hazards: ['Unpredictable movement', 'Group dispersal', 'Low visibility', 'Complete road blockage'],
    difficulty: 3,
    trafficDensity: 1,
    environment: 'rural',
    color: '#6B5C45',
    bgGrad: ['#EDE8DF', '#DDD4C4'],
  },
]

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0]
}
